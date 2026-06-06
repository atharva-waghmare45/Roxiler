const { validateEmail, validatePassword } = require('../utils/validators');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken, verifyToken } = require('../utils/jwt');

const runUtilsTests = async () => {
  console.log('\n========================================');
  console.log('STARTING UTILITY UNIT TESTS...');
  console.log('========================================\n');

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

  // -----------------------------------------------------------------
  // 1. EMAIL VALIDATOR TESTS
  // -----------------------------------------------------------------
  
  // Valid cases
  assert('Email: "test@example.com" should be valid', validateEmail('test@example.com') === true);
  assert('Email: "user.name+tag@sub.domain.co" should be valid', validateEmail('user.name+tag@sub.domain.co') === true);
  
  // Invalid cases
  assert('Email: "plain_text" should be invalid', validateEmail('plain_text') === false);
  assert('Email: "name@" should be invalid', validateEmail('name@') === false);
  assert('Email: "@domain.com" should be invalid', validateEmail('@domain.com') === false);
  assert('Email: "name@domain" should be invalid', validateEmail('name@domain') === false);
  assert('Email: empty string should be invalid', validateEmail('') === false);
  assert('Email: null should be invalid', validateEmail(null) === false);
  assert('Email: undefined should be invalid', validateEmail(undefined) === false);

  // -----------------------------------------------------------------
  // 2. PASSWORD VALIDATOR TESTS
  // -----------------------------------------------------------------
  
  // Valid cases (8-16 chars, 1 uppercase, 1 special)
  assert('Password: "Pass123!" (1 uppercase, 1 special, 8 chars) should be valid', validatePassword('Pass123!') === true);
  assert('Password: "A_very_Secur3!" (1 uppercase, 3 special, 14 chars) should be valid', validatePassword('A_very_Secur3!') === true);

  // Invalid cases
  assert('Password: "Pass1!" (too short: 6 chars) should be invalid', validatePassword('Pass1!') === false);
  assert('Password: "A_very_very_long_password123!" (too long: 29 chars) should be invalid', validatePassword('A_very_very_long_password123!') === false);
  assert('Password: "password1!" (no uppercase) should be invalid', validatePassword('password1!') === false);
  assert('Password: "Password123" (no special char) should be invalid', validatePassword('Password123') === false);
  assert('Password: empty string should be invalid', validatePassword('') === false);
  assert('Password: null should be invalid', validatePassword(null) === false);

  // -----------------------------------------------------------------
  // 3. HASHING UTILITY TESTS
  // -----------------------------------------------------------------
  try {
    const plainText = 'MySecretPassword123!';
    const hash = await hashPassword(plainText);
    assert('Hashing: should generate a valid hash string', typeof hash === 'string' && hash.length > 0);
    
    const isMatch = await comparePassword(plainText, hash);
    assert('Hashing: correct password comparison should be true', isMatch === true);
    
    const isMismatch = await comparePassword('wrong_password', hash);
    assert('Hashing: incorrect password comparison should be false', isMismatch === false);
  } catch (err) {
    assert('Hashing: should run without throwing errors', false, err.message);
  }

  // -----------------------------------------------------------------
  // 4. JWT UTILITY TESTS
  // -----------------------------------------------------------------
  try {
    const payload = { id: 42, role: 'NORMAL_USER' };
    const token = generateToken(payload);
    assert('JWT: should generate a non-empty token string', typeof token === 'string' && token.length > 0);
    
    const decoded = verifyToken(token);
    assert('JWT: decoded payload should match original data (id)', decoded.id === payload.id);
    assert('JWT: decoded payload should match original data (role)', decoded.role === payload.role);
    
    let threw = false;
    try {
      verifyToken(token + 'modified');
    } catch (err) {
      threw = true;
    }
    assert('JWT: verifying modified/invalid token should throw', threw === true);
  } catch (err) {
    assert('JWT: should run without throwing errors', false, err.message);
  }

  console.log('\n========================================');
  console.log('UTILITY RUN COMPLETED');
  console.log(`PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
};

runUtilsTests();
