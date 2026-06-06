
const http = require('http');
const app = require('../app');
const { query } = require('../db');

const PORT = 5001;
let server;

// Helper to make HTTP request to the test server
const makeRequest = (path, method, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n========================================');
  console.log('STARTING BACKEND FUNCTIONALITY CHECKS...');
  console.log('========================================\n');

  // Start the server on port 5001
  server = app.listen(PORT);

  // Keep track of test success count
  let passed = 0;
  let failed = 0;

  const assert = (name, condition, details = '') => {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details ? `- ${details}` : ''}`);
      failed++;
    }
  };

  // Setup dynamic emails to avoid duplicate constraint failures across test runs
  const suffix = Date.now();
  const testEmail = `testuser_${suffix}@roxiler.com`;

  // Valid test inputs matching challenge constraints:
  // Name must be min 20, max 60 chars.
  const validName = 'Johnathan Doe Smithsonians'; // 26 chars
  const invalidShortName = 'John Doe'; // 8 chars (too short)
  const validAddress = '123 Test Street, Developer Lane, Bangalore, India';
  // Password: 8-16 chars, at least one uppercase, one special char
  const validPassword = 'SecurePassword1!';
  const invalidNoSpecialPassword = 'Password123';
  const invalidNoUpperPassword = 'password123!';
  const invalidShortPassword = 'Pass1!';

  try {
    // -----------------------------------------------------------------
    // TEST 1: Signup Validation Checks (Name limit constraints)
    // -----------------------------------------------------------------
    const signupShortNameRes = await makeRequest('/api/auth/signup', 'POST', {
      name: invalidShortName,
      email: testEmail,
      address: validAddress,
      password: validPassword
    });
    assert(
      'Signup fails if name is less than 20 characters',
      signupShortNameRes.status === 400 && signupShortNameRes.body.message.includes('Name'),
      `Status: ${signupShortNameRes.status}, Msg: ${JSON.stringify(signupShortNameRes.body)}`
    );

    // -----------------------------------------------------------------
    // TEST 2: Signup Validation Checks (Password constraints)
    // -----------------------------------------------------------------
    const signupInvalidPasswordRes = await makeRequest('/api/auth/signup', 'POST', {
      name: validName,
      email: testEmail,
      address: validAddress,
      password: invalidNoSpecialPassword
    });
    assert(
      'Signup fails if password misses special character',
      signupInvalidPasswordRes.status === 400 && signupInvalidPasswordRes.body.message.includes('Password'),
      `Status: ${signupInvalidPasswordRes.status}, Msg: ${JSON.stringify(signupInvalidPasswordRes.body)}`
    );

    const signupShortPasswordRes = await makeRequest('/api/auth/signup', 'POST', {
      name: validName,
      email: testEmail,
      address: validAddress,
      password: invalidShortPassword
    });
    assert(
      'Signup fails if password is less than 8 characters',
      signupShortPasswordRes.status === 400 && signupShortPasswordRes.body.message.includes('Password'),
      `Status: ${signupShortPasswordRes.status}, Msg: ${JSON.stringify(signupShortPasswordRes.body)}`
    );

    // -----------------------------------------------------------------
    // TEST 3: Successful Signup (NORMAL_USER)
    // -----------------------------------------------------------------
    const signupSuccessRes = await makeRequest('/api/auth/signup', 'POST', {
      name: validName,
      email: testEmail,
      address: validAddress,
      password: validPassword
    });
    assert(
      'Signup succeeds with valid user details',
      signupSuccessRes.status === 201,
      `Status: ${signupSuccessRes.status}, Msg: ${JSON.stringify(signupSuccessRes.body)}`
    );

    // -----------------------------------------------------------------
    // TEST 4: Signup duplicate email check
    // -----------------------------------------------------------------
    const signupDupEmailRes = await makeRequest('/api/auth/signup', 'POST', {
      name: validName,
      email: testEmail,
      address: validAddress,
      password: validPassword
    });
    assert(
      'Signup fails if email is already registered',
      signupDupEmailRes.status === 400 && signupDupEmailRes.body.message.includes('exists'),
      `Status: ${signupDupEmailRes.status}, Msg: ${JSON.stringify(signupDupEmailRes.body)}`
    );

    // -----------------------------------------------------------------
    // TEST 5: Login verification
    // -----------------------------------------------------------------
    const loginFailRes = await makeRequest('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'WrongPassword!'
    });
    assert(
      'Login fails with incorrect credentials',
      loginFailRes.status === 401,
      `Status: ${loginFailRes.status}`
    );

    const loginSuccessRes = await makeRequest('/api/auth/login', 'POST', {
      email: testEmail,
      password: validPassword
    });
    assert(
      'Login succeeds with correct credentials',
      loginSuccessRes.status === 200 && loginSuccessRes.body.token !== undefined,
      `Status: ${loginSuccessRes.status}`
    );

    const token = loginSuccessRes.body.token;

    // -----------------------------------------------------------------
    // TEST 6: Change Password flow
    // -----------------------------------------------------------------
    const changePasswordInvalidRes = await makeRequest('/api/auth/change-password', 'POST', {
      oldPassword: validPassword,
      newPassword: 'short'
    }, token);
    assert(
      'Password update fails if new password does not match constraints',
      changePasswordInvalidRes.status === 400 && changePasswordInvalidRes.body.message.toLowerCase().includes('password'),
      `Status: ${changePasswordInvalidRes.status}`
    );

    const changePasswordSuccessRes = await makeRequest('/api/auth/change-password', 'POST', {
      oldPassword: validPassword,
      newPassword: 'NewPassword123!'
    }, token);
    assert(
      'Password update succeeds with correct inputs',
      changePasswordSuccessRes.status === 200,
      `Status: ${changePasswordSuccessRes.status}`
    );

    // Verify login with new password
    const loginNewPassRes = await makeRequest('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'NewPassword123!'
    });
    assert(
      'Login succeeds using the newly set password',
      loginNewPassRes.status === 200,
      `Status: ${loginNewPassRes.status}`
    );

    // -----------------------------------------------------------------
    // ADMIN FLOW TESTS
    // -----------------------------------------------------------------

    // Log in as system admin
    const adminLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@roxiler.com',
      password: 'AdminPassword123!'
    });
    assert(
      'Admin login succeeds with default credentials',
      adminLoginRes.status === 200 && adminLoginRes.body.token !== undefined,
      `Status: ${adminLoginRes.status}`
    );

    const adminToken = adminLoginRes.body.token;
    const testOwnerEmail = `owner_${suffix}@roxiler.com`;
    let testOwnerId;

    // Admin creates a STORE_OWNER user
    const adminCreateOwnerRes = await makeRequest('/api/admin/users', 'POST', {
      name: 'Store Owner Account User', // 25 chars
      email: testOwnerEmail,
      address: 'Owner Address 123, Market Street, Bangalore',
      password: 'OwnerPass123!',
      role: 'STORE_OWNER'
    }, adminToken);
    assert(
      'Admin can create a STORE_OWNER user',
      adminCreateOwnerRes.status === 201 && adminCreateOwnerRes.body.user.role === 'STORE_OWNER',
      `Status: ${adminCreateOwnerRes.status}, Msg: ${JSON.stringify(adminCreateOwnerRes.body)}`
    );

    testOwnerId = adminCreateOwnerRes.body.user.id;

    // Admin creates a store linked to the STORE_OWNER
    const adminCreateStoreRes = await makeRequest('/api/admin/stores', 'POST', {
      name: 'Roxiler Super Store',
      email: `store_${suffix}@roxiler.com`,
      address: 'Store Plaza, Lane 5, Bangalore',
      ownerId: testOwnerId
    }, adminToken);
    assert(
      'Admin can register a store linked to the STORE_OWNER',
      adminCreateStoreRes.status === 201 && adminCreateStoreRes.body.store.owner_id === testOwnerId,
      `Status: ${adminCreateStoreRes.status}`
    );

    // Admin creates a store with invalid owner ID (expects failure)
    const adminCreateStoreFailRes = await makeRequest('/api/admin/stores', 'POST', {
      name: 'Invalid Owner Store',
      email: `failstore_${suffix}@roxiler.com`,
      address: '123 Fake Street',
      ownerId: 99999 // Non-existent owner
    }, adminToken);
    assert(
      'Admin fails to register a store with non-existent owner ID',
      adminCreateStoreFailRes.status === 400,
      `Status: ${adminCreateStoreFailRes.status}`
    );

    // Query dashboard counts
    const adminDashboardRes = await makeRequest('/api/admin/dashboard', 'GET', null, adminToken);
    assert(
      'Admin dashboard returns stats object with non-zero counts',
      adminDashboardRes.status === 200 && adminDashboardRes.body.totalUsers >= 2 && adminDashboardRes.body.totalStores >= 1,
      `Status: ${adminDashboardRes.status}, Body: ${JSON.stringify(adminDashboardRes.body)}`
    );

    // Query stores listing
    const adminStoresListRes = await makeRequest('/api/admin/stores', 'GET', null, adminToken);
    assert(
      'Admin stores list returns stores and contains registered store',
      adminStoresListRes.status === 200 && adminStoresListRes.body.some(s => s.name === 'Roxiler Super Store'),
      `Status: ${adminStoresListRes.status}`
    );

    // Query users listing with search
    const adminUsersListRes = await makeRequest('/api/admin/users?role=STORE_OWNER', 'GET', null, adminToken);
    assert(
      'Admin users list returns users with STORE_OWNER role and includes rating info',
      adminUsersListRes.status === 200 && adminUsersListRes.body.some(u => u.email === testOwnerEmail && u.rating !== undefined),
      `Status: ${adminUsersListRes.status}, Body: ${JSON.stringify(adminUsersListRes.body)}`
    );

  } catch (error) {
    console.error('Test execution failed with error:', error);
  } finally {
    // Cleanup the seeded test users (deleting owners cascades and cleans up stores/ratings)
    try {
      const testOwnerEmail = `owner_${suffix}@roxiler.com`;
      await query('DELETE FROM users WHERE email IN ($1, $2)', [testEmail, testOwnerEmail]);
      console.log(`\nCleanup: Removed test users ${testEmail} and ${testOwnerEmail} successfully.`);
    } catch (cleanupErr) {
      console.error('Error cleaning up test users:', cleanupErr);
    }

    // Stop Express test server
    server.close();

    console.log('\n========================================');
    console.log('FUNCTIONALITY CHECK RUN COMPLETED');
    console.log(`PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
