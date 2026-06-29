const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst({ where: { userRole: 'MANAGER' } });
  if (!user) { console.log('no manager'); return; }
  
  const token = jwt.sign(
    { id: user.id, tenantId: user.tenantId, email: user.email, userRole: user.userRole, roleId: user.roleId },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-it-in-production',
    { expiresIn: '1d' }
  );

  try {
    const res = await fetch(`http://localhost:5000/api/v1/attendance/monthly-summary?userId=${user.id}&year=2026&month=6`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('DATA:', data);
  } catch (err) {
    console.log('ERROR:', err);
  }
}

test().catch(console.error);
