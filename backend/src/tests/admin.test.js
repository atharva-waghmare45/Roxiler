const http = require('http');
const app = require('../app');
const { query, pool } = require('../db');

const PORT = 5002;
let server;

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
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

const runTests = async () => {
  console.log('\n========================================');
  console.log('RUNNING ADMINISTRATOR PANEL TESTS');
  console.log('========================================\n');

  server = app.listen(PORT);
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

  const suffix = Date.now();
  const testOwnerEmail = `admin_owner_${suffix}@roxiler.com`;
  let testOwnerId;

  try {
    // Log in as system admin
    const adminLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@roxiler.com',
      password: 'AdminPassword123!'
    });
    assert('Admin login succeeds with default credentials', adminLoginRes.status === 200 && adminLoginRes.body.token !== undefined);

    const adminToken = adminLoginRes.body.token;

    // Admin creates a STORE_OWNER user
    const adminCreateOwnerRes = await makeRequest('/api/admin/users', 'POST', {
      name: 'Store Owner Account User', // 25 chars
      email: testOwnerEmail,
      address: 'Owner Address 123, Market Street, Bangalore',
      password: 'OwnerPass123!',
      role: 'STORE_OWNER'
    }, adminToken);
    assert('Admin can create a STORE_OWNER user', adminCreateOwnerRes.status === 201);

    if (adminCreateOwnerRes.status === 201) {
      testOwnerId = adminCreateOwnerRes.body.user.id;
    }

    // Admin creates a store linked to the STORE_OWNER
    const adminCreateStoreRes = await makeRequest('/api/admin/stores', 'POST', {
      name: 'Roxiler Super Store',
      email: `store_${suffix}@roxiler.com`,
      address: 'Store Plaza, Lane 5, Bangalore',
      ownerId: testOwnerId
    }, adminToken);
    assert('Admin can register a store linked to the STORE_OWNER', adminCreateStoreRes.status === 201);

    // Admin creates a store with invalid owner ID (expects failure)
    const adminCreateStoreFailRes = await makeRequest('/api/admin/stores', 'POST', {
      name: 'Invalid Owner Store',
      email: `failstore_${suffix}@roxiler.com`,
      address: '123 Fake Street',
      ownerId: 99999
    }, adminToken);
    assert('Admin fails to register a store with non-existent owner ID', adminCreateStoreFailRes.status === 400);

    // Query dashboard counts
    const adminDashboardRes = await makeRequest('/api/admin/dashboard', 'GET', null, adminToken);
    assert('Admin dashboard returns stats object with correct properties', adminDashboardRes.status === 200 && adminDashboardRes.body.totalUsers !== undefined);

    // Query stores listing
    const adminStoresListRes = await makeRequest('/api/admin/stores', 'GET', null, adminToken);
    assert('Admin stores list returns stores and contains registered store', adminStoresListRes.status === 200 && adminStoresListRes.body.some(s => s.name === 'Roxiler Super Store'));

    // Query users listing
    const adminUsersListRes = await makeRequest('/api/admin/users?role=STORE_OWNER', 'GET', null, adminToken);
    assert('Admin users list returns users and includes rating info', adminUsersListRes.status === 200 && adminUsersListRes.body.some(u => u.email === testOwnerEmail && u.rating !== undefined));

  } catch (error) {
    console.error('Admin test error:', error);
  } finally {
    try {
      await query('DELETE FROM users WHERE email = $1', [testOwnerEmail]);
      console.log(`\nCleanup: Removed test owner user ${testOwnerEmail}`);
    } catch (cleanupErr) {
      console.error('Error cleaning up admin test user:', cleanupErr);
    }
    server.close();
    await pool.end();
    console.log('\n========================================');
    console.log(`ADMIN TEST COMPLETED | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
