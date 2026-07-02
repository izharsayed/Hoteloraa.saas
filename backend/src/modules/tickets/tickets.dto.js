"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _zod = require('zod');

const ticketCategories = ['BUG', 'QUESTION', 'FEATURE_REQUEST', 'BILLING', 'OTHER'];
const ticketPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const ticketStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

 const createTicketSchema = _zod.z.object({
  title: _zod.z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  description: _zod.z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must not exceed 5000 characters'),
  category: _zod.z.enum(ticketCategories, {
    errorMap: () => ({
      message: `Category must be one of: ${ticketCategories.join(', ')}`,
    }),
  }),
  priority: _zod.z.enum(ticketPriorities, {
    errorMap: () => ({
      message: `Priority must be one of: ${ticketPriorities.join(', ')}`,
    }),
  }),
  module: _zod.z.string().max(50, 'Module name must not exceed 50 characters').optional(),
  attachmentUrl: _zod.z.string().max(1000).optional().nullable().or(_zod.z.literal('')),
}); exports.createTicketSchema = createTicketSchema;

 const updateTicketSchema = _zod.z.object({
  status: _zod.z
    .enum(ticketStatuses, {
      errorMap: () => ({
        message: `Status must be one of: ${ticketStatuses.join(', ')}`,
      }),
    })
    .optional(),
  priority: _zod.z
    .enum(ticketPriorities, {
      errorMap: () => ({
        message: `Priority must be one of: ${ticketPriorities.join(', ')}`,
      }),
    })
    .optional(),
}); exports.updateTicketSchema = updateTicketSchema;
