"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _helpers = require('../../shared/helpers');

var _purchasesservice = require('./purchases.service'); var purchaseService = _interopRequireWildcard(_purchasesservice);

 const listPurchases = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const purchases = await purchaseService.getPurchases(tenantId, req.query);
    _helpers.sendSuccess.call(void 0, res, purchases, 'Purchases retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.listPurchases = listPurchases;

 const getPurchase = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const purchase = await purchaseService.getPurchaseById(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, purchase, 'Purchase retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getPurchase = getPurchase;

 const createPurchase = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const purchase = await purchaseService.createPurchase(tenantId, req.body);
    _helpers.sendSuccess.call(void 0, res, purchase, 'Purchase created successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createPurchase = createPurchase;

 const receivePurchase = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const purchase = await purchaseService.receivePurchase(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, purchase, 'Purchase received and inventory updated');
  } catch (err) {
    next(err);
  }
}; exports.receivePurchase = receivePurchase;

 const updatePurchaseStatus = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status } = req.body ;
    const purchase = await purchaseService.updateStatus(tenantId, id, status);
    _helpers.sendSuccess.call(void 0, res, purchase, 'Purchase status updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updatePurchaseStatus = updatePurchaseStatus;
