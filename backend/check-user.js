const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const user = await p.user.findFirst({
    where: { name: { contains: 'Izz', mode: 'insensitive' } },
    select: { id: true, name: true, email: true, isActive: true, userRole: true, tenantId: true }
  });
  console.log('User:', JSON.stringify(user, null, 2));

  // Also check TANN01 tenant
  const tenant = await p.tenant.findFirst({
    where: { slug: { contains: 'TANN01', mode: 'insensitive' } },
    select: { id: true, name: true, slug: true, isActive: true }
  });
  console.log('Tenant:', JSON.stringify(tenant, null, 2));
  
  await p.$disconnect();
}

main().catch(e => { console.error(e.message); p.$disconnect(); });
