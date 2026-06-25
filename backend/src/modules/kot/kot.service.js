"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _errormiddleware = require('../../middleware/error.middleware');
var _helpers = require('../../shared/helpers');

var _notificationsservice = require('../notifications/notifications.service'); var notificationsService = _interopRequireWildcard(_notificationsservice);

// ---------------------------------------------------------------------------
// getKOTs
// ---------------------------------------------------------------------------
 const getKOTs = async (tenantId, status) => {
  const where = { tenantId };

  if (status) {
    where.status = status ;
  }

  return _database2.default.kOT.findMany({
    where,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          table: { select: { id: true, name: true } },
        },
      },
      items: {
        include: {
          orderItem: {
            include: {
              menuItem: { select: { id: true, name: true } },
            },
          },
        },
      },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}; exports.getKOTs = getKOTs;

// ---------------------------------------------------------------------------
// getKOTById
// ---------------------------------------------------------------------------
 const getKOTById = async (tenantId, id) => {
  const kot = await _database2.default.kOT.findFirst({
    where: { id, tenantId },
    include: {
      order: {
        include: {
          table: true,
          user: { select: { id: true, name: true } },
        },
      },
      items: {
        include: {
          orderItem: {
            include: {
              menuItem: true,
            },
          },
        },
      },
      user: { select: { id: true, name: true, userRole: true } },
    },
  });

  if (!kot) {
    throw _errormiddleware.createError.call(void 0, 'KOT not found', 404);
  }

  return kot;
}; exports.getKOTById = getKOTById;

// ---------------------------------------------------------------------------
// createKOT
// ---------------------------------------------------------------------------
 const createKOT = async (
  tenantId,
  userId,
  dto
) => {
  // Verify the order belongs to this tenant
  const order = await _database2.default.order.findFirst({
    where: { id: dto.orderId, tenantId },
  });

  if (!order) {
    throw _errormiddleware.createError.call(void 0, 'Order not found', 404);
  }

  if (['CANCELLED', 'COMPLETED'].includes(order.status)) {
    throw _errormiddleware.createError.call(void 0, 
      `Cannot create a KOT for an order with status: ${order.status}`,
      422
    );
  }

  // Validate that all provided order item IDs belong to this order and are not voided
  const orderItems = await _database2.default.orderItem.findMany({
    where: {
      id: { in: dto.itemIds },
      orderId: dto.orderId,
      isVoid: false,
    },
  });

  if (orderItems.length !== dto.itemIds.length) {
    throw _errormiddleware.createError.call(void 0, 
      'One or more order item IDs are invalid, voided, or do not belong to this order',
      422
    );
  }

  const kotNumber = _helpers.generateKOTNumber.call(void 0, 'KOT');

  const kot = await _database2.default.kOT.create({
    data: {
      tenantId,
      orderId: dto.orderId,
      userId,
      kotNumber,
      status: 'PENDING',
      notes: dto.notes,
      items: {
        create: orderItems.map((oi) => ({
          orderItemId: oi.id,
          quantity: oi.quantity,
          notes: oi.notes,
        })),
      },
    },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
      items: {
        include: {
          orderItem: {
            include: { menuItem: { select: { id: true, name: true } } },
          },
        },
      },
      user: { select: { id: true, name: true } },
    },
  });

  // Advance order to CONFIRMED if still PENDING
  if (order.status === 'PENDING') {
    await _database2.default.order.update({
      where: { id: dto.orderId },
      data: { status: 'CONFIRMED' },
    });
  }

  return kot;
}; exports.createKOT = createKOT;

// ---------------------------------------------------------------------------
// updateKOTStatus
// ---------------------------------------------------------------------------
 const updateKOTStatus = async (
  tenantId,
  id,
  dto
) => {
  const kot = await _database2.default.kOT.findFirst({
    where: { id, tenantId },
    include: { order: true },
  });

  if (!kot) {
    throw _errormiddleware.createError.call(void 0, 'KOT not found', 404);
  }

  const updatedKOT = await _database2.default.kOT.update({
    where: { id },
    data: { status: dto.status },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          userId: true,
          table: { select: { name: true } }
        }
      },
      items: {
        include: {
          orderItem: {
            include: { menuItem: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  // Trigger notification to captain who placed the order
  if (_optionalChain([updatedKOT, 'access', _ => _.order, 'optionalAccess', _2 => _2.userId])) {
    const tableName = _optionalChain([updatedKOT, 'access', _3 => _3.order, 'access', _4 => _4.table, 'optionalAccess', _5 => _5.name]) || 'Quick POS';
    if (dto.status === 'IN_PROGRESS') {
      await notificationsService.createNotification(tenantId, {
        userId: updatedKOT.order.userId,
        title: 'Order Preparing',
        message: `KOT ${updatedKOT.kotNumber} for ${tableName} is now being prepared.`,
        type: 'INFO',
      });
    } else if (dto.status === 'READY') {
      await notificationsService.createNotification(tenantId, {
        userId: updatedKOT.order.userId,
        title: 'Order Ready!',
        message: `KOT ${updatedKOT.kotNumber} for ${tableName} is ready to serve!`,
        type: 'SUCCESS',
      });
    }
  }

  // When KOT is READY, push the parent order to READY as well
  // (only if it hasn't already progressed beyond that)
  if (dto.status === 'READY') {
    const orderStatesToAdvance = ['CONFIRMED', 'PREPARING'];
    if (orderStatesToAdvance.includes(kot.order.status)) {
      await _database2.default.order.update({
        where: { id: kot.orderId },
        data: { status: 'READY' },
      });
    }
  }

  // When KOT moves to IN_PROGRESS, move order to PREPARING if applicable
  if (dto.status === 'IN_PROGRESS' && kot.order.status === 'CONFIRMED') {
    await _database2.default.order.update({
      where: { id: kot.orderId },
      data: { status: 'PREPARING' },
    });
  }

  return updatedKOT;
}; exports.updateKOTStatus = updateKOTStatus;

// ---------------------------------------------------------------------------
// printKOT
// ---------------------------------------------------------------------------
 const printKOT = async (tenantId, id) => {
  const kot = await _database2.default.kOT.findFirst({
    where: { id, tenantId },
  });

  if (!kot) {
    throw _errormiddleware.createError.call(void 0, 'KOT not found', 404);
  }

  return _database2.default.kOT.update({
    where: { id },
    data: { printedAt: new Date() },
    include: {
      order: {
        include: {
          table: { select: { id: true, name: true, floor: true } },
          user: { select: { id: true, name: true } },
        },
      },
      items: {
        include: {
          orderItem: {
            include: {
              menuItem: { select: { id: true, name: true, isVeg: true } },
            },
          },
        },
      },
      user: { select: { id: true, name: true } },
    },
  });
}; exports.printKOT = printKOT;
