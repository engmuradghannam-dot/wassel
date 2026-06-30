const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employee:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },

  date:       { type: Date, required: true },     // يوم العمل (بدون وقت — للفهرسة اليومية)
  checkIn:    { type: Date },
  checkOut:   { type: Date },

  status: {
    type: String,
    enum: ['present','absent','late','half_day','on_leave','holiday','weekend'],
    default: 'present'
  },

  workedHours: { type: Number, default: 0 },   // محسوبة من checkIn/checkOut
  lateMinutes: { type: Number, default: 0 },
  overtimeMinutes: { type: Number, default: 0 },

  location: { lat: Number, lng: Number, address: String }, // لو سُجِّل عبر GPS
  notes:    { type: String },
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// سجل واحد فقط لكل موظف في اليوم الواحد
attendanceSchema.index({ company:1, employee:1, date:1 }, { unique: true });

attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    this.workedHours = +((this.checkOut - this.checkIn) / 3600000).toFixed(2);
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
