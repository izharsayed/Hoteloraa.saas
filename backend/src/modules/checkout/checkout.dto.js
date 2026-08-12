"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _zod = require('zod');

 const checkOutSchema = _zod.z.object({
  reservationId: _zod.z.string().uuid({ message: 'reservationId must be a valid UUID' }),
  extraCharges: _zod.z.number().nonnegative().default(0).optional(),
  taxAmount: _zod.z.number().nonnegative().default(0).optional(),
  discount: _zod.z.number().nonnegative().default(0).optional(),
  paymentMethod: _zod.z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'CREDIT'], {
    errorMap: () => ({
      message: 'paymentMethod must be one of CASH, CARD, UPI, BANK_TRANSFER, WALLET, CREDIT',
    }),
  }),
  notes: _zod.z.string().max(1000).optional(),
}); exports.checkOutSchema = checkOutSchema;


