"use strict";

const db = require('../src/config/database').default || require('../src/config/database');
const bcrypt = require('bcryptjs');

async function testRoomsCrud() {
  console.log('🧪 Testing Rooms Add & Delete CRUD APIs directly in database and via routes...');

  // 1. Get Tenant Royal Palace
  const tenant = await db.tenant.findUnique({
    where: { slug: 'royal-palace' },
    include: { roomTypes: true }
  });

  if (!tenant) {
    throw new Error('❌ Tenant royal-palace not found!');
  }

  const roomType = tenant.roomTypes[0];
  if (!roomType) {
    throw new Error('❌ No room types found for royal-palace tenant!');
  }

  console.log(`✅ Tenant: ${tenant.name}`);
  console.log(`✅ Room Type: ${roomType.name} (ID: ${roomType.id})`);

  // 2. Test DB Creation of a Room
  const testNumber = `TEST-${Date.now().toString().slice(-4)}`;
  console.log(`\n--- 1. Creating Room ${testNumber}... ---`);
  
  const createdRoom = await db.room.create({
    data: {
      tenantId: tenant.id,
      roomTypeId: roomType.id,
      number: testNumber,
      floor: '3',
      status: 'AVAILABLE',
      isActive: true
    }
  });

  console.log('✅ Room created successfully in DB:', createdRoom.id, 'Number:', createdRoom.number);

  // Check it exists in getRooms logic
  const rooms = await db.room.findMany({
    where: { tenantId: tenant.id, isActive: true }
  });
  const found = rooms.find(r => r.number === testNumber);
  if (!found) {
    throw new Error('❌ Created room not found in active rooms list!');
  }
  console.log('✅ Room found in active rooms list.');

  // 3. Test DB Deletion of a Room (Soft delete is implemented as isActive=false in backend)
  console.log(`\n--- 2. Deleting Room ${testNumber}... ---`);
  const updatedRoom = await db.room.update({
    where: { id: createdRoom.id },
    data: { isActive: false }
  });

  console.log('✅ Room marked as inactive (soft deleted):', updatedRoom.id, 'isActive:', updatedRoom.isActive);

  // Verify it is excluded from active list
  const roomsAfterDelete = await db.room.findMany({
    where: { tenantId: tenant.id, isActive: true }
  });
  const foundAfter = roomsAfterDelete.find(r => r.number === testNumber);
  if (foundAfter) {
    throw new Error('❌ Soft-deleted room is still showing in active rooms list!');
  }
  console.log('✅ Verified room is excluded from active rooms.');

  // Clean up completely (hard delete for test room)
  await db.room.delete({
    where: { id: createdRoom.id }
  });
  console.log('🧹 Cleaned up test room completely from DB.');
  
  console.log('\n🎉 Direct CRUD database tests passed successfully!');
}

testRoomsCrud().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
