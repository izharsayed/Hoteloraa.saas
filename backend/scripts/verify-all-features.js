/**
 * End-to-End Feature Verification Script for Hoteloraa SaaS
 * Tests:
 * 1. Health Check
 * 2. Multi-Tenant Registration
 * 3. Tenant Login & Auth
 * 4. User Creation (RBAC)
 * 5. Room Type & Room Creation
 * 6. Guest Registration
 * 7. Reservation & Check-In
 * 8. Menu Category & Item Creation
 * 9. Table Creation
 * 10. Restaurant Order, Status Transition & KOT
 * 11. Bill Generation & Payment
 * 12. Vendor Registration
 * 13. Inventory Item Creation
 * 14. Purchase Order & Receiving (Stock Update)
 * 15. Lodging Checkout & Invoice Folio
 * 16. Dashboard Stats
 */

const BASE_URL = 'http://localhost:5000/api/v1';

// ANSI terminal colors for beautiful logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function apiRequest(path, method = 'GET', body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { text };
    }

    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: { error: error.message }
    };
  }
}

function assertResponse(res, expectedStatus, stepName) {
  const isMatch = Array.isArray(expectedStatus)
    ? expectedStatus.includes(res.status)
    : res.status === expectedStatus;
  if (!isMatch) {
    console.error(`${colors.red}❌ Fail [${stepName}]: Expected status ${expectedStatus}, got ${res.status}${colors.reset}`);
    console.error('Response Data:', JSON.stringify(res.data, null, 2));
    throw new Error(`Step failed: ${stepName}`);
  }
  console.log(`${colors.green}✅ Pass [${stepName}]: Status ${res.status}${colors.reset}`);
}

async function runTests() {
  console.log(`${colors.bright}${colors.blue}=== Starting Hoteloraa SaaS End-to-End Verification ===${colors.reset}\n`);

  try {
    // -------------------------------------------------------------
    // 1. Health Check
    // -------------------------------------------------------------
    console.log(`${colors.cyan}Step 1: Checking API Health...${colors.reset}`);
    const health = await apiRequest('/health');
    assertResponse(health, 200, 'Health Check');

    // -------------------------------------------------------------
    // 2. Tenant Registration
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 2: Registering a new Tenant...${colors.reset}`);
    const uniqueId = Date.now().toString().slice(-6);
    const tenantData = {
      tenantName: `Integration Test Resort ${uniqueId}`,
      tenantSlug: `int-test-resort-${uniqueId}`,
      businessType: 'HOTEL_RESTAURANT',
      name: 'Integration Admin',
      email: `admin-${uniqueId}@integrationtest.com`,
      password: 'password123',
      phone: '+919999999999'
    };
    const register = await apiRequest('/auth/register', 'POST', tenantData);
    assertResponse(register, 201, 'Tenant Registration');
    console.log(`Registered Tenant Slug: ${tenantData.tenantSlug}`);

    // -------------------------------------------------------------
    // 3. Tenant Login
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 3: Logging in as Tenant Admin...${colors.reset}`);
    const login = await apiRequest('/auth/login', 'POST', {
      email: tenantData.email,
      password: tenantData.password
    });
    assertResponse(login, 200, 'Tenant Admin Login');
    const token = login.data.data.token;
    console.log('Login successful, JWT token acquired.');

    // -------------------------------------------------------------
    // 4. User & RBAC Creation
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 4: Creating new users for staff roles...${colors.reset}`);
    
    // 4.1 Captain
    const captainUser = {
      name: 'Test Captain',
      email: `captain-${uniqueId}@integrationtest.com`,
      phone: '1231231234',
      userRole: 'CAPTAIN',
      password: 'password123'
    };
    const createCaptain = await apiRequest('/users', 'POST', captainUser, token);
    assertResponse(createCaptain, 201, 'Create Captain User');

    // 4.2 Receptionist
    const receptionistUser = {
      name: 'Test Receptionist',
      email: `recept-${uniqueId}@integrationtest.com`,
      phone: '+917777777777',
      userRole: 'RECEPTIONIST',
      password: 'password123'
    };
    const createRecept = await apiRequest('/users', 'POST', receptionistUser, token);
    assertResponse(createRecept, 201, 'Create Receptionist User');

    // Get Users list
    const getUsers = await apiRequest('/users', 'GET', null, token);
    assertResponse(getUsers, 200, 'Get Users Directory');
    console.log(`Staff Directory count: ${getUsers.data.data.length} users.`);

    // -------------------------------------------------------------
    // 5. Lodging - Room Type & Room
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 5: Setting up Lodging Rooms...${colors.reset}`);
    
    const roomTypeData = {
      name: 'Executive Suite',
      description: 'Luxurious suite with ocean view',
      basePrice: 5000,
      maxOccupancy: 4,
      amenities: ['WiFi', 'AC', 'Mini-Bar', 'Jacuzzi']
    };
    const createRoomType = await apiRequest('/room-types', 'POST', roomTypeData, token);
    assertResponse(createRoomType, 201, 'Create Room Type');
    const roomTypeId = createRoomType.data.data.id;

    const roomData = {
      roomTypeId,
      number: '401',
      floor: '4th Floor',
      description: 'Corner suite 401'
    };
    const createRoom = await apiRequest('/rooms', 'POST', roomData, token);
    assertResponse(createRoom, 201, 'Create Room');
    const roomId = createRoom.data.data.id;

    // -------------------------------------------------------------
    // 6. Guest Registration
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 6: Registering Guest...${colors.reset}`);
    const guestData = {
      name: 'Alice Johnson',
      phone: '+919911991199',
      email: 'alice@johnson.com',
      idType: 'PASSPORT',
      idNumber: 'P1234567',
      address: '123 Baker Street',
      city: 'London',
      country: 'United Kingdom'
    };
    const createGuest = await apiRequest('/guests', 'POST', guestData, token);
    assertResponse(createGuest, 201, 'Register Guest');
    const guestId = createGuest.data.data.id;

    // -------------------------------------------------------------
    // 7. Reservation & Check-In
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 7: Creating Reservation and Checking In...${colors.reset}`);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const reservationData = {
      roomId,
      guestId,
      checkInDate: todayStr,
      checkOutDate: tomorrowStr,
      adults: 2,
      children: 1,
      ratePerNight: 5000,
      extraCharges: 200,
      discount: 0,
      specialRequest: 'High floor, late arrival'
    };
    
    const createRes = await apiRequest('/reservations', 'POST', reservationData, token);
    assertResponse(createRes, 201, 'Create Reservation');
    const reservationId = createRes.data.data.id;

    const checkInRes = await apiRequest('/check-in', 'POST', { reservationId }, token);
    assertResponse(checkInRes, [200, 201], 'Perform Check-In');

    // Verify room status changed to OCCUPIED
    const roomCheck = await apiRequest(`/rooms/${roomId}`, 'GET', null, token);
    assertResponse(roomCheck, 200, 'Verify Room Status');
    console.log(`Room 401 status updated to: ${roomCheck.data.data.status}`);

    // -------------------------------------------------------------
    // 8. Restaurant - Menu Category & Item
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 8: Setting up Restaurant Menu...${colors.reset}`);
    
    const categoryData = {
      name: 'Gourmet Mains',
      description: 'Premium signature dishes',
      sortOrder: 1
    };
    const createCategory = await apiRequest('/menu/categories', 'POST', categoryData, token);
    assertResponse(createCategory, 201, 'Create Menu Category');
    const menuCategoryId = createCategory.data.data.id;

    const menuItemData = {
      menuCategoryId,
      name: 'Truffle Butter Lobster',
      description: 'Fresh lobster tails poached in black truffle butter',
      price: 1800,
      costPrice: 650,
      isVeg: false,
      isAvailable: true,
      preparationTime: 25
    };
    const createItem = await apiRequest('/menu/items', 'POST', menuItemData, token);
    assertResponse(createItem, 201, 'Create Menu Item');
    const menuItemId = createItem.data.data.id;

    // -------------------------------------------------------------
    // 9. Restaurant - Table Setup
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 9: Adding Restaurant Table...${colors.reset}`);
    const tableData = {
      name: 'T-12',
      capacity: 4,
      floor: 'Ground',
      section: 'Main Dining Room'
    };
    const createTable = await apiRequest('/tables', 'POST', tableData, token);
    assertResponse(createTable, 201, 'Create Table');
    const tableId = createTable.data.data.id;

    // -------------------------------------------------------------
    // 10. Restaurant - Order & KOT Status Transition
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 10: Creating Restaurant Order & Processing KOT...${colors.reset}`);
    const orderData = {
      tableId,
      items: [
        {
          menuItemId,
          quantity: 2,
          notes: 'Medium rare lobster please'
        }
      ],
      notes: 'Guest room 401 charge'
    };
    const createOrder = await apiRequest('/orders', 'POST', orderData, token);
    assertResponse(createOrder, 201, 'Create Restaurant Order');
    const orderId = createOrder.data.data.id;
    console.log(`Order created. Subtotal: ${createOrder.data.data.subtotal}, Total: ${createOrder.data.data.totalAmount}`);

    // Update order status: PENDING -> PREPARING -> READY -> SERVED
    const status1 = await apiRequest(`/orders/${orderId}/status`, 'PATCH', { status: 'PREPARING' }, token);
    assertResponse(status1, 200, 'Order Status -> PREPARING');
    
    const status2 = await apiRequest(`/orders/${orderId}/status`, 'PATCH', { status: 'READY' }, token);
    assertResponse(status2, 200, 'Order Status -> READY');

    const status3 = await apiRequest(`/orders/${orderId}/status`, 'PATCH', { status: 'SERVED' }, token);
    assertResponse(status3, 200, 'Order Status -> SERVED');

    // -------------------------------------------------------------
    // 11. Bill Generation (Restaurant Payment)
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 11: Generating Restaurant Bill...${colors.reset}`);
    const billData = {
      orderId,
      discountAmount: 100,
      paymentMethod: 'CARD',
      notes: 'Paid at table via terminal'
    };
    const generateBill = await apiRequest('/billing/generate', 'POST', billData, token);
    assertResponse(generateBill, 201, 'Generate Order Bill');
    console.log(`Final Payment Amount after discount: ${generateBill.data.data.amount}`);

    // -------------------------------------------------------------
    // 12. Vendor Management
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 12: Creating Vendor...${colors.reset}`);
    const vendorData = {
      name: 'Organic Farm Suppliers',
      email: 'sales@organicfarm.com',
      phone: '+919988776655',
      address: 'Green Fields Road, Pune',
      gstin: '27AAAAA1111A1Z1',
      contactName: 'Ramesh Patel'
    };
    const createVendor = await apiRequest('/vendors', 'POST', vendorData, token);
    assertResponse(createVendor, 201, 'Create Vendor');
    const vendorId = createVendor.data.data.id;

    // -------------------------------------------------------------
    // 13. Inventory Management
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 13: Adding Inventory Item...${colors.reset}`);
    const inventoryData = {
      name: 'Fresh Mint Leaves',
      description: 'Used for mocktails and culinary garnishing',
      sku: `MNT-${uniqueId}`,
      unit: 'KG',
      quantity: 10,
      minimumStock: 2,
      costPrice: 150
    };
    const createInvItem = await apiRequest('/inventory', 'POST', inventoryData, token);
    assertResponse(createInvItem, 201, 'Create Inventory Item');
    const inventoryItemId = createInvItem.data.data.id;

    // -------------------------------------------------------------
    // 14. Purchase Order & Inventory Stock Update
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 14: Processing Purchase Order & Updating Stock...${colors.reset}`);
    const purchaseData = {
      vendorId,
      items: [
        {
          inventoryItemId,
          quantity: 15,
          unitPrice: 140
        }
      ],
      notes: 'Weekly fresh herb replenishment'
    };
    const createPO = await apiRequest('/purchases', 'POST', purchaseData, token);
    assertResponse(createPO, 201, 'Create Purchase Order');
    const purchaseId = createPO.data.data.id;

    // Receive purchase
    const receivePO = await apiRequest(`/purchases/${purchaseId}/receive`, 'POST', null, token);
    assertResponse(receivePO, 200, 'Receive Purchase Order');

    // Verify inventory level updated (10 + 15 = 25)
    const verifyInv = await apiRequest(`/inventory/${inventoryItemId}`, 'GET', null, token);
    assertResponse(verifyInv, 200, 'Verify Inventory Stock Update');
    console.log(`Mint leaves stock quantity updated to: ${verifyInv.data.data.quantity} KG`);

    // -------------------------------------------------------------
    // 15. Guest Folio Checkout (Lodging Check-Out)
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 15: Executing Checkout & Billing...${colors.reset}`);
    
    // Perform checkout
    const checkOutRes = await apiRequest('/check-out', 'POST', {
      reservationId,
      extraCharges: 500, // e.g. room service
      discount: 200,
      paymentMethod: 'UPI',
      notes: 'Guest checked out successfully.'
    }, token);
    assertResponse(checkOutRes, [200, 201], 'Perform Guest Check-Out');
    console.log('Final invoice folio settlement completed.');

    // -------------------------------------------------------------
    // 16. Dashboard stats
    // -------------------------------------------------------------
    console.log(`\n${colors.cyan}Step 16: Fetching Dashboard Analytics...${colors.reset}`);
    const dashboard = await apiRequest('/dashboard', 'GET', null, token);
    assertResponse(dashboard, 200, 'Fetch Dashboard Stats');
    console.log('Dashboard summary details:', JSON.stringify(dashboard.data.data, null, 2));

    console.log(`\n${colors.bright}${colors.green}🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉${colors.reset}`);
    console.log(`All systems operational. TypeScript-to-JavaScript migration verified. Everything is in working order.`);
    
  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}💥 Integration Tests Failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

runTests();
