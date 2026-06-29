"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _bcryptjs = require('bcryptjs'); var _bcryptjs2 = _interopRequireDefault(_bcryptjs);
var _errormiddleware = require('../../middleware/error.middleware');

const SALT_ROUNDS = 12;

// ─── OVERVIEW METRICS ──────────────────────────────────────────
 const getOverviewMetrics = async () => {
  const tenants = await _database2.default.tenant.findMany({
    include: { subscription: true }
  });

  const totalTenants = tenants.length;
  const activeSubscribers = tenants.filter(t => t.isActive && _optionalChain([t, 'access', _ => _.subscription, 'optionalAccess', _2 => _2.status]) === 'ACTIVE').length;
  const trialCustomers = tenants.filter(t => _optionalChain([t, 'access', _3 => _3.subscription, 'optionalAccess', _4 => _4.status]) === 'TRIAL').length;
  
  // Calculate MRR
  let mrr = 0;
  tenants.forEach(t => {
    if (t.isActive && _optionalChain([t, 'access', _5 => _5.subscription, 'optionalAccess', _6 => _6.status]) === 'ACTIVE') {
      mrr += t.subscription.amount;
    }
  });

  const arr = mrr * 12;

  // Mock CPU, RAM, Cache Stats for SaaS monitor
  const systemStats = {
    cpuLoad: Math.floor(Math.random() * 15) + 5, // 5% - 20%
    ramUsage: (Math.random() * 0.8 + 2.8).toFixed(1), // 2.8GB - 3.6GB
    dbCacheHit: Math.floor(Math.random() * 5) + 63 // 63% - 68%
  };

  return {
    totalTenants,
    activeSubscribers,
    trialCustomers,
    churnRate: '1.2%',
    averageRevenuePerTenant: totalTenants > 0 ? `₹${Math.round(mrr / totalTenants).toLocaleString('en-IN')}` : '₹0',
    mrr: `₹${mrr.toLocaleString('en-IN')}`,
    arr: arr >= 10000000 ? `₹${(arr / 10000000).toFixed(2)} Cr` : `₹${arr.toLocaleString('en-IN')}`,
    pendingRenewals: Math.floor(Math.random() * 5) + 2,
    systemStats
  };
}; exports.getOverviewMetrics = getOverviewMetrics;

// ─── TENANTS REGISTRY ─────────────────────────────────────────
 const getAllTenants = async () => {
  const tenants = await _database2.default.tenant.findMany({
    include: {
      subscription: true,
      features: true,
      users: {
        where: { userRole: 'TENANT_ADMIN' },
        select: { email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return tenants.map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    businessType: t.businessType,
    plan: _optionalChain([t, 'access', _7 => _7.subscription, 'optionalAccess', _8 => _8.plan]) || 'STARTER',
    status: t.isActive ? (_optionalChain([t, 'access', _9 => _9.subscription, 'optionalAccess', _10 => _10.status]) === 'TRIAL' ? 'TRIAL' : 'ACTIVE') : 'SUSPENDED',
    adminEmail: _optionalChain([t, 'access', _11 => _11.users, 'access', _12 => _12[0], 'optionalAccess', _13 => _13.email]) || 'no-admin@hoteloraa.com',
    dateJoined: t.createdAt.toISOString().split('T')[0],
    features: {
      POS: _optionalChain([t, 'access', _14 => _14.features, 'access', _15 => _15.find, 'call', _16 => _16(f => f.feature === 'POS'), 'optionalAccess', _17 => _17.isEnabled]) || false,
      ROOMS: _optionalChain([t, 'access', _18 => _18.features, 'access', _19 => _19.find, 'call', _20 => _20(f => f.feature === 'ROOMS'), 'optionalAccess', _21 => _21.isEnabled]) || false,
      HOUSEKEEPING: _optionalChain([t, 'access', _22 => _22.features, 'access', _23 => _23.find, 'call', _24 => _24(f => f.feature === 'HOUSEKEEPING'), 'optionalAccess', _25 => _25.isEnabled]) || false
    }
  }));
}; exports.getAllTenants = getAllTenants;

var _crypto = require('crypto');
var _crypto2 = _interopRequireDefault(_crypto);
var _env = require('../../config/env');
var _env2 = _interopRequireDefault(_env);
var _emailService = require('../../shared/email.service');

 const createTenant = async (dto) => {
  const existing = await _database2.default.tenant.findUnique({ where: { slug: dto.slug } });
  if (existing) throw _errormiddleware.createError.call(void 0, 'Tenant slug already exists on cluster', 400);

  const password = Math.random().toString(36).slice(-8);
  const passwordHash = await _bcryptjs2.default.hash(password, SALT_ROUNDS);
  const verificationToken = _crypto2.default.randomBytes(32).toString('hex');

  // Default features based on business type
  const defaultFeaturesMap = {
    RESTAURANT: ['POS'],
    LODGING: ['ROOMS', 'HOUSEKEEPING'],
    HOTEL_RESTAURANT: ['POS', 'ROOMS', 'HOUSEKEEPING']
  };

  const featureKeys = defaultFeaturesMap[dto.businessType] || [];
  const allPossibleFeatures = ['POS', 'ROOMS', 'HOUSEKEEPING'];

  const mrrMap = {
    FREE: 0,
    STARTER: 4999,
    PROFESSIONAL: 9999,
    ENTERPRISE: 14999
  };

  const planAmount = mrrMap[dto.plan] || 0;

  const tenant = await _database2.default.tenant.create({
    data: {
      name: dto.name,
      slug: dto.slug,
      businessType: dto.businessType,
      isActive: true,
      subscription: {
        create: {
          plan: dto.plan,
          status: dto.plan === 'FREE' ? 'TRIAL' : 'ACTIVE',
          amount: planAmount,
          trialEnds: dto.plan === 'FREE' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null
        }
      },
      features: {
        create: allPossibleFeatures.map(f => ({
          feature: f,
          isEnabled: featureKeys.includes(f)
        }))
      },
      users: {
        create: {
          name: `${dto.name} Admin`,
          email: dto.adminEmail,
          passwordHash,
          userRole: 'TENANT_ADMIN',
          isActive: true,
          isEmailVerified: false,
          verificationToken
        }
      },
      settings: {
        create: {}
      }
    }
  });

  // Log to Audit Log
  await _database2.default.auditLog.create({
    data: {
      action: 'TENANT_CREATED',
      actor: 'SuperAdmin',
      entity: dto.name,
      previousValue: 'None',
      newValue: `Type: ${dto.businessType} | Plan: ${dto.plan} | Admin: ${dto.adminEmail}`
    }
  });

  // Send email with details and verification link
  const clientUrl = _env2.default.clientUrl || 'http://localhost:5173';
  const verificationLink = `${clientUrl}/verify-email?token=${verificationToken}`;
  await _emailService.sendMail({
    to: dto.adminEmail,
    subject: `Hoteloraa Property Workspace Created: ${dto.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0c2340; text-align: center;">Your Hoteloraa Property Workspace is Ready!</h2>
        <p>Hello,</p>
        <p>A new property workspace, <strong>${dto.name}</strong>, has been successfully registered and provisioned for you by the Platform Super Administrator.</p>
        
        <div style="background-color: #f7f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e5e5;">
          <h3 style="margin-top: 0; color: #0c2340;">Your Account & Workspace Details</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="width: 150px; font-weight: bold; padding: 4px 0;">Property Name:</td><td>${dto.name}</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Portal URL:</td><td><a href="${clientUrl}/t/${dto.slug}" style="color: #d4af37; text-decoration: none; font-weight: bold;">${clientUrl}/t/${dto.slug}</a></td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Business Type:</td><td>${dto.businessType}</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Admin Email:</td><td>${dto.adminEmail}</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 0;">Temporary Password:</td><td style="font-family: monospace; font-weight: bold; color: #d4af37;">${password}</td></tr>
          </table>
        </div>

        <p>Please click the button below to verify your email address and activate your administrator account. Once verified, you can log in using your email and the temporary password listed above.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #d4af37; color: #0c2340; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Verify & Activate Account</a>
        </div>

        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
          If the button doesn't work, copy and paste this link in your browser:<br>
          <a href="${verificationLink}" style="color: #d4af37;">${verificationLink}</a>
        </p>
      </div>
    `
  });

  return {
    tenant,
    generatedPassword: password
  };
}; exports.createTenant = createTenant;

 const toggleTenantStatus = async (id) => {
  const tenant = await _database2.default.tenant.findUnique({ where: { id } });
  if (!tenant) throw _errormiddleware.createError.call(void 0, 'Tenant not found', 404);

  const updated = await _database2.default.tenant.update({
    where: { id },
    data: { isActive: !tenant.isActive }
  });

  await _database2.default.auditLog.create({
    data: {
      action: updated.isActive ? 'TENANT_ACTIVATED' : 'TENANT_SUSPENDED',
      actor: 'SuperAdmin',
      entity: tenant.name,
      previousValue: `Status: ${tenant.isActive ? 'ACTIVE' : 'SUSPENDED'}`,
      newValue: `Status: ${updated.isActive ? 'ACTIVE' : 'SUSPENDED'}`
    }
  });

  return updated;
}; exports.toggleTenantStatus = toggleTenantStatus;

 const configureTenantFeatures = async (id, dto) => {
  const tenant = await _database2.default.tenant.findUnique({ where: { id }, include: { features: true } });
  if (!tenant) throw _errormiddleware.createError.call(void 0, 'Tenant not found', 404);

  // Update businessType
  await _database2.default.tenant.update({
    where: { id },
    data: { businessType: dto.businessType }
  });

  // Update features
  const featuresList = dto.features; // e.g. { POS: true, ROOMS: false }
  for (const [featName, isEnabled] of Object.entries(featuresList)) {
    await _database2.default.tenantFeature.upsert({
      where: { tenantId_feature: { tenantId: id, feature: featName } },
      create: { tenantId: id, feature: featName, isEnabled: isEnabled  },
      update: { isEnabled: isEnabled  }
    });
  }

  await _database2.default.auditLog.create({
    data: {
      action: 'FEATURE_CONFIGURATION_CHANGED',
      actor: 'SuperAdmin',
      entity: tenant.name,
      previousValue: JSON.stringify(tenant.features.map(f => `${f.feature}:${f.isEnabled}`)),
      newValue: `Type: ${dto.businessType} | Features: ${JSON.stringify(featuresList)}`
    }
  });

  return { success: true };
}; exports.configureTenantFeatures = configureTenantFeatures;

 const configureTenantPlan = async (id, dto) => {
  const tenant = await _database2.default.tenant.findUnique({ where: { id }, include: { subscription: true } });
  if (!tenant) throw _errormiddleware.createError.call(void 0, 'Tenant not found', 404);

  const mrrMap = {
    FREE: 0,
    STARTER: 4999,
    PROFESSIONAL: 9999,
    ENTERPRISE: 14999
  };

  const planAmount = mrrMap[dto.plan] || 0;

  const updatedSubscription = await _database2.default.subscription.update({
    where: { tenantId: id },
    data: {
      plan: dto.plan,
      amount: planAmount,
      status: dto.plan === 'FREE' ? 'TRIAL' : 'ACTIVE'
    }
  });

  await _database2.default.auditLog.create({
    data: {
      action: 'SUBSCRIPTION_UPGRADED',
      actor: 'SuperAdmin',
      entity: tenant.name,
      previousValue: `Plan: ${_optionalChain([tenant, 'access', _26 => _26.subscription, 'optionalAccess', _27 => _27.plan])}`,
      newValue: `Plan: ${dto.plan}`
    }
  });

  return updatedSubscription;
}; exports.configureTenantPlan = configureTenantPlan;

 const deleteTenant = async (id) => {
  const tenant = await _database2.default.tenant.findUnique({ where: { id } });
  if (!tenant) throw _errormiddleware.createError.call(void 0, 'Tenant not found', 404);

  await _database2.default.tenant.delete({ where: { id } });

  await _database2.default.auditLog.create({
    data: {
      action: 'TENANT_DELETED',
      actor: 'SuperAdmin',
      entity: tenant.name,
      previousValue: `Slug: ${tenant.slug}`,
      newValue: 'DELETED'
    }
  });

  return { success: true };
}; exports.deleteTenant = deleteTenant;

// ─── SUBSCRIPTION PLANS ────────────────────────────────────────
 const getSubscriptionPlans = async () => {
  // Return preconfigured SaaS pricing plans mapped with statistics
  const tenants = await _database2.default.tenant.findMany({ include: { subscription: true } });
  
  const getCount = (plan) => tenants.filter(t => _optionalChain([t, 'access', _28 => _28.subscription, 'optionalAccess', _29 => _29.plan]) === plan).length;

  return [
    { id: 1, name: 'Free Trial', monthlyPrice: 0, yearlyPrice: 0, userLimit: 3, storageLimit: 1, status: 'ACTIVE', features: ['pos', 'rooms'], activeTenantsCount: getCount('FREE') },
    { id: 2, name: 'Starter Plan', monthlyPrice: 4999, yearlyPrice: 49990, userLimit: 10, storageLimit: 5, status: 'ACTIVE', features: ['pos', 'rooms', 'kot'], activeTenantsCount: getCount('STARTER') },
    { id: 3, name: 'Professional Plan', monthlyPrice: 9999, yearlyPrice: 99990, userLimit: 30, storageLimit: 20, status: 'ACTIVE', features: ['pos', 'rooms', 'kot', 'housekeeping', 'inventory'], activeTenantsCount: getCount('PROFESSIONAL') },
    { id: 4, name: 'Enterprise Suite', monthlyPrice: 14999, yearlyPrice: 149990, userLimit: 100, storageLimit: 100, status: 'ACTIVE', features: ['pos', 'rooms', 'kot', 'housekeeping', 'inventory', 'reports', 'room_service', 'guest_folio'], activeTenantsCount: getCount('ENTERPRISE') },
  ];
}; exports.getSubscriptionPlans = getSubscriptionPlans;

// ─── USERS DIRECTORY ──────────────────────────────────────────
 const getAllUsers = async () => {
  const users = await _database2.default.user.findMany({
    include: { tenant: true, role: true },
    orderBy: { createdAt: 'desc' }
  });

  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    tenant: u.tenant.name,
    role: u.userRole === 'TENANT_ADMIN' ? 'Tenant Admin' : (_optionalChain([u, 'access', _30 => _30.role, 'optionalAccess', _31 => _31.name]) || u.userRole),
    isActive: u.isActive,
    lastLogin: u.lastLogin ? u.lastLogin.toISOString().replace('T', ' ').substring(0, 19) : 'Never',
    initials: u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }));
}; exports.getAllUsers = getAllUsers;

 const toggleUserStatus = async (id) => {
  const user = await _database2.default.user.findUnique({ where: { id } });
  if (!user) throw _errormiddleware.createError.call(void 0, 'User not found', 404);

  const updated = await _database2.default.user.update({
    where: { id },
    data: { isActive: !user.isActive }
  });

  await _database2.default.auditLog.create({
    data: {
      action: updated.isActive ? 'USER_ENABLED' : 'USER_DISABLED',
      actor: 'SuperAdmin',
      entity: user.email,
      previousValue: `IsActive: ${user.isActive}`,
      newValue: `IsActive: ${updated.isActive}`
    }
  });

  return updated;
}; exports.toggleUserStatus = toggleUserStatus;

 const resetUserPassword = async (id, dto) => {
  const user = await _database2.default.user.findUnique({ where: { id } });
  if (!user) throw _errormiddleware.createError.call(void 0, 'User not found', 404);

  const passwordHash = await _bcryptjs2.default.hash(dto.password, SALT_ROUNDS);
  await _database2.default.user.update({
    where: { id },
    data: { passwordHash }
  });

  await _database2.default.auditLog.create({
    data: {
      action: 'PASSWORD_RESET',
      actor: 'SuperAdmin',
      entity: user.email,
      previousValue: 'PasswordHash Override',
      newValue: 'PasswordHash Override Success'
    }
  });

  return { success: true };
}; exports.resetUserPassword = resetUserPassword;

// ─── AUDIT LOGS ───────────────────────────────────────────────
 const getAuditLogs = async () => {
  return _database2.default.auditLog.findMany({
    orderBy: { timestamp: 'desc' }
  });
}; exports.getAuditLogs = getAuditLogs;

 const createSimulatedLog = async (dto) => {
  return _database2.default.auditLog.create({
    data: {
      action: dto.action,
      actor: dto.actor,
      entity: dto.entity,
      previousValue: dto.previousValue,
      newValue: dto.newValue,
      severity: dto.severity
    }
  });
}; exports.createSimulatedLog = createSimulatedLog;

// ─── GLOBAL RBAC ──────────────────────────────────────────────
 const getGlobalRoles = async () => {
  // Get all master roles seeded under system tenant
  const systemTenant = await _database2.default.tenant.findUnique({ where: { slug: 'system' } });
  if (!systemTenant) return [];

  const roles = await _database2.default.role.findMany({
    where: { tenantId: systemTenant.id },
    include: { permissions: { include: { permission: true } } }
  });

  return roles.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissions: r.permissions.map(p => `${p.permission.module.toLowerCase()}.${p.permission.action.toLowerCase()}`)
  }));
}; exports.getGlobalRoles = getGlobalRoles;

 const updateRolePermissions = async (id, dto) => {
  // Reset all permissions for this system role
  await _database2.default.rolePermission.deleteMany({ where: { roleId: id } });

  // Map and add new permissions
  const permissionKeys = dto.permissions ; // e.g. ["room.view", "kot.update"]
  
  for (const key of permissionKeys) {
    const [mod, act] = key.split('.');
    const permission = await _database2.default.permission.findFirst({
      where: {
        module: mod.toUpperCase(),
        action: act.toUpperCase()
      }
    });

    if (permission) {
      await _database2.default.rolePermission.create({
        data: {
          roleId: id,
          permissionId: permission.id
        }
      });
    }
  }

  return { success: true };
}; exports.updateRolePermissions = updateRolePermissions;

 const createRole = async (dto) => {
  const systemTenant = await _database2.default.tenant.findUnique({ where: { slug: 'system' } });
  if (!systemTenant) throw _errormiddleware.createError.call(void 0, 'System node tenant not found', 500);

  const existing = await _database2.default.role.findFirst({
    where: { tenantId: systemTenant.id, name: dto.name }
  });
  if (existing) throw _errormiddleware.createError.call(void 0, 'Role name already exists', 400);

  const role = await _database2.default.role.create({
    data: {
      tenantId: systemTenant.id,
      name: dto.name,
      description: dto.description,
      isSystem: false
    }
  });

  return role;
}; exports.createRole = createRole;

 const deleteRole = async (id) => {
  const role = await _database2.default.role.findUnique({ where: { id } });
  if (!role) throw _errormiddleware.createError.call(void 0, 'Role not found', 404);
  if (role.isSystem) throw _errormiddleware.createError.call(void 0, 'Cannot delete predefined system roles', 400);

  await _database2.default.role.delete({ where: { id } });
  return { success: true };
}; exports.deleteRole = deleteRole;
