const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function seedGrandPalace() {
  console.log('Seeding Grand Palace Hotel & Restaurant demo accounts...');

  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'grand-palace' }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Grand Palace Hotel & Resort',
        slug: 'grand-palace',
        businessType: 'HOTEL_RESTAURANT',
        isActive: true,
        email: 'admin@grandpalace.com',
        phone: '+919876543210',
        subscription: {
          create: {
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            startDate: new Date(),
            amount: 14999
          }
        },
        features: {
          create: [
            { feature: 'POS', isEnabled: true },
            { feature: 'ROOMS', isEnabled: true },
            { feature: 'HOUSEKEEPING', isEnabled: true }
          ]
        }
      }
    });
    console.log('Created tenant: Grand Palace Hotel & Resort');
  }

  const usersToCreate = [
    { name: 'Grand Palace Admin', email: 'admin@grandpalace.com', pass: 'admin123', userRole: 'TENANT_ADMIN' },
    { name: 'Grand Palace Manager', email: 'manager@grandpalace.com', pass: 'manager123', userRole: 'MANAGER' },
    { name: 'Front Desk Reception', email: 'reception@grandpalace.com', pass: 'reception123', userRole: 'RECEPTIONIST' },
    { name: 'Captain POS', email: 'captain@grandpalace.com', pass: 'captain123', userRole: 'CAPTAIN' },
    { name: 'Chef KOT', email: 'chef@grandpalace.com', pass: 'chef123', userRole: 'CHEF' },
  ];

  for (const u of usersToCreate) {
    const existing = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email: u.email }
    });

    const passwordHash = await bcrypt.hash(u.pass, SALT_ROUNDS);

    if (!existing) {
      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: u.name,
          email: u.email,
          passwordHash: passwordHash,
          userRole: u.userRole,
          isActive: true
        }
      });
      console.log(`✅ Created user: ${u.email} (${u.userRole})`);
    } else {
      // Update password hash to make sure password works
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: passwordHash, isActive: true }
      });
      console.log(`🔄 Updated user: ${u.email}`);
    }
  }

  console.log('🎉 Grand Palace accounts seeded successfully!');
  await prisma.$disconnect();
}

seedGrandPalace().catch(err => {
  console.error('Error seeding Grand Palace:', err);
  prisma.$disconnect();
  process.exit(1);
});
