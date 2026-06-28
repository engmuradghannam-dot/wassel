const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Admin@2026';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  console.log('=== Password Hash Generated ===');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('');
  console.log('=== Verification Test ===');
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash is valid:', isValid);

  // Also test the old hash
  const oldHash = '$2b$10$aFc/TPDC7egjqzTsq.HyXu0qJFGmDc9lOTxyJwYSYnSQ2c.6FXYc6';
  const oldValid = await bcrypt.compare(password, oldHash);
  console.log('Old hash is valid:', oldValid);
}

generateHash();
