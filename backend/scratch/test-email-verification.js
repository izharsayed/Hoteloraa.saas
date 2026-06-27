"use strict";

const { createTenant } = require('../src/modules/superadmin/superadmin.service');
const { forgotPassword, resetPassword, verifyEmail, login } = require('../src/modules/auth/auth.service');
const db = require('../src/config/database').default || require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function testFlow() {
  console.log('🧪 Starting Email Verification & Business Registration Email flow tests...');

  // Clean sent_emails directory before testing
  const emailDir = path.join(__dirname, '../sent_emails');
  if (fs.existsSync(emailDir)) {
    const files = fs.readdirSync(emailDir);
    for (const file of files) {
      fs.unlinkSync(path.join(emailDir, file));
    }
    console.log('🧹 Cleaned existing emails from sent_emails directory.');
  }

  const slug = `test-hotel-${Date.now()}`;
  const adminEmail = `admin@${slug}.com`;
  
  // 1. Test Business Registration Email Sending (Super Admin Flow)
  console.log('\n--- 1. Testing Super Admin Business Registration & Email details... ---');
  const tenantRes = await createTenant({
    name: 'Test Grand Resort',
    slug,
    adminEmail,
    businessType: 'HOTEL_RESTAURANT',
    plan: 'STARTER'
  });

  console.log('✅ Business Tenant Created. Generated Password:', tenantRes.generatedPassword);

  // Check that the welcome email was generated
  const filesAfterCreate = fs.readdirSync(emailDir);
  const welcomeEmailFile = filesAfterCreate.find(f => f.includes(adminEmail));
  if (!welcomeEmailFile) {
    throw new Error('❌ Welcome email was not generated in sent_emails directory!');
  }
  
  const welcomeEmailData = JSON.parse(fs.readFileSync(path.join(emailDir, welcomeEmailFile), 'utf8'));
  console.log('✅ Welcome email generated successfully.');
  console.log('   Recipient:', welcomeEmailData.to);
  console.log('   Subject:', welcomeEmailData.subject);
  
  // Extract verification token from database
  const user = await db.user.findFirst({
    where: { email: adminEmail }
  });

  if (!user) {
    throw new Error('❌ Admin user was not found in the database!');
  }

  console.log('✅ Admin User created in DB.');
  console.log('   isEmailVerified state:', user.isEmailVerified);
  console.log('   Verification Token exists:', !!user.verificationToken);

  if (user.isEmailVerified) {
    throw new Error('❌ New user should default to isEmailVerified = false!');
  }

  // 2. Test Login Blocked for Unverified User
  console.log('\n--- 2. Testing Login blocked for unverified user... ---');
  try {
    await login({
      email: adminEmail,
      password: tenantRes.generatedPassword,
      tenantSlug: slug
    });
    throw new Error('❌ Login succeeded for unverified user (should have failed)!');
  } catch (err) {
    console.log('✅ Login correctly blocked. Error message:', err.message);
    if (!err.message.includes('verify your email')) {
      throw new Error('❌ Unexpected error message: ' + err.message);
    }
  }

  // 3. Test Email Verification Activation
  console.log('\n--- 3. Testing Email Verification activation... ---');
  const verifyRes = await verifyEmail(user.verificationToken);
  console.log('✅ verifyEmail returned:', verifyRes.message);

  const userAfterVerify = await db.user.findUnique({
    where: { id: user.id }
  });

  console.log('   isEmailVerified state after verify:', userAfterVerify.isEmailVerified);
  console.log('   verificationToken state after verify:', userAfterVerify.verificationToken);

  if (!userAfterVerify.isEmailVerified || userAfterVerify.verificationToken !== null) {
    throw new Error('❌ User states not updated correctly after verification!');
  }

  // 4. Test Login Allowed for Verified User
  console.log('\n--- 4. Testing Login for verified user... ---');
  const loginRes = await login({
    email: adminEmail,
    password: tenantRes.generatedPassword,
    tenantSlug: slug
  });
  console.log('✅ Login succeeded! User Token generated:', !!loginRes.token);

  // 5. Test Password Reset Email Sending
  console.log('\n--- 5. Testing Forgot Password code email sending... ---');
  const forgotRes = await forgotPassword({ email: adminEmail });
  console.log('✅ forgotPassword response message:', forgotRes.message);

  // Find password reset email
  const filesAfterForgot = fs.readdirSync(emailDir);
  const resetEmailFile = filesAfterForgot.find(f => f.includes(adminEmail) && f !== welcomeEmailFile);
  if (!resetEmailFile) {
    throw new Error('❌ Password reset email was not generated!');
  }

  const resetEmailData = JSON.parse(fs.readFileSync(path.join(emailDir, resetEmailFile), 'utf8'));
  console.log('✅ Reset password email generated.');
  console.log('   Subject:', resetEmailData.subject);

  // Extract code from DB
  const tokenRecord = await db.passwordResetToken.findFirst({
    where: { userId: user.id }
  });

  if (!tokenRecord) {
    throw new Error('❌ Password reset token record not found in DB!');
  }

  console.log('✅ Password Reset Token in DB:', tokenRecord.token);

  // 6. Test Password Reset Code execution
  console.log('\n--- 6. Testing password reset completion... ---');
  const resetRes = await resetPassword({
    token: tokenRecord.token,
    newPassword: 'newPassword123',
    confirmPassword: 'newPassword123'
  });
  console.log('✅ resetPassword returned:', resetRes.message);

  // Verify login with new password
  const newLoginRes = await login({
    email: adminEmail,
    password: 'newPassword123',
    tenantSlug: slug
  });
  console.log('✅ Login with new password succeeded!');

  // Cleanup test data
  console.log('\n🧹 Cleaning up test database records...');
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await db.user.delete({ where: { id: user.id } });
  await db.tenant.delete({ where: { id: tenantRes.tenant.id } });
  console.log('🎉 All tests completed successfully!');
}

testFlow().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
