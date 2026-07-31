"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _bcryptjs = require('bcryptjs'); var _bcryptjs2 = _interopRequireDefault(_bcryptjs);
var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);

var _errormiddleware = require('../../middleware/error.middleware');

const SALT_ROUNDS = 12;

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

const shouldIncludeInactive = (queryOrFlag) => {
  if (typeof queryOrFlag === 'boolean') return queryOrFlag;
  return queryOrFlag && String(queryOrFlag.includeInactive).toLowerCase() === 'true';
};

 const getUsers = async (tenantId, queryOrFlag = {}) => {
  const query = typeof queryOrFlag === 'object' && queryOrFlag !== null ? queryOrFlag : {};
  const { skip, take } = parsePagination(query);
  // Default to true so deactivated/suspended staff remain visible in staff management directory
  const includeInactive = query.includeInactive === 'false' ? false : true;

  return _database2.default.user.findMany({
    where: {
      tenantId,
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
    skip,
    take,
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

 const toggleUserStatus = async (tenantId, id, requestingUserId) => {
  const user = await exports.getUserById.call(void 0, tenantId, id);

  // If user is currently active and being deactivated
  if (user.isActive) {
    if (requestingUserId && user.id === requestingUserId) {
      throw _errormiddleware.createError.call(void 0, 'You cannot suspend your own account', 400);
    }

    if (user.userRole === 'TENANT_ADMIN') {
      const activeAdminCount = await _database2.default.user.count({
        where: {
          tenantId,
          isActive: true,
          userRole: 'TENANT_ADMIN',
        },
      });
      if (activeAdminCount <= 1) {
        throw _errormiddleware.createError.call(void 0, 'Cannot suspend the last remaining active Tenant Administrator for this property', 400);
      }
    }
  }

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
