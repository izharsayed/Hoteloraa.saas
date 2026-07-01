const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Verifying all users in the database...');
  const result = await prisma.user.updateMany({
    data: {
      isEmailVerified: true,
      verificationToken: null,
    },
  });
  console.log(`Successfully verified ${result.count} user(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
