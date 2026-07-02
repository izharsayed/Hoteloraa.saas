"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _errormiddleware = require('../../middleware/error.middleware');

 const createTicket = async (tenantId, userId, dto) => {
  return _database2.default.ticket.create({
    data: {
      tenantId,
      userId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      module: dto.module || "OTHER",
      attachmentUrl: dto.attachmentUrl || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}; exports.createTicket = createTicket;

 const getTenantTickets = async (tenantId) => {
  return _database2.default.ticket.findMany({
    where: {
      tenantId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          userRole: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}; exports.getTenantTickets = getTenantTickets;

 const getAllTickets = async () => {
  return _database2.default.ticket.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          userRole: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}; exports.getAllTickets = getAllTickets;

 const getTicketById = async (id) => {
  const ticket = await _database2.default.ticket.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!ticket) {
    throw _errormiddleware.createError.call(void 0, 'Ticket not found', 404);
  }

  return ticket;
}; exports.getTicketById = getTicketById;

 const updateTicket = async (id, dto) => {
  await exports.getTicketById.call(void 0, id);

  return _database2.default.ticket.update({
    where: { id },
    data: dto,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}; exports.updateTicket = updateTicket;
