"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _bcryptjs = require('bcryptjs'); var _bcryptjs2 = _interopRequireDefault(_bcryptjs);
var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);

var _errormiddleware = require('../../middleware/error.middleware');

const SALT_ROUNDS = 12;

 const getUsers = async (tenantId, includeInactive = false) => {
  return _database2.default.user.findMany({
    where: {
      tenantId,
      // By default only return active users so deactivated staff
      // don't reappear in the directory on refresh.
      // Pass includeInactive=true to see the full list (e.g. SuperAdmin audit).
      ...(includeInactive ? {} : { isActive: true }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      userRole: true,
      roleId: true,
      isActive: true,
      lastLogin: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}; exports.getUsers = getUsers;

 const getUserById = async (tenantId, id) => {
  const user = await _database2.default.user.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      userRole: true,
      roleId: true,
      isActive: true,
      lastLogin: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) throw _errormiddleware.createError.call(void 0, 'User not found', 404);
  return user;
}; exports.getUserById = getUserById;

 const createUser = async (tenantId, dto) => {
  // Only block on ACTIVE users — allow re-onboarding with the same email
  // if the previous account was deactivated/suspended.
  const existing = await _database2.default.user.findFirst({
    where: { tenantId, email: dto.email },
  });

  if (existing) {
    if (existing.isActive) {
      throw _errormiddleware.createError.call(void 0, 'Email is already registered in this tenant', 400);
    }

    // Reactivate and update credentials/details for deactivated account
    const passwordHash = await _bcryptjs2.default.hash(dto.password, SALT_ROUNDS);
    const user = await _database2.default.user.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        userRole: dto.userRole,
        roleId: dto.roleId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userRole: true,
        roleId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return user;
  }

  const passwordHash = await _bcryptjs2.default.hash(dto.password, SALT_ROUNDS);

  const user = await _database2.default.user.create({
    data: {
      tenantId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      userRole: dto.userRole,
      roleId: dto.roleId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      userRole: true,
      roleId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return user;
}; exports.createUser = createUser;

 const updateUser = async (tenantId, id, dto) => {
  await exports.getUserById.call(void 0, tenantId, id);

  return _database2.default.user.update({
    where: { id },
    data: dto ,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      userRole: true,
      roleId: true,
      isActive: true,
      updatedAt: true,
    },
  });
}; exports.updateUser = updateUser;

 const toggleUserStatus = async (tenantId, id) => {
  const user = await exports.getUserById.call(void 0, tenantId, id);

  return _database2.default.user.update({
    where: { id },
    data: {
      isActive: !user.isActive,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });
}; exports.toggleUserStatus = toggleUserStatus;

 const resetPassword = async (tenantId, id, newPassword) => {
  await exports.getUserById.call(void 0, tenantId, id);

  const passwordHash = await _bcryptjs2.default.hash(newPassword, SALT_ROUNDS);

  await _database2.default.user.update({
    where: { id },
    data: {
      passwordHash,
    },
  });

  return { message: 'Password reset successful' };
}; exports.resetPassword = resetPassword;
