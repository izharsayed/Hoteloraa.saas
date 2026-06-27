"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);

var _errormiddleware = require('../../middleware/error.middleware');

 const getPayments = async (tenantId, status) => {
  return _database2.default.payment.findMany({
    where: {
      tenantId,
      ...(status ? { status: status  } : {}),
    },
    include: {
      order: true,
      reservation: {
        include: {
          guest: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}; exports.getPayments = getPayments;

 const getPaymentById = async (tenantId, id) => {
  const payment = await _database2.default.payment.findFirst({
    where: { id, tenantId },
    include: {
      order: true,
      reservation: {
        include: {
          guest: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!payment) throw _errormiddleware.createError.call(void 0, 'Payment record not found', 404);
  return payment;
}; exports.getPaymentById = getPaymentById;

 const createPayment = async (tenantId, userId, dto) => {
  if (dto.orderId) {
    const order = await _database2.default.order.findFirst({
      where: { id: dto.orderId, tenantId },
      select: { id: true },
    });
    if (!order) throw _errormiddleware.createError.call(void 0, 'Order not found', 404);

    const existingPayment = await _database2.default.payment.findUnique({
      where: { orderId: dto.orderId },
      select: { id: true },
    });
    if (existingPayment) throw _errormiddleware.createError.call(void 0, 'Payment already exists for this order', 409);
  }

  if (dto.reservationId) {
    const reservation = await _database2.default.reservation.findFirst({
      where: { id: dto.reservationId, tenantId },
      select: { id: true },
    });
    if (!reservation) throw _errormiddleware.createError.call(void 0, 'Reservation not found', 404);

    const existingPayment = await _database2.default.payment.findUnique({
      where: { reservationId: dto.reservationId },
      select: { id: true },
    });
    if (existingPayment) throw _errormiddleware.createError.call(void 0, 'Payment already exists for this reservation', 409);
  }

  const isCredit = dto.method === 'CREDIT';
  
  return _database2.default.payment.create({
    data: {
      tenantId,
      userId,
      orderId: dto.orderId || undefined,
      reservationId: dto.reservationId || undefined,
      amount: dto.amount,
      method: dto.method,
      status: isCredit ? 'PENDING' : 'PAID',
      paidAt: isCredit ? null : new Date(),
      reference: dto.reference,
      notes: dto.notes,
    },
  });
}; exports.createPayment = createPayment;

 const getPaymentSummary = async (tenantId, dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const payments = await _database2.default.payment.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'PAID',
    },
  });

  const summary = payments.reduce(
    (acc, curr) => {
      acc.total += curr.amount;
      acc.byMethod[curr.method] = (acc.byMethod[curr.method] || 0) + curr.amount;
      return acc;
    },
    { total: 0, byMethod: {}  }
  );

  return summary;
}; exports.getPaymentSummary = getPaymentSummary;
