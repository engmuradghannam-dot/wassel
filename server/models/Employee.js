const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  nameEn: { type: String },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String },
  nationalId: { type: String },
  position: { type: String },
  department: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salary: { type: Number },
  hireDate: { type: Date },
  contractEnd: { type: Date },
  nationality: { type: String },
  gender: { type: String, enum: ['male', 'female'] },
  status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
  avatar: { type: String },
  iqama: { type: String },
  iqamaExpiry: { type: Date },
  passportNumber: { type: String },
  passportExpiry: { type: Date }
}, { timestamps: true });

employeeSchema.pre('save', function(next) {
  if (!this.employeeId) {
    this.employeeId = 'EMP-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
