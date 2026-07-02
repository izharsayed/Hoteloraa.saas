"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _inventoryservice = require('./inventory.service'); var inventoryService = _interopRequireWildcard(_inventoryservice);
var _helpers = require('../../shared/helpers');

 const getItems = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await inventoryService.getItems(tenantId, req.query);
    _helpers.sendSuccess.call(void 0, res, result, 'Inventory items retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getItems = getItems;

 const getItemById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const result = await inventoryService.getItemById(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, result, 'Inventory item retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getItemById = getItemById;

 const createItem = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await inventoryService.createItem(tenantId, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Inventory item created successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createItem = createItem;

 const updateItem = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const result = await inventoryService.updateItem(tenantId, id, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Inventory item updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateItem = updateItem;

 const adjustStock = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { quantity, reason } = req.body;
    const result = await inventoryService.adjustStock(tenantId, id, quantity, reason);
    _helpers.sendSuccess.call(void 0, res, result, 'Stock adjusted successfully');
  } catch (err) {
    next(err);
  }
}; exports.adjustStock = adjustStock;

 const getLowStockItems = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await inventoryService.getLowStockItems(tenantId);
    _helpers.sendSuccess.call(void 0, res, result, 'Low stock items retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getLowStockItems = getLowStockItems;

 const deleteItem = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    await inventoryService.deleteItem(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, null, 'Inventory item deleted successfully');
  } catch (err) {
    next(err);
  }
}; exports.deleteItem = deleteItem;
