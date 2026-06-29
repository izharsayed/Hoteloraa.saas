"use strict";

const db = require('../src/config/database').default || require('../src/config/database');

async function testGuestIdUpload() {
  console.log('🧪 Testing Guest Registration with ID Proof Details and Document Upload...');

  const tenant = await db.tenant.findUnique({
    where: { slug: 'royal-palace' }
  });

  if (!tenant) {
    throw new Error('❌ Tenant royal-palace not found!');
  }

  const testPhone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
  console.log(`\n--- 1. Registering Guest with Phone: ${testPhone}... ---`);

  const createdGuest = await db.guest.create({
    data: {
      tenantId: tenant.id,
      name: 'John Doe Testing',
      phone: testPhone,
      email: 'john.doe@test.com',
      idType: 'PASSPORT',
      idNumber: 'PASSPORT-12345',
      idProofUrl: '/uploads/guest_test_id.jpg',
      address: '123 Test Avenue',
      city: 'Mumbai',
      country: 'India'
    }
  });

  console.log('✅ Guest created successfully:', createdGuest.id);
  console.log('✅ Guest ID Type:', createdGuest.idType);
  console.log('✅ Guest ID Number:', createdGuest.idNumber);
  console.log('✅ Guest ID Proof URL:', createdGuest.idProofUrl);

  if (createdGuest.idType !== 'PASSPORT' || createdGuest.idProofUrl !== '/uploads/guest_test_id.jpg') {
    throw new Error('❌ Guest ID fields failed validation check!');
  }

  // Clean up
  await db.guest.delete({
    where: { id: createdGuest.id }
  });
  console.log('🧹 Cleaned up test guest completely from DB.');

  console.log('\n🎉 Guest ID Upload database validation tests passed successfully!');
}

testGuestIdUpload().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
