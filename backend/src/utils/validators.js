/**
 * Validates email format against standard regex rules.
 * @param {string} email 
 * @returns {boolean}
 */
const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validates password criteria:
 * - 8 to 16 characters.
 * - At least one uppercase letter.
 * - At least one special character.
 * @param {string} password 
 * @returns {boolean}
 */
const validatePassword = (password) => {
  if (!password || password.length < 8 || password.length > 16) {
    return false;
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUppercase && hasSpecial;
};

module.exports = {
  validateEmail,
  validatePassword
};
