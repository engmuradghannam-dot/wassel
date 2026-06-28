const Employee = require('../models/Employee');
const { buildFilter } = require('../middleware/tenant');

exports.getEmployees = async (req, res) => {
  try {
    const { department, branch, status } = req.query;
    const extra = {};
    if (department) extra.department = department;
    if (branch)     extra.branch     = branch;
    if (status)     extra.status     = status;
    const employees = await Employee.find(buildFilter(req, extra))
      .populate('branch','name').populate('manager','name').sort({ name: 1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('branch','name').populate('manager','name email');
    if (!emp) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    res.json({ success: true, data: emp });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createEmployee = async (req, res) => {
  try {
    const emp = await Employee.create({ ...req.body, company: req.company });
    res.status(201).json({ success: true, data: emp });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true, runValidators: true });
    if (!emp) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    res.json({ success: true, data: emp });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOneAndDelete(buildFilter(req, { _id: req.params.id }));
    if (!emp) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    res.json({ success: true, message: 'تم حذف الموظف' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getDepartments = async (req, res) => {
  try {
    const depts = await Employee.distinct('department', buildFilter(req));
    res.json({ success: true, data: depts.filter(Boolean) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
