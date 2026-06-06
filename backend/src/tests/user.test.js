const http = require('http');
const app = require('../app');
const { query, pool } = require('../db');

const PORT = 5003;
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
  console.log('RUNNING NORMAL USER RATINGS TESTS');
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
  const testOwnerEmail = `user_owner_${suffix}@roxiler.com`;
  const testNormalEmail = `user_normal_${suffix}@roxiler.com`;
  const storeName = `Roxiler Test Store ${suffix}`;
  
  let adminToken;
  let ownerId;
  let storeId;
  let normalToken;

  try {
    // 1. Log in as System Admin to set up store owner and store
    const adminLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@roxiler.com',
      password: 'AdminPassword123!'
    });
    adminToken = adminLoginRes.body.token;

    const createOwnerRes = await makeRequest('/api/admin/users', 'POST', {
      name: 'Test Store Owner User Account', // 30 chars
      email: testOwnerEmail,
      address: 'Owner Address Plaza, Bangalore',
      password: 'OwnerPass123!',
      role: 'STORE_OWNER'
    }, adminToken);
    ownerId = createOwnerRes.body.user.id;

    const createStoreRes = await makeRequest('/api/admin/stores', 'POST', {
      name: storeName,
      email: `store_${suffix}@roxiler.com`,
      address: 'Test Street, Bangalore',
      ownerId: ownerId
    }, adminToken);
    storeId = createStoreRes.body.store.id;

    // 2. Register Normal User and Log In
    await makeRequest('/api/auth/signup', 'POST', {
      name: 'Normal Test User Account', // 25 chars
      email: testNormalEmail,
      address: 'User Address 123, Bangalore',
      password: 'UserPassword123!'
    });

    const userLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: testNormalEmail,
      password: 'UserPassword123!'
    });
    normalToken = userLoginRes.body.token;

    // 3. User lists stores (Initial State check)
    const storeListRes = await makeRequest('/api/user/stores', 'GET', null, normalToken);
    const targetStore = storeListRes.body.find(s => s.id === storeId);
    assert('Normal user can list stores, average rating is 0, and userRating is null',
      storeListRes.status === 200 && targetStore && targetStore.rating === 0 && targetStore.userRating === null,
      `Status: ${storeListRes.status}, Store: ${JSON.stringify(targetStore)}`
    );

    // 4. User submits rating of 4
    const ratingSubmitRes = await makeRequest('/api/user/ratings', 'POST', {
      storeId: storeId,
      value: 4
    }, normalToken);
    assert('Normal user can submit a rating of 4 for a store',
      ratingSubmitRes.status === 200 && ratingSubmitRes.body.rating.value === 4,
      `Status: ${ratingSubmitRes.status}, Body: ${JSON.stringify(ratingSubmitRes.body)}`
    );

    // 5. Verify average rating and userRating update
    const storeListAfterRatingRes = await makeRequest('/api/user/stores', 'GET', null, normalToken);
    const targetStoreAfter = storeListAfterRatingRes.body.find(s => s.id === storeId);
    assert('Store average rating and user rating reflect the rating submission',
      targetStoreAfter && targetStoreAfter.rating === 4 && targetStoreAfter.userRating === 4
    );

    // 6. User updates rating to 5
    const ratingUpdateRes = await makeRequest('/api/user/ratings', 'POST', {
      storeId: storeId,
      value: 5
    }, normalToken);
    assert('Normal user can modify their submitted rating to 5',
      ratingUpdateRes.status === 200 && ratingUpdateRes.body.rating.value === 5
    );

    // 7. Verify average rating and userRating update to 5
    const storeListAfterUpdateRes = await makeRequest('/api/user/stores', 'GET', null, normalToken);
    const targetStoreAfterUpdate = storeListAfterUpdateRes.body.find(s => s.id === storeId);
    assert('Store average rating and user rating reflect the rating modification',
      targetStoreAfterUpdate && targetStoreAfterUpdate.rating === 5 && targetStoreAfterUpdate.userRating === 5
    );

    // 8. Validate invalid rating values (e.g. 6 and negative)
    const ratingInvalidRes = await makeRequest('/api/user/ratings', 'POST', {
      storeId: storeId,
      value: 6
    }, normalToken);
    assert('Rating submission fails if value is out of 1-5 bounds (e.g. 6)', ratingInvalidRes.status === 400);

    const ratingNegativeRes = await makeRequest('/api/user/ratings', 'POST', {
      storeId: storeId,
      value: -1
    }, normalToken);
    assert('Rating submission fails if value is negative', ratingNegativeRes.status === 400);

    // 9. Validate non-existent store ID
    const ratingNoStoreRes = await makeRequest('/api/user/ratings', 'POST', {
      storeId: 99999,
      value: 3
    }, normalToken);
    assert('Rating submission fails if store ID does not exist', ratingNoStoreRes.status === 404);

    // 10. Access control check (Admin cannot access user stores list)
    const adminUserAccessRes = await makeRequest('/api/user/stores', 'GET', null, adminToken);
    assert('Access to user endpoints is forbidden for other roles (e.g. Admin)', adminUserAccessRes.status === 403);

  } catch (error) {
    console.error('User test error:', error);
  } finally {
    // Cleanup users
    try {
      await query('DELETE FROM users WHERE email IN ($1, $2)', [testOwnerEmail, testNormalEmail]);
      console.log(`\nCleanup: Removed test users ${testOwnerEmail} and ${testNormalEmail}`);
    } catch (cleanupErr) {
      console.error('Error cleaning up user test users:', cleanupErr);
    }
    server.close();
    await pool.end();
    console.log('\n========================================');
    console.log(`USER TEST COMPLETED | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
