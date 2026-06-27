"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) return obj;
  const newObj = {};
  if (obj != null) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
    }
  }
  newObj.default = obj;
  return newObj;
}

var _authservice = require('./auth.service');
var authService = _interopRequireWildcard(_authservice);
var _helpers = require('../../shared/helpers');
var _env = require('../../config/env');
var _env2 = _interopRequireWildcard(_env);

const AUTH_COOKIE_NAME = 'hoteloraa_token';

const cookieOptions = () => ({
  httpOnly: true,
  secure: _env2.default.nodeEnv === 'production',
  sameSite: _env2.default.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...cookieOptions(),
    maxAge: undefined,
  });
};

const withoutToken = (result) => {
  const { token: _token, ...safeResult } = result;
  return safeResult;
};

const register = async (req, res, next) => {
  try {
    const result = await authService.registerTenant(req.body);
    setAuthCookie(res, result.token);
    _helpers.sendSuccess.call(void 0, res, withoutToken(result), 'Tenant registered successfully', 201);
  } catch (err) { next(err); }
};
exports.register = register;

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    setAuthCookie(res, result.token);
    _helpers.sendSuccess.call(void 0, res, withoutToken(result), 'Login successful');
  } catch (err) { next(err); }
};
exports.login = login;

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Password changed');
  } catch (err) { next(err); }
};
exports.changePassword = changePassword;

const getProfile = async (req, res, next) => {
  try {
    const result = await authService.getProfile(req.user.id, req.user.tenantId);
    _helpers.sendSuccess.call(void 0, res, result);
  } catch (err) { next(err); }
};
exports.getProfile = getProfile;

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    _helpers.sendSuccess.call(void 0, res, result, result.message);
  } catch (err) { next(err); }
};
exports.forgotPassword = forgotPassword;

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    _helpers.sendSuccess.call(void 0, res, result, result.message);
  } catch (err) { next(err); }
};
exports.resetPassword = resetPassword;

const logout = (_req, res) => {
  clearAuthCookie(res);
  _helpers.sendSuccess.call(void 0, res, null, 'Logged out successfully');
};
exports.logout = logout;
