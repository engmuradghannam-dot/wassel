const bcrypt = require('bcryptjs');

async function test() {
  const password = 'Wassel@2026';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const isValid = await bcrypt.compare(password, hash);

  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('Valid:', isValid);

  // Test with the old hash from MongoDB
  const oldHash = '$2b$10$aFc/TPDC7egjqzTsq.HyXu0qJFGmDc9lOTxyJwYSYnSQ2c.6FXYc6';
  const oldValid = await bcrypt.compare(password, oldHash);
  console.log('Old hash valid:', oldValid);
}

test();
