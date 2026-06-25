"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _client = require('@prisma/client');
var _bcryptjs = require('bcryptjs'); var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

const prisma = new (0, _client.PrismaClient)();

async function repairUsers() {
  const SALT_ROUNDS = 12;

  console.log('🔧 Repairing database users...\n');

  const defaultPass   = await _bcryptjs2.default.hash('password123',    SALT_ROUNDS);
  const superAdminPass = await _bcryptjs2.default.hash('superadminsecret', SALT_ROUNDS);

  // Helper: upsert user by email+tenantId
  const upsertUser = async (tenantId, data


) => {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, tenantId }
    });
    if (existing) {
      console.log(`  ↩  Already exists: ${data.email}`);
      return;
    }
    await prisma.user.create({ data: { tenantId, ...data } });
    console.log(`  ✅ Created [${data.userRole.padEnd(13)}] ${data.email}`);
  };

  // ─── 1. Hoteloraa System Tenant → Super Admin ───────────────────────────
  const systemTenant = await prisma.tenant.findUnique({ where: { slug: 'system' } });
  if (systemTenant) {
    console.log(`\n[system] ${systemTenant.name}`);
    await upsertUser(systemTenant.id, {
      name: 'Global Administrator',
      email: 'SuperAdmin@hoteloraa.com',
      passwordHash: superAdminPass,
      userRole: 'SUPER_ADMIN' ,
      isActive: true,
    });
  } else {
    console.log('❌ system tenant not found!');
  }

  // ─── 2. Royal Palace Hotel ───────────────────────────────────────────────
  const t1 = await prisma.tenant.findUnique({ where: { slug: 'royal-palace' } });
  if (t1) {
    console.log(`\n[royal-palace] ${t1.name}`);
    const royalUsers = [
      { name: 'Jubeda Khatun',  email: 'admin@royalpalace.com',   userRole: 'TENANT_ADMIN'   },
      { name: 'Faisal Ahmed',   email: 'faisal@royalpalace.com',  userRole: 'MANAGER'        },
      { name: 'Ravi Verma',     email: 'ravi@royalpalace.com',    userRole: 'CAPTAIN'         },
      { name: 'Tanvir Hussain', email: 'tanvir@royalpalace.com',  userRole: 'CHEF'           },
      // priya, sunita, rahul already exist — upsertUser handles duplicates
      { name: 'Priya Sharma',   email: 'priya@royalpalace.com',   userRole: 'RECEPTIONIST'   },
      { name: 'Sunita Devi',    email: 'sunita@royalpalace.com',  userRole: 'HOUSEKEEPING'   },
      { name: 'Rahul Mehta',    email: 'rahul@royalpalace.com',   userRole: 'ACCOUNTANT'     },
    ];
    for (const u of royalUsers) {
      await upsertUser(t1.id, { ...u, passwordHash: defaultPass, isActive: true });
    }
  } else {
    console.log('❌ royal-palace tenant not found!');
  }

  // ─── 3. Cafe Aroma ───────────────────────────────────────────────────────
  const t2 = await prisma.tenant.findUnique({ where: { slug: 'cafe-aroma' } });
  if (t2) {
    console.log(`\n[cafe-aroma] ${t2.name}`);
    await upsertUser(t2.id, { name: 'Kabir Ahmed', email: 'contact@cafearoma.com', userRole: 'TENANT_ADMIN' , passwordHash: defaultPass, isActive: true });
    await upsertUser(t2.id, { name: 'Mustkim',     email: 'mustkim@caferoma.com',  userRole: 'CASHIER'      , passwordHash: defaultPass, isActive: true });
  }

  // ─── 4. Star Lodge ───────────────────────────────────────────────────────
  const t3 = await prisma.tenant.findUnique({ where: { slug: 'star-lodge' } });
  if (t3) {
    console.log(`\n[star-lodge] ${t3.name}`);
    await upsertUser(t3.id, { name: 'Vikram Singh', email: 'manager@starlodge.com',      userRole: 'TENANT_ADMIN' , passwordHash: defaultPass, isActive: true });
    await upsertUser(t3.id, { name: 'Meera Nair',   email: 'receptionist@starlodge.com', userRole: 'RECEPTIONIST' , passwordHash: defaultPass, isActive: false });
  }

  // ─── 5. Grand Oak Resort ─────────────────────────────────────────────────
  const t4 = await prisma.tenant.findUnique({ where: { slug: 'grand-oak' } });
  if (t4) {
    console.log(`\n[grand-oak] ${t4.name}`);
    await upsertUser(t4.id, { name: 'Amit Roy', email: 'admin@grandoak.com', userRole: 'TENANT_ADMIN' , passwordHash: defaultPass, isActive: true });
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  const allUsers = await prisma.user.findMany({
    select: { name: true, email: true, userRole: true, isActive: true }
  });

  console.log('\n' + '─'.repeat(60));
  console.log('✅ REPAIR COMPLETE\n');
  console.log(`Total users in database: ${allUsers.length}`);
  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('  Super Admin   → SuperAdmin@hoteloraa.com   / superadminsecret');
  console.log('  Tenant Admin  → admin@royalpalace.com       / password123');
  console.log('  Manager       → faisal@royalpalace.com      / password123');
  console.log('  Receptionist  → priya@royalpalace.com       / password123');
  console.log('  Cashier       → mustkim@caferoma.com        / password123');
  console.log('  Captain       → ravi@royalpalace.com        / password123');
  console.log('  Kitchen Staff → tanvir@royalpalace.com      / password123');
  console.log('  Housekeeping  → sunita@royalpalace.com      / password123');
  console.log('  Accountant    → rahul@royalpalace.com       / password123');
}

repairUsers()
  .catch(e => { console.error('Repair failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
