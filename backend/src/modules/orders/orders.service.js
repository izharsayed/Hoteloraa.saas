"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _errormiddleware = require('../../middleware/error.middleware');
var _helpers = require('../../shared/helpers');

var _notificationsservice = require('../notifications/notifications.service'); var notificationsService = _interopRequireWildcard(_notificationsservice);

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

// ---------------------------------------------------------------------------
// Helper: recalculate and persist order totals
// ---------------------------------------------------------------------------
async function recalculateOrderTotals(orderId) {
  const items = await _database2.default.orderItem.findMany({
    where: { orderId, isVoid: false },
  });

  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalAmount = subtotal; // tax / discounts handled via billing module

  await _database2.default.order.update({
    where: { id: orderId },
    data: { subtotal, totalAmount },
  });
}

// ---------------------------------------------------------------------------
// getOrders
// ---------------------------------------------------------------------------
 const getOrders = async (tenantId, query = {}) => {
  const { skip, take } = parsePagination(query);
  const status = query.status ;
  const where = { tenantId };

  if (status) {
    where.status = status ;
  }

  const orders = await _database2.default.order.findMany({
    where,
    include: {
      table: { select: { id: true, name: true, floor: true, section: true } },
      user: { select: { id: true, name: true, email: true } },
      items: {
        where: { isVoid: false },
        include: {
          menuItem: { select: { id: true, name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  return orders;
}; exports.getOrders = getOrders;

// ---------------------------------------------------------------------------
// getOrderById
// ---------------------------------------------------------------------------
 const getOrderById = async (tenantId, id) => {
  const order = await _database2.default.order.findFirst({
    where: { id, tenantId },
    include: {
      table: true,
      user: { select: { id: true, name: true, email: true, userRole: true } },
      items: {
        include: {
          menuItem: true,
          kotItems: {
            include: {
              kot: { select: { id: true, kotNumber: true, status: true } },
            },
          },
        },
      },
      kots: {
        include: {
          items: {
            include: {
              orderItem: {
                include: { menuItem: { select: { id: true, name: true } } },
              },
            },
          },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      payment: true,
    },
  });

  if (!order) {
    throw _errormiddleware.createError.call(void 0, 'Order not found', 404);
  }

  return order;
}; exports.getOrderById = getOrderById;

// ---------------------------------------------------------------------------
// createOrder
// ---------------------------------------------------------------------------
 const createOrder = async (
  tenantId,
  userId,
  dto
) => {
  // Validate menu items belong to this tenant and are available
  const menuItemIds = dto.items.map((i) => i.menuItemId);

  const menuItems = await _database2.default.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      tenantId,
      isAvailable: true,
      OR: [
        { menuCategoryId: null },
        { menuCategory: { isActive: true } }
      ]
    },
  });

  if (menuItems.length !== menuItemIds.length) {
    throw _errormiddleware.createError.call(void 0, 
      'One or more menu items are invalid or unavailable for this tenant',
      422
    );
  }

  // Validate table if provided
  if (dto.tableId) {
    const table = await _database2.default.table.findFirst({
      where: { id: dto.tableId, tenantId, isActive: true },
    });
    if (!table) {
      throw _errormiddleware.createError.call(void 0, 'Table not found', 404);
    }
  }

  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  const orderNumber = _helpers.generateOrderNumber.call(void 0, 'ORD');

  // Build order item data and compute totals
  let subtotal = 0;
  const orderItemsData = dto.items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);
    const unitPrice = menuItem.price;
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;
    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes,
      unitPrice,
      totalPrice,
    };
  });

  const order = await _database2.default.order.create({
    data: {
      tenantId,
      userId,
      tableId: dto.tableId,
      orderNumber,
      status: 'PENDING',
      subtotal,
      totalAmount: subtotal,
      notes: dto.notes,
      items: { create: orderItemsData },
    },
    include: {
      table: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      items: {
        include: { menuItem: { select: { id: true, name: true, price: true } } },
      },
    },
  });

  // Mark the table as OCCUPIED
  if (dto.tableId) {
    await _database2.default.table.update({
      where: { id: dto.tableId },
      data: { status: 'OCCUPIED' },
    });
  }

  // Notify Chefs
  const itemsText = order.items.map(item => `${item.menuItem?.name} (x${item.quantity})`).join(', ');
  const tableName = _optionalChain([order, 'access', _ => _.table, 'optionalAccess', _2 => _2.name]) || 'Quick POS';
  await notificationsService.createNotification(tenantId, {
    role: 'CHEF',
    title: 'New Order Placed',
    message: `New order placed for ${tableName}. Items: ${itemsText}`,
    type: 'INFO',
  }).catch(err => console.error('Failed to create notification:', err));

  return order;
}; exports.createOrder = createOrder;

// ---------------------------------------------------------------------------
// updateOrderStatus
// ---------------------------------------------------------------------------
 const updateOrderStatus = async (
  tenantId,
  id,
  dto
) => {
  const order = await _database2.default.order.findFirst({ where: { id, tenantId } });

  if (!order) {
    throw _errormiddleware.createError.call(void 0, 'Order not found', 404);
  }

  const updatedOrder = await _database2.default.order.update({
    where: { id },
    data: { status: dto.status },
    include: {
      table: { select: { id: true, name: true, status: true } },
    },
  });

  // Release the table when order is served or completed
  if (
    order.tableId &&
    (dto.status === 'SERVED' || dto.status === 'COMPLETED')
  ) {
    await _database2.default.table.update({
      where: { id: order.tableId },
      data: { status: 'AVAILABLE' },
    });
  }

  return updatedOrder;
}; exports.updateOrderStatus = updateOrderStatus;

// ---------------------------------------------------------------------------
// addItemsToOrder
// ---------------------------------------------------------------------------
 const addItemsToOrder = async (
  tenantId,
  id,
  dto
) => {
  const order = await _database2.default.order.findFirst({ 
    where: { id, tenantId },
    include: { table: true }
  });

  if (!order) {
    throw _errormiddleware.createError.call(void 0, 'Order not found', 404);
  }

  if (['CANCELLED', 'COMPLETED'].includes(order.status)) {
    throw _errormiddleware.createError.call(void 0, 
      `Cannot add items to an order with status: ${order.status}`,
      422
    );
  }

  // Validate menu items
  const menuItemIds = dto.items.map((i) => i.menuItemId);
  const menuItems = await _database2.default.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      tenantId,
      isAvailable: true,
      OR: [
        { menuCategoryId: null },
        { menuCategory: { isActive: true } }
      ]
    },
  });

  if (menuItems.length !== menuItemIds.length) {
    throw _errormiddleware.createError.call(void 0, 
      'One or more menu items are invalid or unavailable for this tenant',
      422
    );
  }

  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  const newItemsData = dto.items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);
    return {
      orderId: id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes,
      unitPrice: menuItem.price,
      totalPrice: menuItem.price * item.quantity,
    };
  });

  await _database2.default.orderItem.createMany({ data: newItemsData });

  // Recalculate totals
  await recalculateOrderTotals(id);

  // Notify Chefs
  const tableName = _optionalChain([order, 'access', _ => _.table, 'optionalAccess', _2 => _2.name]) || 'Quick POS';
  const newItemsText = newItemsData.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);
    return `${menuItem.name} (x${item.quantity})`;
  }).join(', ');

  await notificationsService.createNotification(tenantId, {
    role: 'CHEF',
    title: 'Items Added to Order',
    message: `New items added for ${tableName}. Items: ${newItemsText}`,
    type: 'INFO',
  }).catch(err => console.error('Failed to create notification:', err));

  return _database2.default.order.findFirst({
    where: { id, tenantId },
    include: {
      items: {
        include: { menuItem: { select: { id: true, name: true, price: true } } },
      },
    },
  });
}; exports.addItemsToOrder = addItemsToOrder;

// ---------------------------------------------------------------------------
// voidOrderItem
// ---------------------------------------------------------------------------
 const voidOrderItem = async (
  tenantId,
  orderId,
  itemId
) => {
  // Confirm the order belongs to this tenant
  const order = await _database2.default.order.findFirst({ where: { id: orderId, tenantId } });

  if (!order) {
    throw _errormiddleware.createError.call(void 0, 'Order not found', 404);
  }

  if (['CANCELLED', 'COMPLETED'].includes(order.status)) {
    throw _errormiddleware.createError.call(void 0, 
      `Cannot void items on an order with status: ${order.status}`,
      422
    );
  }

  const orderItem = await _database2.default.orderItem.findFirst({
    where: { id: itemId, orderId },
  });

  if (!orderItem) {
    throw _errormiddleware.createError.call(void 0, 'Order item not found', 404);
  }

  if (orderItem.isVoid) {
    throw _errormiddleware.createError.call(void 0, 'Order item is already voided', 422);
  }

  const updated = await _database2.default.orderItem.update({
    where: { id: itemId },
    data: { isVoid: true },
  });

  // Recalculate totals after voiding
  await recalculateOrderTotals(orderId);

  return updated;
}; exports.voidOrderItem = voidOrderItem;

// ---------------------------------------------------------------------------
// cancelOrder
// ---------------------------------------------------------------------------
 const cancelOrder = async (tenantId, id) => {
  const order = await _database2.default.order.findFirst({ where: { id, tenantId } });

  if (!order) {
    throw _errormiddleware.createError.call(void 0, 'Order not found', 404);
  }

  if (order.status === 'CANCELLED') {
    throw _errormiddleware.createError.call(void 0, 'Order is already cancelled', 422);
  }

  if (order.status === 'COMPLETED') {
    throw _errormiddleware.createError.call(void 0, 'Cannot cancel a completed order', 422);
  }

  const cancelled = await _database2.default.order.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { table: { select: { name: true } } },
  });

  // Release the table
  if (order.tableId) {
    await _database2.default.table.update({
      where: { id: order.tableId },
      data: { status: 'AVAILABLE' },
    });
  }

  // Notify Chefs
  const tableName = _optionalChain([cancelled, 'access', _3 => _3.table, 'optionalAccess', _4 => _4.name]) || 'Quick POS';
  await notificationsService.createNotification(tenantId, {
    role: 'CHEF',
    title: 'Order Cancelled',
    message: `Order ${cancelled.orderNumber} for ${tableName} has been cancelled.`,
    type: 'WARNING',
  }).catch(err => console.error('Failed to create notification:', err));

  return cancelled;
}; exports.cancelOrder = cancelOrder;
