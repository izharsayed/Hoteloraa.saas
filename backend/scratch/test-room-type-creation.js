"use strict";

const db = require('../src/config/database').default || require('../src/config/database');

async function testRoomTypeCreation() {
  console.log('🧪 Testing Room Type Creation database validation...');

  const tenant = await db.tenant.findUnique({
    where: { slug: 'royal-palace' }
  });

  if (!tenant) {
    throw new Error('❌ Tenant royal-palace not found!');
  }

  const testName = `Test Room Type - ${Date.now()}`;
  console.log(`\n--- 1. Creating Room Type: "${testName}"... ---`);

  const createdType = await db.roomType.create({
    data: {
      tenantId: tenant.id,
      name: testName,
      basePrice: 5500,
      maxOccupancy: 4,
      amenities: ['Wi-Fi', 'Premium Minibar', 'AC'],
      description: 'A spacious testing suite with high-tech controls.',
      isActive: true
    }
  });

  console.log('✅ Room Type created successfully:', createdType.id, 'Name:', createdType.name);

  // Verify list
  const roomTypes = await db.roomType.findMany({
    where: { tenantId: tenant.id, isActive: true }
  });
  const found = roomTypes.find(rt => rt.name === testName);
  if (!found) {
    throw new Error('❌ Created room type not found in active list!');
  }
  console.log('✅ Room type found in active room types list.');

  // Clean up (hard delete)
  await db.roomType.delete({
    where: { id: createdType.id }
  });
  console.log('🧹 Cleaned up test room type completely from DB.');

  console.log('\n🎉 Room Type validation tests passed successfully!');
}

testRoomTypeCreation().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
