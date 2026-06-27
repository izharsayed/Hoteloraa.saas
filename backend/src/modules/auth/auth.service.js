"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  }
  return rhsFn();
}

var _bcryptjs = require('bcryptjs');
var _bcryptjs2 = _interopRequireDefault(_bcryptjs);
var _jsonwebtoken = require('jsonwebtoken');
var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);
var _database = require('../../config/database');
var _database2 = _interopRequireDefault(_database);
var _env = require('../../config/env');
var _env2 = _interopRequireDefault(_env);
var _crypto = require('crypto');
var _crypto2 = _interopRequireDefault(_crypto);
var _errormiddleware = require('../../middleware/error.middleware');

var _emailService = require('../../shared/email.service');

const SALT_ROUNDS = 12;
const PASSWORD_RESET_RESPONSE = {
  message: 'If that email is registered, a reset code has been sent.',
};

const DEFAULT_FEATURES = {
  RESTAURANT: ['DASHBOARD', 'POS', 'TABLES', 'KOT', 'MENU', 'INVENTORY', 'REPORTS'],
  LODGING: ['DASHBOARD', 'RESERVATIONS', 'ROOMS', 'CHECKIN', 'CHECKOUT', 'GUESTS', 'HOUSEKEEPING', 'REPORTS'],
  HOTEL_RESTAURANT: ['DASHBOARD', 'POS', 'TABLES', 'KOT', 'MENU', 'INVENTORY', 'RESERVATIONS', 'ROOMS', 'CHECKIN', 'CHECKOUT', 'GUESTS', 'HOUSEKEEPING', 'REPORTS', 'SETTINGS'],
};

const registerTenant = async (dto) => {
  const existing = await _database2.default.tenant.findUnique({ where: { slug: dto.tenantSlug } });
  if (existing) throw _errormiddleware.createError.call(void 0, 'Tenant slug already taken', 409);

  const passwordHash = await _bcryptjs2.default.hash(dto.password, SALT_ROUNDS);
  const features = DEFAULT_FEATURES[dto.businessType] || [];
  const verificationToken = _crypto2.default.randomBytes(32).toString('hex');

  const tenant = await _database2.default.tenant.create({
    data: {
      name: dto.tenantName,
      slug: dto.tenantSlug,
      businessType: dto.businessType,
      users: {
        create: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          userRole: 'TENANT_ADMIN',
          isEmailVerified: false,
          verificationToken,
        },
      },
      subscription: {
        create: {
          plan: 'STARTER',
          status: 'TRIAL',
          trialEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      },
      features: {
        create: features.map((f) => ({ feature: f, isEnabled: true })),
      },
      settings: {
        create: {},
      },
    },
    include: { users: true },
  });

  const user = tenant.users[0];
  const token = generateToken(user.id, tenant.id, user.email, user.userRole);

  // Send registration details & verification email
  const verificationLink = `${_env2.default.clientUrl}/verify-email?token=${verificationToken}`;
  await _emailService.sendMail({
    to: dto.email,
    subject: `Welcome to Hoteloraa! Verify your email for ${dto.tenantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0c2340; text-align: center;">Welcome to Hoteloraa SaaS!</h2>
        <p>Hello <strong>${dto.name}</strong>,</p>
        <p>Thank you for registering your business, <strong>${dto.tenantName}</strong>, on the Hoteloraa SaaS platform. Your property workspace has been successfully provisioned!</p>
        
        <div style="background-color: #f7f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e5e5;">
          <h3 style="margin-top: 0; color: #0c2340;">Business Registration Details</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="width: 130px; font-weight: bold; padding: 4px 0;">Property Name:</td><td>${dto.tenantName}</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Portal URL:</td><td><a href="${_env2.default.clientUrl}/t/${dto.tenantSlug}" style="color: #d4af37; text-decoration: none; font-weight: bold;">${_env2.default.clientUrl}/t/${dto.tenantSlug}</a></td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Business Type:</td><td>${dto.businessType}</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Registered Email:</td><td>${dto.email}</td></tr>
          </table>
        </div>

        <p>Before you can log in and start managing your property, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #d4af37; color: #0c2340; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Verify Email Address</a>
        </div>

        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
          If the button doesn't work, copy and paste this link in your browser:<br>
          <a href="${verificationLink}" style="color: #d4af37;">${verificationLink}</a>
        </p>
      </div>
    `
  });

  return {
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    user: { id: user.id, name: user.name, email: user.email },
    token,
  };
};
exports.registerTenant = registerTenant;

const login = async (dto) => {
  let tenant;
  let user;

  if (dto.tenantSlug) {
    tenant = await _database2.default.tenant.findUnique({
      where: { slug: dto.tenantSlug },
      select: { id: true, isActive: true, name: true, businessType: true },
    });
    if (!tenant || !tenant.isActive) throw _errormiddleware.createError.call(void 0, 'Tenant not found or inactive', 404);
    user = await _database2.default.user.findFirst({ where: { tenantId: tenant.id, email: dto.email, isActive: true } });
  } else {
    user = await _database2.default.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: { tenant: { select: { id: true, isActive: true, name: true, businessType: true } } },
    });
    if (user && user.tenant) {
      tenant = user.tenant;
    }
  }

  if (!user || !tenant || !tenant.isActive) throw _errormiddleware.createError.call(void 0, 'Invalid credentials', 401);

  const isValid = await _bcryptjs2.default.compare(dto.password, user.passwordHash);
  if (!isValid) throw _errormiddleware.createError.call(void 0, 'Invalid credentials', 401);

  // Check if email is verified
  if (!user.isEmailVerified) {
    throw _errormiddleware.createError.call(void 0, 'Please verify your email address to log in.', 403);
  }

  await _database2.default.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const token = generateToken(user.id, tenant.id, user.email, user.userRole, _nullishCoalesce(user.roleId, () => undefined));
  const { passwordHash: _, tenant: __, ...safeUser } = user;
  return { user: { ...safeUser, tenantName: tenant.name, businessType: tenant.businessType }, token };
};
exports.login = login;

const changePassword = async (userId, dto) => {
  const user = await _database2.default.user.findUnique({ where: { id: userId } });
  if (!user) throw _errormiddleware.createError.call(void 0, 'User not found', 404);

  const isValid = await _bcryptjs2.default.compare(dto.currentPassword, user.passwordHash);
  if (!isValid) throw _errormiddleware.createError.call(void 0, 'Current password is incorrect', 400);

  const passwordHash = await _bcryptjs2.default.hash(dto.newPassword, SALT_ROUNDS);
  await _database2.default.user.update({ where: { id: userId }, data: { passwordHash } });
  return { message: 'Password changed successfully' };
};
exports.changePassword = changePassword;

const getProfile = async (userId, tenantId) => {
  const user = await _database2.default.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, name: true, email: true, phone: true, userRole: true, avatarUrl: true, lastLogin: true, createdAt: true },
  });
  if (!user) throw _errormiddleware.createError.call(void 0, 'User not found', 404);
  return user;
};
exports.getProfile = getProfile;

const forgotPassword = async (dto) => {
  const user = await _database2.default.user.findFirst({
    where: { email: dto.email, isActive: true },
    select: { id: true, name: true },
  });

  if (!user) {
    return PASSWORD_RESET_RESPONSE;
  }

  await _database2.default.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const rawToken = _crypto2.default.randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await _database2.default.passwordResetToken.create({
    data: { userId: user.id, token: rawToken, expiresAt },
  });

  // Send the password reset code email
  await _emailService.sendMail({
    to: dto.email,
    subject: 'Password Reset Verification Code - Hoteloraa',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0c2340; text-align: center;">Reset Your Password</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your password for your Hoteloraa account. Use the verification code below to proceed with resetting your password. This code will expire in 15 minutes.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #f7f9fa; padding: 10px 20px; border: 1px dashed #d4af37; border-radius: 6px; color: #0c2340; display: inline-block;">${rawToken}</span>
        </div>

        <p>If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `
  });

  return PASSWORD_RESET_RESPONSE;
};
exports.forgotPassword = forgotPassword;

const resetPassword = async (dto) => {
  const tokenRecord = await _database2.default.passwordResetToken.findUnique({
    where: { token: dto.token },
    include: { user: true },
  });

  if (!tokenRecord) throw _errormiddleware.createError.call(void 0, 'Invalid or expired reset code', 400);
  if (tokenRecord.expiresAt < new Date()) {
    await _database2.default.passwordResetToken.delete({ where: { id: tokenRecord.id } });
    throw _errormiddleware.createError.call(void 0, 'Reset code has expired. Please request a new one.', 400);
  }

  const passwordHash = await _bcryptjs2.default.hash(dto.newPassword, SALT_ROUNDS);
  await _database2.default.user.update({
    where: { id: tokenRecord.userId },
    data: { passwordHash },
  });

  await _database2.default.passwordResetToken.delete({ where: { id: tokenRecord.id } });

  return { message: 'Password reset successfully. You can now log in with your new password.' };
};
exports.resetPassword = resetPassword;

const verifyEmail = async (token) => {
  const user = await _database2.default.user.findFirst({
    where: { verificationToken: token }
  });

  if (!user) {
    throw _errormiddleware.createError.call(void 0, 'Invalid or expired verification token', 400);
  }

  await _database2.default.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      verificationToken: null
    }
  });

  return { message: 'Email verified successfully! You can now log in.' };
};
exports.verifyEmail = verifyEmail;

const generateToken = (id, tenantId, email, userRole, roleId) => {
  return _jsonwebtoken2.default.sign(
    { id, tenantId, email, userRole, roleId },
    _env2.default.jwt.secret,
    { expiresIn: _env2.default.jwt.expiresIn }
  );
};
