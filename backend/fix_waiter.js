const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Add CAPTAIN to the enum
  await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CAPTAIN' AFTER 'RECEPTIONIST';`);
  console.log('Added CAPTAIN to UserRole enum');

  // 2. Update all users with WAITER to CAPTAIN
  const updated = await prisma.$executeRawUnsafe(`UPDATE public.users SET "userRole" = 'CAPTAIN' WHERE "userRole" = 'WAITER';`);
  console.log(`Updated ${updated} users from WAITER to CAPTAIN`);

  // 3. Rename WAITER to something that indicates it's deprecated (can't remove enum values in PG easily)
  // We'll rename it so it won't conflict
  await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" RENAME VALUE 'WAITER' TO 'WAITER_DEPRECATED';`);
  console.log('Renamed WAITER to WAITER_DEPRECATED');

  // Verify
  const result = await prisma.$queryRaw`
    SELECT enumlabel FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ORDER BY enumsortorder;
  `;
  console.log('Updated enum values:', result.map(r => r.enumlabel));

  const users = await prisma.$queryRaw`SELECT DISTINCT "userRole"::text as role FROM public.users;`;
  console.log('Roles now in use:', users.map(u => u.role));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
