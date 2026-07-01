"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);

var _errormiddleware = require('../../middleware/error.middleware');

 const getDailySalesReport = async (tenantId, startDateStr, endDateStr) => {
  const start = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const orders = await _database2.default.order.findMany({
    where: {
      tenantId,
      status: 'COMPLETED',
      createdAt: { gte: start, lte: end },
    },
    select: {
      totalAmount: true,
      createdAt: true,
    },
  });

  const dailyGroups = {};

  orders.forEach((order) => {
    const day = order.createdAt.toISOString().split('T')[0];
    if (!dailyGroups[day]) {
      dailyGroups[day] = { totalOrders: 0, revenue: 0 };
    }
    dailyGroups[day].totalOrders += 1;
    dailyGroups[day].revenue += order.totalAmount;
  });

  const data = Object.keys(dailyGroups).map((date) => {
    const group = dailyGroups[date];
    return {
      date,
      totalOrders: group.totalOrders,
      revenue: group.revenue,
      avgOrderValue: group.totalOrders > 0 ? Number((group.revenue / group.totalOrders).toFixed(2)) : 0,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  return data;
}; exports.getDailySalesReport = getDailySalesReport;

 const getOccupancyReport = async (tenantId, startDateStr, endDateStr) => {
  const start = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const totalRooms = await _database2.default.room.count({
    where: { tenantId, isActive: true },
  });

  const reservations = await _database2.default.reservation.findMany({
    where: {
      tenantId,
      status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
      checkInDate: { lte: end },
      checkOutDate: { gte: start },
    },
    select: {
      checkInDate: true,
      checkOutDate: true,
      roomCharges: true,
    },
  });

  const daysInRange = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const totalRoomNightsAvailable = totalRooms * daysInRange;

  let occupiedNights = 0;
  let revenue = 0;

  reservations.forEach((res) => {
    const resStart = new Date(Math.max(start.getTime(), res.checkInDate.getTime()));
    const resEnd = new Date(Math.min(end.getTime(), res.checkOutDate.getTime()));
    const nights = Math.max(0, Math.ceil((resEnd.getTime() - resStart.getTime()) / (1000 * 60 * 60 * 24)));
    occupiedNights += nights;
    revenue += res.roomCharges;
  });

  const occupancyRate = totalRoomNightsAvailable > 0 
    ? Number(((occupiedNights / totalRoomNightsAvailable) * 100).toFixed(2))
    : 0;

  const dailyTimeline = [];
  for (let i = 0; i < daysInRange; i++) {
    const dayDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStr = dayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    
    let occupiedRoomsCount = 0;
    reservations.forEach((res) => {
      const checkIn = new Date(res.checkInDate);
      checkIn.setHours(0, 0, 0, 0);
      const checkOut = new Date(res.checkOutDate);
      checkOut.setHours(0, 0, 0, 0);
      const current = new Date(dayDate);
      current.setHours(0, 0, 0, 0);
      
      if (current >= checkIn && current < checkOut) {
        occupiedRoomsCount++;
      }
    });
    
    const rate = totalRooms > 0 ? Math.min(100, Math.round((occupiedRoomsCount / totalRooms) * 100)) : 0;
    dailyTimeline.push({ date: dayStr, rate });
  }

  return {
    totalRooms,
    occupiedNights,
    daysInRange,
    totalRoomNightsAvailable,
    occupancyRate,
    revenue,
    dailyTimeline,
  };
}; exports.getOccupancyReport = getOccupancyReport;

 const getInventoryReport = async (tenantId) => {
  const items = await _database2.default.inventoryItem.findMany({
    where: { tenantId, isActive: true },
  });

  const totalItems = items.length;
  let totalValue = 0;
  let lowStockCount = 0;

  items.forEach((item) => {
    totalValue += item.quantity * item.costPrice;
    if (item.quantity <= item.minimumStock) {
      lowStockCount += 1;
    }
  });

  return {
    totalItems,
    totalValue,
    lowStockCount,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      quantity: item.quantity,
      minimumStock: item.minimumStock,
      costPrice: item.costPrice,
      totalCost: item.quantity * item.costPrice,
      isLowStock: item.quantity <= item.minimumStock,
    })),
  };
}; exports.getInventoryReport = getInventoryReport;

 const getRevenueReport = async (tenantId, startDateStr, endDateStr) => {
  const start = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // Payments categorized
  const payments = await _database2.default.payment.findMany({
    where: {
      tenantId,
      paidAt: { gte: start, lte: end },
      status: 'PAID',
    },
  });

  let restaurantRevenue = 0;
  let lodgingRevenue = 0;
  let otherRevenue = 0;

  payments.forEach((payment) => {
    if (payment.orderId) {
      restaurantRevenue += payment.amount;
    } else if (payment.reservationId) {
      lodgingRevenue += payment.amount;
    } else {
      otherRevenue += payment.amount;
    }
  });

  const totalRevenue = restaurantRevenue + lodgingRevenue + otherRevenue;

  return {
    restaurantRevenue,
    lodgingRevenue,
    otherRevenue,
    totalRevenue,
  };
}; exports.getRevenueReport = getRevenueReport;

 const generateReport = async (tenantId, dto) => {
  const { type, startDate, endDate } = dto;
  let reportData;

  if (type === 'DAILY_SALES') {
    reportData = await exports.getDailySalesReport.call(void 0, tenantId, startDate, endDate);
  } else if (type === 'OCCUPANCY') {
    reportData = await exports.getOccupancyReport.call(void 0, tenantId, startDate, endDate);
  } else if (type === 'INVENTORY') {
    reportData = await exports.getInventoryReport.call(void 0, tenantId);
  } else if (type === 'REVENUE') {
    reportData = await exports.getRevenueReport.call(void 0, tenantId, startDate, endDate);
  } else {
    throw _errormiddleware.createError.call(void 0, 'Invalid report type', 400);
  }

  // Auto save report history in database
  const savedReport = await _database2.default.report.create({
    data: {
      tenantId,
      type,
      data: reportData,
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'Overall/Current',
    },
  });

  return savedReport;
}; exports.generateReport = generateReport;

 const getSavedReports = async (tenantId) => {
  return _database2.default.report.findMany({
    where: { tenantId },
    orderBy: { generatedAt: 'desc' },
  });
}; exports.getSavedReports = getSavedReports;
