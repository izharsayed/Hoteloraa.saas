const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const defaultPassHash = await bcrypt.hash('password123', 12);
  
  // Find all manager users
  const managers = await prisma.user.findMany({
    where: { userRole: 'MANAGER' }
  });
  
  console.log(`Found ${managers.length} manager users. Resetting passwords to "password123" and verifying emails...`);
  
  for (const m of managers) {
    await prisma.user.update({
      where: { id: m.id },
      data: {
        passwordHash: defaultPassHash,
        isEmailVerified: true,
        isActive: true
      }
    });
    console.log(`  - Verified and reset password for Manager: ${m.name} (${m.email})`);
  }
  
  console.log('All manager accounts have been repaired successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
