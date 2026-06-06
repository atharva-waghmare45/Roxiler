const http = require('http');
const app = require('../app');
const { query, pool } = require('../db');

const PORT = 5004;
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
  console.log('RUNNING STORE OWNER DASHBOARD TESTS');
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
  const testOwnerEmail = `owner_user_${suffix}@roxiler.com`;
  const testNormalEmail = `owner_normal_${suffix}@roxiler.com`;
  const storeName = `Roxiler Owner Store ${suffix}`;

  let adminToken;
  let ownerId;
  let ownerToken;
  let storeId;
  let normalToken;

  try {
    // 1. Log in as System Admin to create store owner and store
    const adminLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@roxiler.com',
      password: 'AdminPassword123!'
    });
    adminToken = adminLoginRes.body.token;

    const createOwnerRes = await makeRequest('/api/admin/users', 'POST', {
      name: 'Store Owner Dashboard User', // 28 chars
      email: testOwnerEmail,
      address: 'Owner Shop Plaza, Bangalore',
      password: 'OwnerPass123!',
      role: 'STORE_OWNER'
    }, adminToken);
    ownerId = createOwnerRes.body.user.id;

    const createStoreRes = await makeRequest('/api/admin/stores', 'POST', {
      name: storeName,
      email: `ownerstore_${suffix}@roxiler.com`,
      address: 'Store Street, Bangalore',
      ownerId: ownerId
    }, adminToken);
    storeId = createStoreRes.body.store.id;

    // Log in as the Store Owner
    const ownerLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: testOwnerEmail,
      password: 'OwnerPass123!'
    });
    ownerToken = ownerLoginRes.body.token;

    // 2. Register a Normal User to leave a rating
    await makeRequest('/api/auth/signup', 'POST', {
      name: 'Normal Reviewer User Account', // 29 chars
      email: testNormalEmail,
      address: 'Reviewer Street 789, Bangalore',
      password: 'ReviewerPass123!'
    });

    const userLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: testNormalEmail,
      password: 'ReviewerPass123!'
    });
    normalToken = userLoginRes.body.token;

    // 3. Normal User leaves a rating of 4 for the store
    await makeRequest('/api/user/ratings', 'POST', {
      storeId: storeId,
      value: 4
    }, normalToken);

    // 4. Query Store Owner Dashboard
    const dashboardRes = await makeRequest('/api/owner/dashboard', 'GET', null, ownerToken);
    
    // Asserts
    const storeData = dashboardRes.body.stores.find(s => s.id === storeId);
    const reviewData = dashboardRes.body.reviews.find(r => r.userEmail === testNormalEmail);

    assert('Store Owner can view their dashboard successfully', dashboardRes.status === 200);
    assert('Dashboard returns the owned store details with average rating = 4',
      storeData && storeData.name === storeName && storeData.averageRating === 4 && storeData.totalRatings === 1
    );
    assert('Dashboard returns the reviews list containing the customer review name and rating',
      reviewData && reviewData.ratingValue === 4 && reviewData.userName === 'Normal Reviewer User Account' && reviewData.storeName === storeName
    );

    // 5. Access control check: Normal User cannot access Owner Dashboard
    const normalAccessRes = await makeRequest('/api/owner/dashboard', 'GET', null, normalToken);
    assert('Normal user access to owner dashboard is forbidden (403)', normalAccessRes.status === 403);

  } catch (error) {
    console.error('Owner test error:', error);
  } finally {
    // Cleanup users
    try {
      await query('DELETE FROM users WHERE email IN ($1, $2)', [testOwnerEmail, testNormalEmail]);
      console.log(`\nCleanup: Removed test users ${testOwnerEmail} and ${testNormalEmail}`);
    } catch (cleanupErr) {
      console.error('Error cleaning up owner test users:', cleanupErr);
    }
    server.close();
    await pool.end();
    console.log('\n========================================');
    console.log(`OWNER TEST COMPLETED | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
