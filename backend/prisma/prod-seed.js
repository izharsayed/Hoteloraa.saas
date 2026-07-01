const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Starting Production Seeding...');

  // 1. Seed system permissions
  console.log('Seeding system permissions...');
  const modulesList = [
    'DASHBOARD', 'TABLES', 'MENU', 'ORDERS', 'KOT', 'BILLING', 'POS',
    'ROOMS', 'ROOM_TYPES', 'GUESTS', 'RESERVATIONS', 'CHECKIN', 'CHECKOUT',
    'HOUSEKEEPING', 'INVENTORY', 'VENDORS', 'PURCHASES', 'PAYMENTS',
    'REPORTS', 'SETTINGS', 'USERS', 'ROLES'
  ];
  const actionsList = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

  const permissionsData = modulesList.flatMap(module =>
    actionsList.map(action => ({ module, action, description: `Can ${action.toLowerCase()} ${module.toLowerCase()}` }))
  );

  await prisma.permission.createMany({
    data: permissionsData,
    skipDuplicates: true
  });
  console.log('Permissions seeded.');

  // 2. Seed Super Admin Tenant & User
  console.log('Seeding Super Admin Tenant & User...');
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'SuperAdmin@hoteloraa.com';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadminsecret';
  
  const hashPassword = async (pass) => bcrypt.hash(pass, SALT_ROUNDS);
  const superAdminPasswordHash = await hashPassword(adminPassword);

  // Check if system tenant already exists
  const existingSystemTenant = await prisma.tenant.findUnique({
    where: { slug: 'system' }
  });

  if (!existingSystemTenant) {
    await prisma.tenant.create({
      data: {
        name: 'Hoteloraa System Node',
        slug: 'system',
        businessType: 'HOTEL_RESTAURANT',
        isActive: true,
        email: 'support@hoteloraa.com',
        phone: '+919999999999',
        users: {
          create: {
            name: 'Global Administrator',
            email: adminEmail,
            passwordHash: superAdminPasswordHash,
            userRole: 'SUPER_ADMIN',
            isActive: true
          }
        },
        subscription: {
          create: {
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            startDate: new Date(),
            amount: 0
          }
        }
      }
    });
    console.log('Super Admin Seeded successfully.');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword === 'superadminsecret' ? 'superadminsecret (Default - Please change immediately!)' : '******'}`);
  } else {
    console.log('⚠️  System Tenant already exists. Skipping Super Admin creation.');
  }

  console.log('✅ Production Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
