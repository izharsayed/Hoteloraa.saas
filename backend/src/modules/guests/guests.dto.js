"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _zod = require('zod');

 const createGuestSchema = _zod.z.object({
  name: _zod.z.string().min(2).max(100),
  phone: _zod.z.string().min(7).max(20),
  email: _zod.z.string().email().optional().or(_zod.z.literal('')),
  idType: _zod.z.enum(['PASSPORT', 'DRIVING_LICENSE', 'NATIONAL_ID', 'AADHAAR', 'PAN_CARD', 'VOTER_ID', 'OTHER']).optional().default('NATIONAL_ID'),
  idNumber: _zod.z.string().max(50).optional(),
  address: _zod.z.string().max(500).optional().default(''),
  city: _zod.z.string().max(100).optional().default(''),
  state: _zod.z.string().max(100).optional(),
  country: _zod.z.string().max(100).optional().default('India'),
  postalCode: _zod.z.string().max(20).optional(),
  nationality: _zod.z.string().max(100).optional(),
  gender: _zod.z.string().max(20).optional(),
  idProofUrl: _zod.z.string().max(2000).optional(),
  dateOfBirth: _zod.z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  notes: _zod.z.string().max(1000).optional(),
}); exports.createGuestSchema = createGuestSchema;

 const updateGuestSchema = _zod.z.object({
  name: _zod.z.string().min(2).max(100).optional(),
  phone: _zod.z.string().min(7).max(20).optional(),
  email: _zod.z.string().email().optional().or(_zod.z.literal('')),
  idType: _zod.z.enum(['PASSPORT', 'DRIVING_LICENSE', 'NATIONAL_ID', 'AADHAAR', 'PAN_CARD', 'VOTER_ID', 'OTHER']).optional(),
  idNumber: _zod.z.string().max(50).optional(),
  address: _zod.z.string().max(500).optional(),
  city: _zod.z.string().max(100).optional(),
  state: _zod.z.string().max(100).optional(),
  country: _zod.z.string().max(100).optional(),
  postalCode: _zod.z.string().max(20).optional(),
  nationality: _zod.z.string().max(100).optional(),
  gender: _zod.z.string().max(20).optional(),
  idProofUrl: _zod.z.string().max(2000).optional(),
  dateOfBirth: _zod.z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  notes: _zod.z.string().max(1000).optional(),
}); exports.updateGuestSchema = updateGuestSchema;
