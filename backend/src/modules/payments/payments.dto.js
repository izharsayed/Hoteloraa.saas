"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _zod = require('zod');

 const createPaymentSchema = _zod.z.object({
  orderId: _zod.z.string().uuid().optional().nullable(),
  reservationId: _zod.z.string().uuid().optional().nullable(),
  amount: _zod.z.number().positive('Amount must be positive'),
  method: _zod.z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'CREDIT']),
  reference: _zod.z.string().max(200).optional().nullable(),
  notes: _zod.z.string().max(1000).optional().nullable(),
}).refine(data => Boolean(data.orderId) !== Boolean(data.reservationId), {
  message: 'Either orderId or reservationId must be provided',
  path: ['orderId'],
}); exports.createPaymentSchema = createPaymentSchema;


