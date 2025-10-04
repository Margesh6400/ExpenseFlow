import express from 'express';
import {
  submitExpense,
  getMyExpenses,
  getTeamExpenses,
  getPendingApprovals,
  updateExpenseStatus,
  getCategories,
  getExpenseStats
} from '../controllers/expenseController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Employee routes
router.post('/', authorizeRoles('employee', 'manager', 'admin'), submitExpense);
router.get('/my-expenses', authorizeRoles('employee', 'manager', 'admin'), getMyExpenses);
router.get('/categories', getCategories);
router.get('/stats', getExpenseStats);

// Manager routes
router.get('/team-expenses', authorizeRoles('manager', 'admin'), getTeamExpenses);
router.get('/pending-approvals', authorizeRoles('manager', 'admin'), getPendingApprovals);
router.patch('/:id/status', authorizeRoles('manager', 'admin'), updateExpenseStatus);

export default router;