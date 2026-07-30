"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);

var _errormiddleware = require('../../middleware/error.middleware');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePagination = (query = {}) => {
  const page = toPositiveInt(query.page, DEFAULT_PAGE);
  const requestedLimit = toPositiveInt(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  return {
    skip: (page - 1) * limit,
    take: limit,
  };
};

 const getItems = async (tenantId, query = {}) => {
  const { skip, take } = parsePagination(query);
  const search = query.search;

  return _database2.default.inventoryItem.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: {
      name: 'asc',
    },
    skip,
    take,
  });
}; exports.getItems = getItems;

 const getItemById = async (tenantId, id) => {
  const item = await _database2.default.inventoryItem.findFirst({
    where: { id, tenantId, isActive: true },
  });
  if (!item) throw _errormiddleware.createError.call(void 0, 'Inventory item not found', 404);
  return item;
}; exports.getItemById = getItemById;

 const createItem = async (tenantId, dto) => {
  if (dto.sku) {
    const existing = await _database2.default.inventoryItem.findFirst({
      where: { tenantId, sku: dto.sku, isActive: true },
    });
    if (existing) throw _errormiddleware.createError.call(void 0, 'An item with this SKU already exists', 400);
  }

  return _database2.default.inventoryItem.create({
    data: {
      tenantId,
      name: dto.name,
      description: dto.description,
      sku: dto.sku,
      unit: dto.unit,
      quantity: dto.quantity,
      minimumStock: dto.minimumStock,
      costPrice: dto.costPrice,
    },
  });
}; exports.createItem = createItem;

 const updateItem = async (tenantId, id, dto) => {
  const item = await exports.getItemById.call(void 0, tenantId, id);

  if (dto.sku && dto.sku !== item.sku) {
    const existing = await _database2.default.inventoryItem.findFirst({
      where: { tenantId, sku: dto.sku, isActive: true, id: { not: id } },
    });
    if (existing) throw _errormiddleware.createError.call(void 0, 'An item with this SKU already exists', 400);
  }

  return _database2.default.inventoryItem.update({
    where: { id },
    data: dto ,
  });
}; exports.updateItem = updateItem;

 const adjustStock = async (tenantId, id, quantity, reason) => {
  const item = await exports.getItemById.call(void 0, tenantId, id);
  const newQuantity = item.quantity + quantity;

  if (newQuantity < 0) {
    throw _errormiddleware.createError.call(void 0, 'Stock quantity cannot be adjusted below zero', 400);
  }

  return _database2.default.inventoryItem.update({
    where: { id },
    data: {
      quantity: newQuantity,
      description: item.description 
        ? `${item.description}\nAdjustment: ${quantity > 0 ? '+' : ''}${quantity} (${reason})`
        : `Adjustment: ${quantity > 0 ? '+' : ''}${quantity} (${reason})`,
    },
  });
}; exports.adjustStock = adjustStock;

 const getLowStockItems = async (tenantId) => {
  const items = await _database2.default.inventoryItem.findMany({
    where: {
      tenantId,
      isActive: true,
    },
  });

  return items.filter((item) => item.quantity <= item.minimumStock);
}; exports.getLowStockItems = getLowStockItems;

 const deleteItem = async (tenantId, id) => {
  await exports.getItemById.call(void 0, tenantId, id);
  return _database2.default.inventoryItem.update({
    where: { id },
    data: { isActive: false },
  });
}; exports.deleteItem = deleteItem;

// ── Recipe & Order Stock Deduction Extensions ────────────────────────────────

const _notificationsservice = require('../notifications/notifications.service');

const convertQuantity = (amount, fromUnit, toUnit) => {
  if (!fromUnit || !toUnit || fromUnit === toUnit) return amount;
  
  // Weight conversion
  if ((fromUnit === 'GRAM' || fromUnit === 'GM') && (toUnit === 'KG' || toUnit === 'KILOGRAM')) return amount / 1000;
  if ((fromUnit === 'KG' || fromUnit === 'KILOGRAM') && (toUnit === 'GRAM' || toUnit === 'GM')) return amount * 1000;

  // Volume conversion
  if (fromUnit === 'ML' && (toUnit === 'LITRE' || toUnit === 'LITER')) return amount / 1000;
  if ((fromUnit === 'LITRE' || fromUnit === 'LITER') && toUnit === 'ML') return amount * 1000;

  return amount;
};

const deductStockForOrder = async (tenantId, orderId, orderItems) => {
  if (!orderItems || orderItems.length === 0) return;

  for (const item of orderItems) {
    const ingredients = await _database2.default.menuItemIngredient.findMany({
      where: { menuItemId: item.menuItemId },
      include: { inventoryItem: true },
    });

    for (const ing of ingredients) {
      const rawRequiredQty = ing.quantityRequired * item.quantity;
      const invItem = ing.inventoryItem;
      if (!invItem || !invItem.isActive) continue;

      // Convert recipe unit to inventory base unit
      const requiredQtyInBase = convertQuantity(rawRequiredQty, ing.unit, invItem.unit);
      const newQty = Math.max(0, invItem.quantity - requiredQtyInBase);

      await _database2.default.inventoryItem.update({
        where: { id: invItem.id },
        data: { quantity: newQty },
      });

      await _database2.default.inventoryLog.create({
        data: {
          tenantId,
          inventoryItemId: invItem.id,
          orderId: orderId,
          changeType: 'ORDER_DEDUCTION',
          quantityChange: -requiredQtyInBase,
          previousQuantity: invItem.quantity,
          newQuantity: newQty,
          unit: invItem.unit,
          reason: `Auto deduction for Order #${orderId.slice(0, 8)} (${rawRequiredQty} ${ing.unit})`,
        },
      });

      if (newQty <= invItem.minimumStock) {
        await _notificationsservice.createNotification(tenantId, {
          role: 'MANAGER',
          title: 'Low Stock Alert',
          message: `Stock for "${invItem.name}" dropped to ${newQty} ${invItem.unit} (Threshold: ${invItem.minimumStock})`,
          type: 'WARNING',
        }).catch(() => {});
      }
    }
  }
}; exports.deductStockForOrder = deductStockForOrder;

const restockForCancelledOrder = async (tenantId, orderId) => {
  const logs = await _database2.default.inventoryLog.findMany({
    where: { tenantId, orderId, changeType: 'ORDER_DEDUCTION' },
    include: { inventoryItem: true },
  });

  for (const log of logs) {
    const invItem = log.inventoryItem;
    if (!invItem) continue;

    const qtyToRestore = Math.abs(log.quantityChange);
    const newQty = invItem.quantity + qtyToRestore;

    await _database2.default.inventoryItem.update({
      where: { id: invItem.id },
      data: { quantity: newQty },
    });

    await _database2.default.inventoryLog.create({
      data: {
        tenantId,
        inventoryItemId: invItem.id,
        orderId: orderId,
        changeType: 'RESTOCK_CANCEL',
        quantityChange: qtyToRestore,
        previousQuantity: invItem.quantity,
        newQuantity: newQty,
        unit: log.unit,
        reason: `Restocked due to Order cancellation #${orderId.slice(0, 8)}`,
      },
    });
  }
}; exports.restockForCancelledOrder = restockForCancelledOrder;

const getInventoryLogs = async (tenantId) => {
  return _database2.default.inventoryLog.findMany({
    where: { tenantId },
    include: {
      inventoryItem: { select: { id: true, name: true, sku: true, unit: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}; exports.getInventoryLogs = getInventoryLogs;

const getMenuItemIngredients = async (tenantId, menuItemId) => {
  return _database2.default.menuItemIngredient.findMany({
    where: { menuItemId, menuItem: { tenantId } },
    include: {
      inventoryItem: { select: { id: true, name: true, sku: true, unit: true, quantity: true, costPrice: true } },
    },
  });
}; exports.getMenuItemIngredients = getMenuItemIngredients;

const setMenuItemIngredients = async (tenantId, menuItemId, ingredients) => {
  await _database2.default.menuItemIngredient.deleteMany({
    where: { menuItemId },
  });

  if (!ingredients || ingredients.length === 0) return [];

  const data = ingredients.map(ing => ({
    menuItemId,
    inventoryItemId: ing.inventoryItemId,
    quantityRequired: parseFloat(ing.quantityRequired),
    unit: ing.unit || 'PIECE',
  }));

  await _database2.default.menuItemIngredient.createMany({ data });

  return exports.getMenuItemIngredients(tenantId, menuItemId);
}; exports.setMenuItemIngredients = setMenuItemIngredients;

