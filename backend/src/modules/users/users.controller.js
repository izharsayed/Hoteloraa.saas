"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _usersservice = require('./users.service'); var usersService = _interopRequireWildcard(_usersservice);
var _helpers = require('../../shared/helpers');

 const getUsers = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await usersService.getUsers(tenantId, req.query);
    _helpers.sendSuccess.call(void 0, res, result, 'Users retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getUsers = getUsers;

 const getUserById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const result = await usersService.getUserById(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, result, 'User retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getUserById = getUserById;

 const createUser = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await usersService.createUser(tenantId, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'User created successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createUser = createUser;

 const updateUser = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const result = await usersService.updateUser(tenantId, id, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'User updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateUser = updateUser;

 const toggleUserStatus = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    if (req.user.id === id) {
      res.status(400).json({ success: false, message: 'You cannot suspend or modify your own account status.' });
      return;
    }
    const result = await usersService.toggleUserStatus(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, result, 'User status toggled successfully');
  } catch (err) {
    next(err);
  }
}; exports.toggleUserStatus = toggleUserStatus;

 const resetPassword = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { newPassword } = req.body;
    const result = await usersService.resetPassword(tenantId, id, newPassword);
    _helpers.sendSuccess.call(void 0, res, result, 'Password reset successfully');
  } catch (err) {
    next(err);
  }
}; exports.resetPassword = resetPassword;
