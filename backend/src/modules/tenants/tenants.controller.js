"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _tenantsservice = require('./tenants.service'); var tenantsService = _interopRequireWildcard(_tenantsservice);
var _helpers = require('../../shared/helpers');

 const getTenantProfile = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await tenantsService.getTenantProfile(tenantId);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant profile retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getTenantProfile = getTenantProfile;

 const updateTenant = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await tenantsService.updateTenant(tenantId, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant profile updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateTenant = updateTenant;

 const getTenantFeatures = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await tenantsService.getTenantFeatures(tenantId);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant features retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getTenantFeatures = getTenantFeatures;

 const toggleFeature = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { feature } = req.params;
    const result = await tenantsService.toggleFeature(tenantId, feature);
    _helpers.sendSuccess.call(void 0, res, result, `Feature ${feature} toggled successfully`);
  } catch (err) {
    next(err);
  }
}; exports.toggleFeature = toggleFeature;

 const exportTenant = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const data = await tenantsService.exportTenantData(tenantId);
    const format = (req.query.format || 'excel').toLowerCase();

    const safeSlug = (data.tenant.name || 'hotel').replace(/[^a-z0-9]/gi, '-').toLowerCase();

    if (format === 'json') {
      const filename = `${safeSlug}-export-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(JSON.stringify(data, null, 2));
    }

    // Default Excel CSV Format
    const filename = `${safeSlug}-data-export-${new Date().toISOString().slice(0, 10)}.csv`;

    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = '\uFEFF'; // Excel UTF-8 BOM byte order mark

    // 1. Property Info
    csvContent += '=== PROPERTY DETAILS ===\n';
    csvContent += 'Property Name,Business Type,Email,Phone,Address,City,State,Country,Plan,Status,Export Date\n';
    csvContent += `${escapeCell(data.tenant.name)},${escapeCell(data.tenant.businessType)},${escapeCell(data.tenant.email)},${escapeCell(data.tenant.phone)},${escapeCell(data.tenant.address)},${escapeCell(data.tenant.city)},${escapeCell(data.tenant.state)},${escapeCell(data.tenant.country)},${escapeCell(data.tenant.subscription?.plan)},${escapeCell(data.tenant.subscription?.status)},${escapeCell(new Date().toISOString().slice(0, 10))}\n\n`;

    // 2. Staff Members
    csvContent += '=== STAFF MEMBERS ===\n';
    csvContent += 'Name,Email,Phone,System Role,Status,Created At\n';
    (data.users || []).forEach(u => {
      csvContent += `${escapeCell(u.name)},${escapeCell(u.email)},${escapeCell(u.phone)},${escapeCell(u.userRole)},${escapeCell(u.isActive ? 'Active' : 'Suspended')},${escapeCell(u.createdAt)}\n`;
    });
    csvContent += '\n';

    // 3. Rooms Directory
    csvContent += '=== ROOMS DIRECTORY ===\n';
    csvContent += 'Room Number,Status,Cleanliness Status,Active\n';
    (data.rooms || []).forEach(r => {
      csvContent += `${escapeCell(r.number)},${escapeCell(r.status)},${escapeCell(r.cleanStatus || 'CLEAN')},${escapeCell(r.isActive ? 'Yes' : 'No')}\n`;
    });
    csvContent += '\n';

    // 4. Reservations
    csvContent += '=== RESERVATIONS ===\n';
    csvContent += 'Booking Ref,Check In Date,Check Out Date,Status,Room Charges,Extra Charges,Paid Amount\n';
    (data.reservations || []).forEach(resItem => {
      csvContent += `${escapeCell(resItem.bookingRef)},${escapeCell(resItem.checkInDate)},${escapeCell(resItem.checkOutDate)},${escapeCell(resItem.status)},${escapeCell(resItem.roomCharges)},${escapeCell(resItem.extraCharges)},${escapeCell(resItem.paidAmount)}\n`;
    });
    csvContent += '\n';

    // 5. Guests Registry
    csvContent += '=== GUESTS REGISTRY ===\n';
    csvContent += 'Guest Name,Email,Phone,Identity Type,Identity Number\n';
    (data.guests || []).forEach(g => {
      csvContent += `${escapeCell(g.name)},${escapeCell(g.email)},${escapeCell(g.phone)},${escapeCell(g.idType)},${escapeCell(g.idNumber)}\n`;
    });
    csvContent += '\n';

    // 6. POS Orders & Billing
    csvContent += '=== POS ORDERS & BILLING ===\n';
    csvContent += 'Order Number,Type,Status,Total Amount,Created At\n';
    (data.orders || []).forEach(o => {
      csvContent += `${escapeCell(o.orderNumber)},${escapeCell(o.orderType)},${escapeCell(o.status)},${escapeCell(o.totalAmount)},${escapeCell(o.createdAt)}\n`;
    });
    csvContent += '\n';

    // 7. Payments Log
    csvContent += '=== PAYMENTS LOG ===\n';
    csvContent += 'Payment Ref,Amount,Payment Method,Status,Paid At\n';
    (data.payments || []).forEach(p => {
      csvContent += `${escapeCell(p.paymentRef)},${escapeCell(p.amount)},${escapeCell(p.method)},${escapeCell(p.status)},${escapeCell(p.paidAt)}\n`;
    });
    csvContent += '\n';

    // 8. Inventory & Stock
    csvContent += '=== INVENTORY & STOCK ===\n';
    csvContent += 'Item Name,Category,Quantity,Unit,Min Reorder Level\n';
    (data.inventory || []).forEach(i => {
      csvContent += `${escapeCell(i.name)},${escapeCell(i.category)},${escapeCell(i.quantity)},${escapeCell(i.unit)},${escapeCell(i.minStock)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}; exports.exportTenant = exportTenant;
