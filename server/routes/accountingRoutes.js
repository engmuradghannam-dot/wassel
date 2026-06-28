const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  // Accounts
  getAccounts, getAccount, createAccount, updateAccount, deleteAccount, seedAccounts,
  // Journal Entries
  getJournalEntries, getJournalEntry, createJournalEntry, postJournalEntry, voidJournalEntry, deleteJournalEntry,
  // Transactions
  getTransactions, createTransaction,
  // Reports
  getBalanceSheet, getIncomeStatement, getTrialBalance, getAccountLedger
} = require('../controllers/accountingController');

// Chart of Accounts
router.route('/accounts')
  .get(protect, getAccounts)
  .post(protect, authorize('admin', 'manager'), createAccount);

router.post('/accounts/seed', protect, authorize('admin'), seedAccounts);

router.route('/accounts/:id')
  .get(protect, getAccount)
  .put(protect, authorize('admin', 'manager'), updateAccount)
  .delete(protect, authorize('admin'), deleteAccount);

router.get('/accounts/:accountId/ledger', protect, getAccountLedger);

// Journal Entries
router.route('/journal')
  .get(protect, getJournalEntries)
  .post(protect, authorize('admin', 'manager'), createJournalEntry);

router.route('/journal/:id')
  .get(protect, getJournalEntry)
  .delete(protect, authorize('admin'), deleteJournalEntry);

router.put('/journal/:id/post', protect, authorize('admin', 'manager'), postJournalEntry);
router.put('/journal/:id/void', protect, authorize('admin'), voidJournalEntry);

// Transactions
router.route('/transactions')
  .get(protect, getTransactions)
  .post(protect, createTransaction);

// Financial Reports
router.get('/reports/balance-sheet', protect, getBalanceSheet);
router.get('/reports/income-statement', protect, getIncomeStatement);
router.get('/reports/trial-balance', protect, getTrialBalance);

module.exports = router;
