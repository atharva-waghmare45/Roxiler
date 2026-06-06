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

  } catch (error) {
    console.error('Test execution failed with error:', error);
  } finally {
    // Cleanup the seeded test user from PostgreSQL to leave database clean
    try {
      await query('DELETE FROM users WHERE email = $1', [testEmail]);
      console.log(`\nCleanup: Removed test user ${testEmail} successfully.`);
    } catch (cleanupErr) {
      console.error('Error cleaning up test user:', cleanupErr);
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
