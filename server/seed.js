const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wassel';

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User Schema (simplified for seeding)
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
      isOnline: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      language: { type: String, default: 'ar' },
      permissions: [{ type: String }],
      avatar: String,
      lastSeen: { type: Date, default: Date.now }
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'eng.murad.ghannam@gmail.com' });

    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
    } else {
      // Create admin user with hashed password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@2026', salt);

      const admin = await User.create({
        name: 'Murad Ghannam',
        email: 'eng.murad.ghannam@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isOnline: false,
        isActive: true,
        language: 'ar',
        permissions: ['all'],
        lastSeen: new Date()
      });

      console.log('✅ Admin user created successfully!');
      console.log('   Email:', admin.email);
      console.log('   Password: Admin@2026');
      console.log('   Role:', admin.role);
    }

    // Create default company settings
    const companySchema = new mongoose.Schema({
      name: { type: String, default: 'شركتي' },
      nameEn: { type: String, default: 'My Company' },
      email: String,
      phone: String,
      website: String,
      taxNumber: String,
      commercialRegistration: String,
      address: String,
      location: {
        lat: { type: Number, default: 24.7136 },
        lng: { type: Number, default: 46.6753 },
        address: { type: String, default: '' }
      },
      logo: String,
      currency: { type: String, default: 'SAR' },
      fiscalYearStart: Date,
      timezone: { type: String, default: 'Asia/Riyadh' },
      pdfSettings: {
        pageSize: { type: String, default: 'A4' },
        marginTop: { type: Number, default: 20 },
        marginBottom: { type: Number, default: 20 },
        marginLeft: { type: Number, default: 15 },
        marginRight: { type: Number, default: 15 },
        headerText: { type: String, default: '' },
        footerText: { type: String, default: '' },
        showLogo: { type: Boolean, default: true },
        showStamp: { type: Boolean, default: false }
      }
    }, { timestamps: true });

    const Company = mongoose.model('Company', companySchema);

    const existingCompany = await Company.findOne();
    if (!existingCompany) {
      await Company.create({
        name: 'شركتي',
        nameEn: 'My Company',
        currency: 'SAR',
        timezone: 'Asia/Riyadh',
        location: { lat: 24.7136, lng: 46.6753, address: '' }
      });
      console.log('✅ Default company settings created!');
    } else {
      console.log('ℹ️ Company settings already exist');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Email: eng.murad.ghannam@gmail.com');
    console.log('   Password: Admin@2026');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedDatabase();
