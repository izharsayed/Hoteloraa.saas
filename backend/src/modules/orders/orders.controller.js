"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _helpers = require('../../shared/helpers');
var _ordersservice = require('./orders.service'); var OrderService = _interopRequireWildcard(_ordersservice);

// ---------------------------------------------------------------------------
// GET /orders
// ---------------------------------------------------------------------------
 const getOrders = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;

    const orders = await OrderService.getOrders(tenantId, req.query);
    _helpers.sendSuccess.call(void 0, res, orders, 'Orders retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getOrders = getOrders;

// ---------------------------------------------------------------------------
// GET /orders/:id
// ---------------------------------------------------------------------------
 const getOrderById = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const order = await OrderService.getOrderById(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, order, 'Order retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getOrderById = getOrderById;

// ---------------------------------------------------------------------------
// POST /orders
// ---------------------------------------------------------------------------
 const createOrder = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    const order = await OrderService.createOrder(tenantId, userId, req.body);
    _helpers.sendSuccess.call(void 0, res, order, 'Order created successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createOrder = createOrder;

// ---------------------------------------------------------------------------
// PATCH /orders/:id/status
// ---------------------------------------------------------------------------
 const updateOrderStatus = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const order = await OrderService.updateOrderStatus(tenantId, id, req.body);
    _helpers.sendSuccess.call(void 0, res, order, 'Order status updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateOrderStatus = updateOrderStatus;

// ---------------------------------------------------------------------------
// POST /orders/:id/items
// ---------------------------------------------------------------------------
 const addItemsToOrder = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const order = await OrderService.addItemsToOrder(tenantId, id, req.body);
    _helpers.sendSuccess.call(void 0, res, order, 'Items added to order successfully');
  } catch (err) {
    next(err);
  }
}; exports.addItemsToOrder = addItemsToOrder;

// ---------------------------------------------------------------------------
// PATCH /orders/:id/items/:itemId/void
// ---------------------------------------------------------------------------
 const voidOrderItem = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const { id, itemId } = req.params;

    const item = await OrderService.voidOrderItem(tenantId, id, itemId);
    _helpers.sendSuccess.call(void 0, res, item, 'Order item voided successfully');
  } catch (err) {
    next(err);
  }
}; exports.voidOrderItem = voidOrderItem;

// ---------------------------------------------------------------------------
// DELETE /orders/:id
// ---------------------------------------------------------------------------
 const cancelOrder = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const order = await OrderService.cancelOrder(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, order, 'Order cancelled successfully');
  } catch (err) {
    next(err);
  }
}; exports.cancelOrder = cancelOrder;
