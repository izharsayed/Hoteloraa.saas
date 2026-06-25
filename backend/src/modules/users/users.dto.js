"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _zod = require('zod');

 const createUserSchema = _zod.z.object({
  name: _zod.z.string().min(2, 'Name must be at least 2 characters'),
  email: _zod.z.string().email('Invalid email address'),
  password: _zod.z.string().min(6, 'Password must be at least 6 characters'),
  phone: _zod.z.string().optional(),
  userRole: _zod.z.enum([
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'MANAGER',
    'RECEPTIONIST',
    'CAPTAIN',
    'CHEF',
    'HOUSEKEEPING',
    'ACCOUNTANT',
    'CASHIER',
  ]),
  roleId: _zod.z.string().uuid('Invalid role ID').optional(),
}); exports.createUserSchema = createUserSchema;

 const updateUserSchema = _zod.z.object({
  name: _zod.z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: _zod.z.string().optional(),
  userRole: _zod.z
    .enum([
      'SUPER_ADMIN',
      'TENANT_ADMIN',
      'MANAGER',
      'RECEPTIONIST',
      'CAPTAIN',
      'CHEF',
      'HOUSEKEEPING',
      'ACCOUNTANT',
      'CASHIER',
    ])
    .optional(),
  roleId: _zod.z.string().uuid('Invalid role ID').nullable().optional(),
}); exports.updateUserSchema = updateUserSchema;

 const resetPasswordSchema = _zod.z.object({
  newPassword: _zod.z.string().min(6, 'Password must be at least 6 characters'),
}); exports.resetPasswordSchema = resetPasswordSchema;




