"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);

var _helpers = require('../../shared/helpers');
var _errormiddleware = require('../../middleware/error.middleware');
var _notificationsservice = require('../notifications/notifications.service');

 const getPOSData = async (tenantId) => {
  const tables = await _database2.default.table.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' },
  });

  const menuCategories = await _database2.default.menuCategory.findMany({
    where: { tenantId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const menuItems = await _database2.default.menuItem.findMany({
    where: {
      tenantId,
      isAvailable: true,
      OR: [
        { menuCategoryId: null },
        { menuCategory: { isActive: true } }
      ]
    },
    orderBy: { name: 'asc' },
  });

  return {
    tables,
    menuCategories,
    menuItems,
  };
}; exports.getPOSData = getPOSData;

 const quickOrder = async (tenantId, userId, dto) => {
  const { tableId, items } = dto;

  // Retrieve menu items to calculate prices
  const menuItemIds = items.map((i) => i.menuItemId);
  const dbMenuItems = await _database2.default.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      tenantId,
    },
  });

  if (dbMenuItems.length !== menuItemIds.length) {
    throw _errormiddleware.createError.call(void 0, 'Some menu items were not found or do not belong to this tenant', 404);
  }

  const menuItemsMap = new Map(dbMenuItems.map((item) => [item.id, item]));

  // Calculate Order amount
  let subtotal = 0;
  items.forEach((item) => {
    const dbItem = menuItemsMap.get(item.menuItemId);
    subtotal += dbItem.price * item.quantity;
  });

  // Fetch Settings for taxes
  const settings = await _database2.default.tenantSettings.findUnique({
    where: { tenantId },
  });
  const taxRate = _nullishCoalesce(_optionalChain([settings, 'optionalAccess', _ => _.taxRate]), () => ( 18));
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  const result = await _database2.default.$transaction(async (tx) => {
    // 1. If tableId provided, set Table to OCCUPIED
    if (tableId) {
      const table = await tx.table.findFirst({
        where: { id: tableId, tenantId, isActive: true },
      });
      if (!table) throw _errormiddleware.createError.call(void 0, 'Table not found', 404);
      
      await tx.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    // 2. Create Order
    const orderNum = _helpers.generateOrderNumber.call(void 0, _optionalChain([settings, 'optionalAccess', _2 => _2.invoicePrefix]) || 'INV');
    const order = await tx.order.create({
      data: {
        tenantId,
        tableId: tableId || undefined,
        userId,
        orderNumber: orderNum,
        status: 'CONFIRMED',
        subtotal,
        taxAmount,
        totalAmount,
      },
    });

    // 3. Create OrderItems
    const orderItemsData = items.map((item) => {
      const dbItem = menuItemsMap.get(item.menuItemId);
      return {
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: dbItem.price,
        totalPrice: dbItem.price * item.quantity,
        notes: item.notes,
      };
    });

    // We need to create them one by one or createMany and retrieve
    await tx.orderItem.createMany({
      data: orderItemsData,
    });

    // Retrieve order items to get their IDs (required for KOTItem creation)
    const createdOrderItems = await tx.orderItem.findMany({
      where: { orderId: order.id },
    });

    // 4. Create KOT
    const kotNum = _helpers.generateKOTNumber.call(void 0, _optionalChain([settings, 'optionalAccess', _3 => _3.kotPrefix]) || 'KOT');
    const kot = await tx.kOT.create({
      data: {
        tenantId,
        orderId: order.id,
        userId,
        kotNumber: kotNum,
        status: 'PENDING',
      },
    });

    // 5. Create KOTItems mapping to OrderItems
    const kotItemsData = createdOrderItems.map((orderItem) => ({
      kotId: kot.id,
      orderItemId: orderItem.id,
      quantity: orderItem.quantity,
      notes: orderItem.notes,
    }));

    await tx.kOTItem.createMany({
      data: kotItemsData,
    });

    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        kots: {
          include: {
            items: true,
          },
        },
        table: true,
      },
    });
  });

  // Notify Chefs
  if (result) {
    const tableName = _optionalChain([result, 'access', _ => _.table, 'optionalAccess', _2 => _2.name]) || 'Quick POS';
    const itemsText = result.items.map(item => `${item.menuItem?.name} (x${item.quantity})`).join(', ');
    _notificationsservice.createNotification(tenantId, {
      role: 'CHEF',
      title: 'New Order Placed',
      message: `New order placed for ${tableName}. Items: ${itemsText}`,
      type: 'INFO',
    }).catch(err => console.error('Failed to create notification:', err));
  }

  return result;
}; exports.quickOrder = quickOrder;
