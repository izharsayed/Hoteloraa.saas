"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);

var _errormiddleware = require('../../middleware/error.middleware');

 const getTenantProfile = async (tenantId) => {
  const tenant = await _database2.default.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: true,
      features: true,
    },
  });

  if (!tenant) throw _errormiddleware.createError.call(void 0, 'Tenant not found', 404);
  return tenant;
}; exports.getTenantProfile = getTenantProfile;

 const updateTenant = async (tenantId, dto) => {
  const tenant = await _database2.default.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw _errormiddleware.createError.call(void 0, 'Tenant not found', 404);

  return _database2.default.tenant.update({
    where: { id: tenantId },
    data: dto ,
    include: {
      subscription: true,
      features: true,
    },
  });
}; exports.updateTenant = updateTenant;

 const getTenantFeatures = async (tenantId) => {
  return _database2.default.tenantFeature.findMany({
    where: { tenantId },
  });
}; exports.getTenantFeatures = getTenantFeatures;

 const toggleFeature = async (tenantId, feature) => {
  const existing = await _database2.default.tenantFeature.findUnique({
    where: {
      tenantId_feature: {
        tenantId,
        feature,
      },
    },
  });

  if (!existing) {
    return _database2.default.tenantFeature.create({
      data: {
        tenantId,
        feature,
        isEnabled: true,
      },
    });
  }

  return _database2.default.tenantFeature.update({
    where: {
      tenantId_feature: {
        tenantId,
        feature,
      },
    },
    data: {
      isEnabled: !existing.isEnabled,
    },
  });
}; exports.toggleFeature = toggleFeature;

 const exportTenantData = async (tenantId) => {
  const tenant = await _database2.default.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true, name: true, slug: true, businessType: true,
      phone: true, email: true, address: true, city: true,
      state: true, country: true, currency: true, timezone: true,
      createdAt: true,
      subscription: {
        select: { plan: true, status: true, startDate: true, endDate: true, trialEnds: true, amount: true }
      }
    }
  });

  if (!tenant) throw _errormiddleware.createError.call(void 0, 'Tenant not found', 404);

  const [users, rooms, roomTypes, floors, reservations, guests, orders, payments,
         menuCategories, menuItems, tables, inventory, vendors, purchases,
         housekeeping, shifts, attendanceRecords] = await Promise.all([
    _database2.default.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, phone: true, userRole: true,
                isActive: true, lastLogin: true, createdAt: true }
    }),
    _database2.default.room.findMany({ where: { tenantId } }),
    _database2.default.roomType.findMany({ where: { tenantId } }),
    _database2.default.floor.findMany({ where: { tenantId } }),
    _database2.default.reservation.findMany({ where: { tenantId } }),
    _database2.default.guest.findMany({ where: { tenantId } }),
    _database2.default.order.findMany({ where: { tenantId } }),
    _database2.default.payment.findMany({ where: { tenantId } }),
    _database2.default.menuCategory.findMany({ where: { tenantId } }),
    _database2.default.menuItem.findMany({ where: { tenantId } }),
    _database2.default.table.findMany({ where: { tenantId } }),
    _database2.default.inventoryItem.findMany({ where: { tenantId } }),
    _database2.default.vendor.findMany({ where: { tenantId } }),
    _database2.default.purchase.findMany({ where: { tenantId } }),
    _database2.default.housekeeping.findMany({ where: { tenantId } }),
    _database2.default.shift.findMany({ where: { tenantId } }),
    _database2.default.attendance.findMany({ where: { tenantId } }),
  ]);

  return {
    _meta: {
      exportedAt: new Date().toISOString(),
      exportedBy: 'Hoteloraa SaaS',
      tenantId: tenant.id,
      tenantName: tenant.name,
      version: '1.0',
    },
    tenant,
    users,
    rooms,
    roomTypes,
    floors,
    reservations,
    guests,
    orders,
    payments,
    menuCategories,
    menuItems,
    tables,
    inventory,
    vendors,
    purchases,
    housekeeping,
    shifts,
    attendanceRecords,
  };
}; exports.exportTenantData = exportTenantData;
