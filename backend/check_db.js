const prisma = require('./src/config/database').default;

async function check() {
  try {
    const tenantsCount = await prisma.tenant.count();
    const usersCount = await prisma.user.count();
    const rolesCount = await prisma.role.count();
    
    console.log('--- DATABASE CHECK ---');
    console.log(`Tenants count: ${tenantsCount}`);
    console.log(`Users count: ${usersCount}`);
    console.log(`Roles count: ${rolesCount}`);

    console.log('\n--- LATEST USERS ---');
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        userRole: true,
        role: { select: { name: true } },
        createdAt: true
      }
    });
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) | SystemRole: ${u.userRole} | CustomRole: ${u.role?.name || 'None'} | Created: ${u.createdAt}`);
    });

    console.log('\n--- CUSTOM ROLES ---');
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
    roles.forEach(r => {
      console.log(`- ${r.name} (isSystem: ${r.isSystem}) | Description: ${r.description}`);
      console.log(`  Permissions: ${r.permissions.map(p => `${p.permission.module}.${p.permission.action}`).join(', ') || 'None'}`);
    });

  } catch (err) {
    console.error('Error checking database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
