const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Direct registration endpoint - no auth required
// WARNING: Remove this after first use in production!
router.post('/setup-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      // Update password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.isActive = true;
      await user.save();
      return res.json({ success: true, message: 'User updated', user: { email: user.email, name: user.name } });
    }

    // Create new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name: name || 'Admin User',
      email,
      password: hashedPassword,
      role: 'admin',
      isOnline: false,
      isActive: true,
      language: 'ar',
      permissions: ['all']
    });

    await user.save();
    res.json({ success: true, message: 'Admin created', user: { email: user.email, name: user.name } });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
