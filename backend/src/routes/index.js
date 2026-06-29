"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express');
var _authroutes = require('../modules/auth/auth.routes'); var _authroutes2 = _interopRequireDefault(_authroutes);
var _usersroutes = require('../modules/users/users.routes'); var _usersroutes2 = _interopRequireDefault(_usersroutes);
var _rolesroutes = require('../modules/roles/roles.routes'); var _rolesroutes2 = _interopRequireDefault(_rolesroutes);
var _tenantsroutes = require('../modules/tenants/tenants.routes'); var _tenantsroutes2 = _interopRequireDefault(_tenantsroutes);
var _tablesroutes = require('../modules/tables/tables.routes'); var _tablesroutes2 = _interopRequireDefault(_tablesroutes);
var _menuroutes = require('../modules/menu/menu.routes'); var _menuroutes2 = _interopRequireDefault(_menuroutes);
var _ordersroutes = require('../modules/orders/orders.routes'); var _ordersroutes2 = _interopRequireDefault(_ordersroutes);
var _kotroutes = require('../modules/kot/kot.routes'); var _kotroutes2 = _interopRequireDefault(_kotroutes);
var _billingroutes = require('../modules/billing/billing.routes'); var _billingroutes2 = _interopRequireDefault(_billingroutes);
var _posroutes = require('../modules/pos/pos.routes'); var _posroutes2 = _interopRequireDefault(_posroutes);
var _roomtypesroutes = require('../modules/room-types/room-types.routes'); var _roomtypesroutes2 = _interopRequireDefault(_roomtypesroutes);
var _roomsroutes = require('../modules/rooms/rooms.routes'); var _roomsroutes2 = _interopRequireDefault(_roomsroutes);
var _guestsroutes = require('../modules/guests/guests.routes'); var _guestsroutes2 = _interopRequireDefault(_guestsroutes);
var _reservationsroutes = require('../modules/reservations/reservations.routes'); var _reservationsroutes2 = _interopRequireDefault(_reservationsroutes);
var _checkinroutes = require('../modules/checkin/checkin.routes'); var _checkinroutes2 = _interopRequireDefault(_checkinroutes);
var _checkoutroutes = require('../modules/checkout/checkout.routes'); var _checkoutroutes2 = _interopRequireDefault(_checkoutroutes);
var _housekeepingroutes = require('../modules/housekeeping/housekeeping.routes'); var _housekeepingroutes2 = _interopRequireDefault(_housekeepingroutes);
var _inventoryroutes = require('../modules/inventory/inventory.routes'); var _inventoryroutes2 = _interopRequireDefault(_inventoryroutes);
var _vendorsroutes = require('../modules/vendors/vendors.routes'); var _vendorsroutes2 = _interopRequireDefault(_vendorsroutes);
var _purchasesroutes = require('../modules/purchases/purchases.routes'); var _purchasesroutes2 = _interopRequireDefault(_purchasesroutes);
var _paymentsroutes = require('../modules/payments/payments.routes'); var _paymentsroutes2 = _interopRequireDefault(_paymentsroutes);
var _folioroutes = require('../modules/folio/folio.routes'); var _folioroutes2 = _interopRequireDefault(_folioroutes);
var _dashboardroutes = require('../modules/dashboard/dashboard.routes'); var _dashboardroutes2 = _interopRequireDefault(_dashboardroutes);
var _reportsroutes = require('../modules/reports/reports.routes'); var _reportsroutes2 = _interopRequireDefault(_reportsroutes);
var _settingsroutes = require('../modules/settings/settings.routes'); var _settingsroutes2 = _interopRequireDefault(_settingsroutes);
var _permissionsroutes = require('../modules/permissions/permissions.routes'); var _permissionsroutes2 = _interopRequireDefault(_permissionsroutes);
var _featuresroutes = require('../modules/features/features.routes'); var _featuresroutes2 = _interopRequireDefault(_featuresroutes);
var _subscriptionsroutes = require('../modules/subscriptions/subscriptions.routes'); var _subscriptionsroutes2 = _interopRequireDefault(_subscriptionsroutes);
var _categoriesroutes = require('../modules/categories/categories.routes'); var _categoriesroutes2 = _interopRequireDefault(_categoriesroutes);
var _superadminroutes = require('../modules/superadmin/superadmin.routes'); var _superadminroutes2 = _interopRequireDefault(_superadminroutes);
var _notificationsroutes = require('../modules/notifications/notifications.routes'); var _notificationsroutes2 = _interopRequireDefault(_notificationsroutes);
var _floorsroutes = require('../modules/floors/floors.routes'); var _floorsroutes2 = _interopRequireDefault(_floorsroutes);

// Attendance (new)
const attendanceRoutes = require('../modules/attendance/attendance.routes');
const shiftsRoutes = require('../modules/shifts/shifts.routes');

const router = _express.Router.call(void 0, );

// Health check
router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Auth
router.use('/auth', _authroutes2.default);

// Tenant Management
router.use('/users', _usersroutes2.default);
router.use('/roles', _rolesroutes2.default);
router.use('/tenant', _tenantsroutes2.default);

// Restaurant
router.use('/tables', _tablesroutes2.default);
router.use('/menu', _menuroutes2.default);
router.use('/orders', _ordersroutes2.default);
router.use('/kot', _kotroutes2.default);
router.use('/billing', _billingroutes2.default);
router.use('/pos', _posroutes2.default);
router.use('/floors', _floorsroutes2.default);

// Lodging
router.use('/room-types', _roomtypesroutes2.default);
router.use('/rooms', _roomsroutes2.default);
router.use('/guests', _guestsroutes2.default);
router.use('/reservations', _reservationsroutes2.default);
router.use('/check-in', _checkinroutes2.default);
router.use('/check-out', _checkoutroutes2.default);
router.use('/housekeeping', _housekeepingroutes2.default);

// Inventory & Purchasing
router.use('/inventory', _inventoryroutes2.default);
router.use('/vendors', _vendorsroutes2.default);
router.use('/purchases', _purchasesroutes2.default);

// Finance
router.use('/payments', _paymentsroutes2.default);
router.use('/folio', _folioroutes2.default);

// Analytics & Config
router.use('/dashboard', _dashboardroutes2.default);
router.use('/reports', _reportsroutes2.default);
router.use('/settings', _settingsroutes2.default);

// System & SaaS Management
router.use('/permissions', _permissionsroutes2.default);
router.use('/features', _featuresroutes2.default);
router.use('/subscriptions', _subscriptionsroutes2.default);
router.use('/categories', _categoriesroutes2.default);
router.use('/superadmin', _superadminroutes2.default);
router.use('/notifications', _notificationsroutes2.default);

// Attendance & Shifts (new)
router.use('/attendance', attendanceRoutes);
router.use('/shifts', shiftsRoutes);

exports. default = router;
