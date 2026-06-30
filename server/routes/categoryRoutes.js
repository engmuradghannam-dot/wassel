const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');

router.route('/')
  .get( protect, getCategories)
  .post(protect, authorize('owner','admin','manager'), createCategory);

router.route('/:id')
  .get(   protect, getCategory)
  .put(   protect, authorize('owner','admin','manager'), updateCategory)
  .delete(protect, authorize('owner','admin'), deleteCategory);

module.exports = router;
