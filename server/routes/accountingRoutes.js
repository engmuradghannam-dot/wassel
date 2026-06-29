const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantGuard } = require('../middleware/tenant');
const {
  getAccounts, getAccount, createAccount, updateAccount, deleteAccount, seedAccounts,
  getJournalEntries, getJournalEntry, createJournalEntry, postJournalEntry, voidJournalEntry, deleteJournalEntry,
  getTransactions, createTransaction,
  getBalanceSheet, getIncomeStatement, getTrialBalance, getAccountLedger
} = require('../controllers/accountingController');

router.route('/accounts')
  .get( protect, tenantGuard, getAccounts)
  .post(protect, tenantGuard, authorize('owner','admin','manager'), createAccount);

router.post('/accounts/seed', protect, tenantGuard, authorize('owner','admin'), seedAccounts);

router.route('/accounts/:id')
  .get(   protect, tenantGuard, getAccount)
  .put(   protect, tenantGuard, authorize('owner','admin','manager'), updateAccount)
  .delete(protect, tenantGuard, authorize('owner','admin'), deleteAccount);

router.get('/accounts/:accountId/ledger', protect, tenantGuard, getAccountLedger);

router.route('/journal')
  .get( protect, tenantGuard, getJournalEntries)
  .post(protect, tenantGuard, authorize('owner','admin','manager'), createJournalEntry);

router.route('/journal/:id')
  .get(   protect, tenantGuard, getJournalEntry)
  .delete(protect, tenantGuard, authorize('owner','admin'), deleteJournalEntry);

router.put('/journal/:id/post', protect, tenantGuard, authorize('owner','admin','manager'), postJournalEntry);
router.put('/journal/:id/void', protect, tenantGuard, authorize('owner','admin'), voidJournalEntry);

router.route('/transactions')
  .get( protect, tenantGuard, getTransactions)
  .post(protect, tenantGuard, createTransaction);

router.get('/reports/balance-sheet',   protect, tenantGuard, getBalanceSheet);
router.get('/reports/income-statement',protect, tenantGuard, getIncomeStatement);
router.get('/reports/trial-balance',   protect, tenantGuard, getTrialBalance);

module.exports = router;