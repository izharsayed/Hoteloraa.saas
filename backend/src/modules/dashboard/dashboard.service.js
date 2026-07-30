"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);

 const getRestaurantDashboard = async (tenantId) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const yearStart = new Date(todayStart.getFullYear(), 0, 1);

  // 1. Total Orders count today
  const totalOrders = await _database2.default.order.count({
    where: {
      tenantId,
      createdAt: { gte: todayStart, lte: todayEnd },
    },
  });

  // 2. Revenue calculations (daily, monthly, yearly)
  const fetchRestPayments = async (fromDate) => {
    return _database2.default.payment.findMany({
      where: {
        tenantId,
        paidAt: { gte: fromDate, lte: todayEnd },
        status: 'PAID',
        orderId: { not: null },
      },
      include: { order: true },
    });
  };

  const calcRestRev = (paymentsList) => {
    const total = paymentsList.reduce((acc, curr) => acc + curr.amount, 0);
    const dineIn = paymentsList.filter((p) => p.order && p.order.tableId).reduce((acc, curr) => acc + curr.amount, 0);
    const takeaway = paymentsList.filter((p) => p.order && !p.order.tableId).reduce((acc, curr) => acc + curr.amount, 0);
    return { total, dineIn, takeaway };
  };

  const todayPayments = await fetchRestPayments(todayStart);
  const monthPayments = await fetchRestPayments(monthStart);
  const yearPayments = await fetchRestPayments(yearStart);

  const dailyRev = calcRestRev(todayPayments);
  const monthlyRev = calcRestRev(monthPayments);
  const yearlyRev = calcRestRev(yearPayments);

  // 3. Pending KOTs count
  const pendingKOTs = await _database2.default.kOT.count({
    where: { tenantId, status: 'PENDING' },
  });

  // 4. Tables stats
  const occupiedTables = await _database2.default.table.count({
    where: { tenantId, status: 'OCCUPIED', isActive: true },
  });

  const totalTables = await _database2.default.table.count({
    where: { tenantId, isActive: true },
  });

  // 5. Recent Orders (last 10)
  const recentOrders = await _database2.default.order.findMany({
    where: { tenantId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      table: true,
      user: { select: { name: true } },
    },
  });

  return {
    totalOrders,
    todayRevenue: dailyRev.total,
    dineInSales: dailyRev.dineIn,
    takeawaySales: dailyRev.takeaway,
    revenueBreakdown: {
      daily: dailyRev,
      monthly: monthlyRev,
      yearly: yearlyRev,
    },
    pendingKOTs,
    occupiedTables,
    totalTables,
    recentOrders,
  };
}; exports.getRestaurantDashboard = getRestaurantDashboard;

 const getLodgingDashboard = async (tenantId) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const yearStart = new Date(todayStart.getFullYear(), 0, 1);

  // 1. Rooms stats
  const totalRooms = await _database2.default.room.count({
    where: { tenantId, isActive: true },
  });

  const occupiedRooms = await _database2.default.room.count({
    where: { tenantId, status: 'OCCUPIED', isActive: true },
  });

  const availableRooms = await _database2.default.room.count({
    where: { tenantId, status: 'AVAILABLE', isActive: true },
  });

  // 2. Today's Check-ins count
  const todayCheckIns = await _database2.default.reservation.count({
    where: {
      tenantId,
      checkInDate: { gte: todayStart, lte: todayEnd },
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
    },
  });

  // 3. Today's Check-outs count
  const todayCheckOuts = await _database2.default.reservation.count({
    where: {
      tenantId,
      checkOutDate: { gte: todayStart, lte: todayEnd },
      status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
    },
  });

  // 4. Revenue calculations (daily, monthly, yearly)
  const fetchLodgingPayments = async (fromDate) => {
    return _database2.default.payment.findMany({
      where: {
        tenantId,
        paidAt: { gte: fromDate, lte: todayEnd },
        status: 'PAID',
        reservationId: { not: null },
      },
      include: { reservation: true },
    });
  };

  const calcLodgingRev = (paymentsList) => {
    const total = paymentsList.reduce((acc, curr) => acc + curr.amount, 0);
    const bookings = paymentsList.reduce((acc, curr) => {
      if (curr.reservation) {
        return acc + Math.max(0, curr.reservation.roomCharges - curr.reservation.discount);
      }
      return acc + curr.amount;
    }, 0);
    const service = paymentsList.reduce((acc, curr) => {
      if (curr.reservation) {
        return acc + curr.reservation.extraCharges;
      }
      return acc;
    }, 0);
    return { total, bookings, service };
  };

  const todayPayments = await fetchLodgingPayments(todayStart);
  const monthPayments = await fetchLodgingPayments(monthStart);
  const yearPayments = await fetchLodgingPayments(yearStart);

  const dailyRev = calcLodgingRev(todayPayments);
  const monthlyRev = calcLodgingRev(monthPayments);
  const yearlyRev = calcLodgingRev(yearPayments);

  // 5. Pending Housekeeping tasks count
  const pendingHousekeeping = await _database2.default.housekeeping.count({
    where: {
      tenantId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  // 6. Recent Reservations
  const recentReservations = await _database2.default.reservation.findMany({
    where: { tenantId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      guest: true,
      room: true,
    },
  });

  return {
    totalRooms,
    occupiedRooms,
    availableRooms,
    todayCheckIns,
    todayCheckOuts,
    todayRevenue: dailyRev.total,
    roomBookings: dailyRev.bookings,
    roomService: dailyRev.service,
    revenueBreakdown: {
      daily: dailyRev,
      monthly: monthlyRev,
      yearly: yearlyRev,
    },
    pendingHousekeeping,
    recentReservations,
  };
}; exports.getLodgingDashboard = getLodgingDashboard;

 const getHotelDashboard = async (tenantId) => {
  const restaurant = await exports.getRestaurantDashboard.call(void 0, tenantId);
  const lodging = await exports.getLodgingDashboard.call(void 0, tenantId);

  return {
    restaurant: {
      totalOrders: restaurant.totalOrders,
      todayRevenue: restaurant.todayRevenue,
      dineInSales: restaurant.dineInSales,
      takeawaySales: restaurant.takeawaySales,
      revenueBreakdown: restaurant.revenueBreakdown,
      pendingKOTs: restaurant.pendingKOTs,
      occupiedTables: restaurant.occupiedTables,
      totalTables: restaurant.totalTables,
      recentOrders: restaurant.recentOrders,
    },
    lodging: {
      totalRooms: lodging.totalRooms,
      occupiedRooms: lodging.occupiedRooms,
      availableRooms: lodging.availableRooms,
      todayCheckIns: lodging.todayCheckIns,
      todayCheckOuts: lodging.todayCheckOuts,
      todayRevenue: lodging.todayRevenue,
      roomBookings: lodging.roomBookings,
      roomService: lodging.roomService,
      revenueBreakdown: lodging.revenueBreakdown,
      pendingHousekeeping: lodging.pendingHousekeeping,
      recentReservations: lodging.recentReservations,
    },
    combinedTodayRevenue: restaurant.todayRevenue + lodging.todayRevenue,
    revenueBreakdown: {
      daily: { total: (restaurant.revenueBreakdown?.daily?.total || 0) + (lodging.revenueBreakdown?.daily?.total || 0) },
      monthly: { total: (restaurant.revenueBreakdown?.monthly?.total || 0) + (lodging.revenueBreakdown?.monthly?.total || 0) },
      yearly: { total: (restaurant.revenueBreakdown?.yearly?.total || 0) + (lodging.revenueBreakdown?.yearly?.total || 0) },
    }
  };
}; exports.getHotelDashboard = getHotelDashboard;

 const getDashboard = async (tenantId, businessType) => {
  if (businessType === 'RESTAURANT') {
    return exports.getRestaurantDashboard.call(void 0, tenantId);
  } else if (businessType === 'LODGING' || businessType === 'HOTEL') {
    return exports.getLodgingDashboard.call(void 0, tenantId);
  } else {
    return exports.getHotelDashboard.call(void 0, tenantId);
  }
}; exports.getDashboard = getDashboard;
