const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst({ where: { userRole: 'MANAGER' } });
  if (!user) { console.log('no manager'); return; }
  
  const token = jwt.sign(
    { id: user.id, tenantId: user.tenantId, email: user.email, userRole: user.userRole, roleId: user.roleId },
    process.env.JWT_SECRET || 'fallback-secret-here-if-needed',
    { expiresIn: '1d' }
  );

  try {
    const res = await axios.get(`http://localhost:5000/api/v1/attendance/monthly-summary?userId=${user.id}&year=2026&month=6`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.log('ERROR:', err.response?.data || err.message);
  }
}

test().catch(console.error);
