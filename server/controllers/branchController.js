const Branch = require('../models/Branch');

exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().populate('manager', 'name email');
    res.json({ success: true, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('manager', 'name email');
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ success: true, data: branch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, message: 'Branch deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
