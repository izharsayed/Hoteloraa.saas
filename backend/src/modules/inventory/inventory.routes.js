"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _inventorycontroller = require('./inventory.controller'); var inventoryController = _interopRequireWildcard(_inventorycontroller);
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _inventorydto = require('./inventory.dto');

const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

router.get('/',           _authmiddleware.checkPermission.call(void 0, 'INVENTORY', 'READ'),   inventoryController.getItems);
router.get('/logs',       _authmiddleware.checkPermission.call(void 0, 'INVENTORY', 'READ'),   inventoryController.getInventoryLogs);
router.get('/low-stock',  _authmiddleware.checkPermission.call(void 0, 'INVENTORY', 'READ'),   inventoryController.getLowStockItems);
router.get('/recipe/:menuItemId', _authmiddleware.checkPermission.call(void 0, 'MENU', 'READ'), inventoryController.getMenuItemIngredients);
router.post('/recipe/:menuItemId', _authmiddleware.checkPermission.call(void 0, 'MENU', 'UPDATE'), inventoryController.setMenuItemIngredients);
router.get('/:id',        _authmiddleware.checkPermission.call(void 0, 'INVENTORY', 'READ'),   inventoryController.getItemById);
router.post('/',          _authmiddleware.checkPermission.call(void 0, 'INVENTORY', 'CREATE'), _validatemiddleware.validate.call(void 0, _inventorydto.createItemSchema), inventoryController.createItem);
router.put('/:id',        _authmiddleware.checkPermission.call(void 0, 'INVENTORY', 'UPDATE'), _validatemiddleware.validate.call(void 0, _inventorydto.updateItemSchema), inventoryController.updateItem);
router.patch('/:id/adjust-stock', _authmiddleware.checkPermission.call(void 0, 'INVENTORY', 'UPDATE'), _validatemiddleware.validate.call(void 0, _inventorydto.adjustStockSchema), inventoryController.adjustStock);
router.delete('/:id',     _authmiddleware.checkPermission.call(void 0, 'INVENTORY', 'DELETE'), inventoryController.deleteItem);

exports. default = router;
