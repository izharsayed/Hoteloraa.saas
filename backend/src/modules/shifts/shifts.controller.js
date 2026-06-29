"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const shiftsService = require('./shifts.service');
const { sendSuccess } = require('../../shared/helpers');

const getShifts = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const result = await shiftsService.getShifts(req.user.tenantId, includeInactive);
    sendSuccess(res, result, 'Shifts retrieved');
  } catch (err) { next(err); }
};
exports.getShifts = getShifts;

const getShiftById = async (req, res, next) => {
  try {
    const result = await shiftsService.getShiftById(req.user.tenantId, req.params.id);
    sendSuccess(res, result, 'Shift retrieved');
  } catch (err) { next(err); }
};
exports.getShiftById = getShiftById;

const createShift = async (req, res, next) => {
  try {
    const result = await shiftsService.createShift(req.user.tenantId, req.user.id, req.body);
    sendSuccess(res, result, 'Shift created', 201);
  } catch (err) { next(err); }
};
exports.createShift = createShift;

const updateShift = async (req, res, next) => {
  try {
    const result = await shiftsService.updateShift(req.user.tenantId, req.params.id, req.body);
    sendSuccess(res, result, 'Shift updated');
  } catch (err) { next(err); }
};
exports.updateShift = updateShift;

const deleteShift = async (req, res, next) => {
  try {
    const result = await shiftsService.deleteShift(req.user.tenantId, req.params.id);
    sendSuccess(res, result, 'Shift deleted');
  } catch (err) { next(err); }
};
exports.deleteShift = deleteShift;

const getShiftEmployees = async (req, res, next) => {
  try {
    const result = await shiftsService.getShiftEmployees(req.user.tenantId, req.params.id);
    sendSuccess(res, result, 'Shift employees retrieved');
  } catch (err) { next(err); }
};
exports.getShiftEmployees = getShiftEmployees;

const assignEmployees = async (req, res, next) => {
  try {
    const result = await shiftsService.assignEmployeesToShift(
      req.user.tenantId, req.user.id, req.params.id, req.body
    );
    sendSuccess(res, result, 'Employees assigned to shift', 201);
  } catch (err) { next(err); }
};
exports.assignEmployees = assignEmployees;

const unassignEmployee = async (req, res, next) => {
  try {
    const result = await shiftsService.unassignEmployeeFromShift(
      req.user.tenantId, req.user.id, req.params.id, req.body.userId
    );
    sendSuccess(res, result, 'Employee removed from shift');
  } catch (err) { next(err); }
};
exports.unassignEmployee = unassignEmployee;

const getMyShift = async (req, res, next) => {
  try {
    const result = await shiftsService.getMyShift(req.user.tenantId, req.user.id);
    sendSuccess(res, result || null, 'Current shift retrieved');
  } catch (err) { next(err); }
};
exports.getMyShift = getMyShift;
