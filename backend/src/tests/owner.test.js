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
  const testNormalEmailA = `owner_normal_a_${suffix}@roxiler.com`;
  const testNormalEmailZ = `owner_normal_z_${suffix}@roxiler.com`;
  const storeNameA = `A Roxiler Owner Store ${suffix}`;
  const storeNameZ = `Z Roxiler Owner Store ${suffix}`;

  let adminToken;
  let ownerId;
  let ownerToken;
  let storeIdA;
  let storeIdZ;
  let normalTokenA;
  let normalTokenZ;

  try {
    // 1. Log in as System Admin to create store owner and stores
    const adminLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@roxiler.com',
      password: 'AdminPassword123!'
    });
    adminToken = adminLoginRes.body.token;

    const createOwnerRes = await makeRequest('/api/admin/users', 'POST', {
      name: 'Store Owner Dashboard User',
      email: testOwnerEmail,
      address: 'Owner Shop Plaza, Bangalore',
      password: 'OwnerPass123!',
      role: 'STORE_OWNER'
    }, adminToken);
    ownerId = createOwnerRes.body.user.id;

    // Register Store A
    const createStoreARes = await makeRequest('/api/admin/stores', 'POST', {
      name: storeNameA,
      email: `ownerstore_a_${suffix}@roxiler.com`,
      address: 'Store Street A, Bangalore',
      ownerId: ownerId
    }, adminToken);
    storeIdA = createStoreARes.body.store.id;

    // Register Store Z
    const createStoreZRes = await makeRequest('/api/admin/stores', 'POST', {
      name: storeNameZ,
      email: `ownerstore_z_${suffix}@roxiler.com`,
      address: 'Store Street Z, Bangalore',
      ownerId: ownerId
    }, adminToken);
    storeIdZ = createStoreZRes.body.store.id;

    // Log in as the Store Owner
    const ownerLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: testOwnerEmail,
      password: 'OwnerPass123!'
    });
    ownerToken = ownerLoginRes.body.token;

    // 2. Register Normal User A and Normal User Z
    await makeRequest('/api/auth/signup', 'POST', {
      name: 'Normal Reviewer A User Account', // 30 chars
      email: testNormalEmailA,
      address: 'Reviewer Street A, Bangalore',
      password: 'ReviewerPass123!'
    });

    const userLoginARes = await makeRequest('/api/auth/login', 'POST', {
      email: testNormalEmailA,
      password: 'ReviewerPass123!'
    });
    normalTokenA = userLoginARes.body.token;

    await makeRequest('/api/auth/signup', 'POST', {
      name: 'Normal Reviewer Z User Account', // 30 chars
      email: testNormalEmailZ,
      address: 'Reviewer Street Z, Bangalore',
      password: 'ReviewerPass123!'
    });

    const userLoginZRes = await makeRequest('/api/auth/login', 'POST', {
      email: testNormalEmailZ,
      password: 'ReviewerPass123!'
    });
    normalTokenZ = userLoginZRes.body.token;

    // 3. User A leaves a rating of 4 for Store A, User Z leaves a rating of 2 for Store Z
    await makeRequest('/api/user/ratings', 'POST', {
      storeId: storeIdA,
      value: 4
    }, normalTokenA);

    await makeRequest('/api/user/ratings', 'POST', {
      storeId: storeIdZ,
      value: 2
    }, normalTokenZ);

    // 4. Query Store Owner Dashboard with default sorting
    const dashboardRes = await makeRequest('/api/owner/dashboard', 'GET', null, ownerToken);
    assert('Store Owner can view their dashboard successfully', dashboardRes.status === 200);

    const storeAData = dashboardRes.body.stores.find(s => s.id === storeIdA);
    assert('Dashboard returns store A details with average rating = 4',
      storeAData && storeAData.name === storeNameA && storeAData.averageRating === 4 && storeAData.totalRatings === 1
    );

    // 5. Query dashboard with storesSortBy=name and storesSortOrder=desc
    const dashboardDescStoresRes = await makeRequest('/api/owner/dashboard?storesSortBy=name&storesSortOrder=desc', 'GET', null, ownerToken);
    const firstStoreName = dashboardDescStoresRes.body.stores[0].name;
    assert('Dashboard supports sorting stores table in descending order (Z first)', firstStoreName === storeNameZ);

    // 6. Query dashboard with reviewsSortBy=ratingValue and reviewsSortOrder=asc (lowest rating first)
    const dashboardAscReviewsRes = await makeRequest('/api/owner/dashboard?reviewsSortBy=ratingValue&reviewsSortOrder=asc', 'GET', null, ownerToken);
    const firstReviewRating = dashboardAscReviewsRes.body.reviews[0].ratingValue;
    assert('Dashboard supports sorting reviews table by ratingValue ASC (2 first)', firstReviewRating === 2);

    // 7. Verify Admin Store Search by email column
    const adminStoreSearchRes = await makeRequest(`/api/admin/stores?search=ownerstore_z_${suffix}@roxiler.com`, 'GET', null, adminToken);
    assert('Admin can search stores listing by store email address',
      adminStoreSearchRes.status === 200 && adminStoreSearchRes.body.some(s => s.email === `ownerstore_z_${suffix}@roxiler.com`)
    );

    // 8. Access control check: Normal User cannot access Owner Dashboard
    const normalAccessRes = await makeRequest('/api/owner/dashboard', 'GET', null, normalTokenA);
    assert('Normal user access to owner dashboard is forbidden (403)', normalAccessRes.status === 403);

  } catch (error) {
    console.error('Owner test error:', error);
  } finally {
    // Cleanup users
    try {
      await query("DELETE FROM users WHERE email LIKE $1 OR email = $2 OR email = $3", [`%_${suffix}@roxiler.com`, testOwnerEmail, `ownerstore_a_${suffix}@roxiler.com`]);
      console.log(`\nCleanup: Removed test users/stores matching suffix ${suffix}`);
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
