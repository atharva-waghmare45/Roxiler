const http = require('http');
const app = require('../app');
const { query, pool } = require('../db');

const PORT = 5001;
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
  console.log('RUNNING AUTHENTICATION FUNCTIONALITY TESTS');
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
  const testEmail = `auth_test_${suffix}@roxiler.com`;
  const validName = 'Johnathan Doe Smithsonians'; // 26 chars
  const invalidShortName = 'John Doe';
  const validAddress = '123 Test Street, Bangalore';
  const validPassword = 'SecurePassword1!';
  const invalidNoSpecialPassword = 'Password123';
  const invalidShortPassword = 'Pass1!';

  try {
    // Signup validations
    const signupShortNameRes = await makeRequest('/api/auth/signup', 'POST', {
      name: invalidShortName, email: testEmail, address: validAddress, password: validPassword
    });
    assert('Signup fails if name is less than 20 characters', signupShortNameRes.status === 400);

    const signupInvalidPasswordRes = await makeRequest('/api/auth/signup', 'POST', {
      name: validName, email: testEmail, address: validAddress, password: invalidNoSpecialPassword
    });
    assert('Signup fails if password misses special character', signupInvalidPasswordRes.status === 400);

    const signupShortPasswordRes = await makeRequest('/api/auth/signup', 'POST', {
      name: validName, email: testEmail, address: validAddress, password: invalidShortPassword
    });
    assert('Signup fails if password is less than 8 characters', signupShortPasswordRes.status === 400);

    // Signup success
    const signupSuccessRes = await makeRequest('/api/auth/signup', 'POST', {
      name: validName, email: testEmail, address: validAddress, password: validPassword
    });
    assert('Signup succeeds with valid user details', signupSuccessRes.status === 201);

    // Duplicate email
    const signupDupEmailRes = await makeRequest('/api/auth/signup', 'POST', {
      name: validName, email: testEmail, address: validAddress, password: validPassword
    });
    assert('Signup fails if email is already registered', signupDupEmailRes.status === 400);

    // Login incorrect
    const loginFailRes = await makeRequest('/api/auth/login', 'POST', {
      email: testEmail, password: 'WrongPassword!'
    });
    assert('Login fails with incorrect credentials', loginFailRes.status === 401);

    // Login correct
    const loginSuccessRes = await makeRequest('/api/auth/login', 'POST', {
      email: testEmail, password: validPassword
    });
    assert('Login succeeds with correct credentials', loginSuccessRes.status === 200 && loginSuccessRes.body.token !== undefined);

    const token = loginSuccessRes.body.token;

    // Change password validations
    const changePasswordInvalidRes = await makeRequest('/api/auth/change-password', 'POST', {
      oldPassword: validPassword, newPassword: 'short'
    }, token);
    assert('Password update fails if new password does not match constraints', changePasswordInvalidRes.status === 400);

    // Change password success
    const changePasswordSuccessRes = await makeRequest('/api/auth/change-password', 'POST', {
      oldPassword: validPassword, newPassword: 'NewPassword123!'
    }, token);
    assert('Password update succeeds with correct inputs', changePasswordSuccessRes.status === 200);

    // Login with new password
    const loginNewPassRes = await makeRequest('/api/auth/login', 'POST', {
      email: testEmail, password: 'NewPassword123!'
    });
    assert('Login succeeds using the newly set password', loginNewPassRes.status === 200);

  } catch (error) {
    console.error('Auth test error:', error);
  } finally {
    try {
      await query('DELETE FROM users WHERE email = $1', [testEmail]);
      console.log(`\nCleanup: Removed test user ${testEmail}`);
    } catch (cleanupErr) {
      console.error('Error cleaning up auth test user:', cleanupErr);
    }
    server.close();
    await pool.end();
    console.log('\n========================================');
    console.log(`AUTH TEST COMPLETED | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
