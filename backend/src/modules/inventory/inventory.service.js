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
