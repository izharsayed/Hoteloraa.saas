"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _errormiddleware = require('../../middleware/error.middleware');
var _helpers = require('../../shared/helpers');


const purchaseInclude = {
  vendor: {
    select: { id: true, name: true, phone: true, email: true },
  },
  items: {
    include: {
      inventoryItem: {
        select: { id: true, name: true, unit: true, sku: true },
      },
    },
  },
};

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

 const getPurchases = async (tenantId, query = {}) => {
  const { skip, take } = parsePagination(query);
  const status = query.status;
  const where = { tenantId };

  if (status) {
    where.status = status ;
  }

  const purchases = await _database2.default.purchase.findMany({
    where,
    include: purchaseInclude,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  return purchases;
}; exports.getPurchases = getPurchases;

 const getPurchaseById = async (tenantId, id) => {
  const purchase = await _database2.default.purchase.findFirst({
    where: { id, tenantId },
    include: purchaseInclude,
  });

  if (!purchase) {
    throw _errormiddleware.createError.call(void 0, 'Purchase not found', 404);
  }

  return purchase;
}; exports.getPurchaseById = getPurchaseById;

 const createPurchase = async (
  tenantId,
  dto
) => {
  const { vendorId, items, notes } = dto;

  // Validate vendor belongs to tenant if provided
  if (vendorId) {
    const vendor = await _database2.default.vendor.findFirst({
      where: { id: vendorId, tenantId, isActive: true },
    });
    if (!vendor) {
      throw _errormiddleware.createError.call(void 0, 'Vendor not found or inactive', 404);
    }
  }

  // Validate all inventory items belong to tenant
  const inventoryItemIds = [...new Set(items.map((item) => item.inventoryItemId))];
  const inventoryItems = await _database2.default.inventoryItem.findMany({
    where: { id: { in: inventoryItemIds }, tenantId, isActive: true },
  });

  if (inventoryItems.length !== inventoryItemIds.length) {
    throw _errormiddleware.createError.call(void 0, 
      'One or more inventory items not found or inactive',
      404
    );
  }

  // Calculate totals
  let subtotal = 0;
  const purchaseItems = items.map((item) => {
    const totalPrice = item.quantity * item.unitPrice;
    subtotal += totalPrice;
    return {
      inventoryItemId: item.inventoryItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice,
    };
  });

  const totalAmount = subtotal; // taxAmount can be added later via settings

  const purchase = await _database2.default.purchase.create({
    data: {
      tenantId,
      vendorId,
      purchaseNumber: _helpers.generateOrderNumber.call(void 0, 'PUR'),
      subtotal,
      taxAmount: 0,
      totalAmount,
      notes,
      items: {
        create: purchaseItems,
      },
    },
    include: purchaseInclude,
  });

  return purchase;
}; exports.createPurchase = createPurchase;

 const receivePurchase = async (tenantId, id) => {
  const purchase = await _database2.default.purchase.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });

  if (!purchase) {
    throw _errormiddleware.createError.call(void 0, 'Purchase not found', 404);
  }

  if (purchase.status === 'CANCELLED') {
    throw _errormiddleware.createError.call(void 0, 'Cannot receive a cancelled purchase', 400);
  }

  if (purchase.status === 'RECEIVED') {
    throw _errormiddleware.createError.call(void 0, 'Purchase has already been received', 400);
  }

  // Mark as received and update stock in a transaction
  const updatedPurchase = await _database2.default.$transaction(async (tx) => {
    // Increment inventory stock for each purchase item
    for (const item of purchase.items) {
      await tx.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: { quantity: { increment: item.quantity } },
      });
    }

    return tx.purchase.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        receivedAt: new Date(),
      },
      include: purchaseInclude,
    });
  });

  return updatedPurchase;
}; exports.receivePurchase = receivePurchase;

 const updateStatus = async (
  tenantId,
  id,
  status
) => {
  const purchase = await _database2.default.purchase.findFirst({
    where: { id, tenantId },
  });

  if (!purchase) {
    throw _errormiddleware.createError.call(void 0, 'Purchase not found', 404);
  }

  if (purchase.status === 'CANCELLED') {
    throw _errormiddleware.createError.call(void 0, 'Cannot update status of a cancelled purchase', 400);
  }

  const updated = await _database2.default.purchase.update({
    where: { id },
    data: { status },
    include: purchaseInclude,
  });

  return updated;
}; exports.updateStatus = updateStatus;
