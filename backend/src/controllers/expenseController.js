import pool from '../config/database.js';
import axios from 'axios';

// Submit expense (Employee)
export const submitExpense = async (req, res) => {
  try {
    const { amount, currencyCode, categoryId, description, expenseDate, merchantName } = req.body;
    const employeeId = req.user.id;
    const companyId = req.user.company_id;

    // Validation
    if (!amount || !currencyCode || !categoryId || !expenseDate) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Convert currency if different from company currency
    let convertedAmount = amount;
    if (currencyCode !== req.user.currency_code) {
      try {
        const conversionRate = await getCurrencyConversion(currencyCode, req.user.currency_code);
        convertedAmount = (amount * conversionRate).toFixed(2);
      } catch (error) {
        console.error('Currency conversion error:', error);
        // Continue with original amount if conversion fails
        convertedAmount = amount;
      }
    }

    const query = `
      INSERT INTO expenses 
      (company_id, employee_id, category_id, amount, currency_code, converted_amount, 
       description, expense_date, merchant_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      companyId,
      employeeId,
      categoryId,
      amount,
      currencyCode,
      convertedAmount,
      description || null,
      expenseDate,
      merchantName || null,
      'pending'
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'Expense submitted successfully',
      expense: result.rows[0]
    });

  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employee's own expenses
export const getMyExpenses = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status, startDate, endDate } = req.query;

    let query = `
      SELECT e.*, c.name as category_name,
             u.first_name || ' ' || u.last_name as employee_name
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.employee_id = u.id
      WHERE e.employee_id = $1
    `;

    const queryParams = [employeeId];
    let paramIndex = 2;

    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND e.expense_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND e.expense_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

    const result = await pool.query(query, queryParams);

    res.json({ expenses: result.rows });

  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team expenses (Manager)
export const getTeamExpenses = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT e.*, c.name as category_name,
             u.first_name || ' ' || u.last_name as employee_name,
             u.email as employee_email
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.employee_id = u.id
      WHERE u.manager_id = $1
    `;

    const queryParams = [managerId];

    if (status) {
      query += ` AND e.status = $2`;
      queryParams.push(status);
    }

    query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

    const result = await pool.query(query, queryParams);

    res.json({ expenses: result.rows });

  } catch (error) {
    console.error('Get team expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending approvals (Manager/Admin)
export const getPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT e.*, c.name as category_name,
             u.first_name || ' ' || u.last_name as employee_name,
             u.email as employee_email
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.employee_id = u.id
      WHERE e.status = 'pending'
    `;

    const queryParams = [];

    if (userRole === 'manager') {
      query += ` AND u.manager_id = $1`;
      queryParams.push(userId);
    } else if (userRole === 'admin') {
      query += ` AND e.company_id = $1`;
      queryParams.push(req.user.company_id);
    }

    query += ` ORDER BY e.expense_date DESC`;

    const result = await pool.query(query, queryParams);

    res.json({ expenses: result.rows });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve/Reject expense (Manager/Admin)
export const updateExpenseStatus = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { action, comments } = req.body;
    const approverId = req.user.id;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await client.query('BEGIN');

    // Get expense details
    const expenseResult = await client.query(
      'SELECT * FROM expenses WHERE id = $1',
      [id]
    );

    if (expenseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = expenseResult.rows[0];

    // Check if user has permission
    if (req.user.role === 'manager') {
      const employeeResult = await client.query(
        'SELECT manager_id FROM users WHERE id = $1',
        [expense.employee_id]
      );
      
      if (employeeResult.rows[0].manager_id !== approverId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Not authorized to approve this expense' });
      }
    }

    // Update expense status
    await client.query(
      `UPDATE expenses 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [action, id]
    );

    // Add to approval history
    await client.query(
      `INSERT INTO approval_history 
       (expense_id, approver_id, action, comments) 
       VALUES ($1, $2, $3, $4)`,
      [id, approverId, action, comments || null]
    );

    await client.query('COMMIT');

    res.json({
      message: `Expense ${action} successfully`,
      expense: { id, status: action }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update expense status error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// Get expense categories
export const getCategories = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const query = `
      SELECT * FROM expense_categories 
      WHERE company_id = $1 AND is_active = true
      ORDER BY name
    `;

    const result = await pool.query(query, [companyId]);

    res.json({ categories: result.rows });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get expense statistics (for dashboard)
export const getExpenseStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.company_id;

    let stats = {};

    if (userRole === 'employee') {
      // Employee stats
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_expenses,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
          COALESCE(SUM(converted_amount) FILTER (WHERE status = 'approved'), 0) as total_approved_amount
         FROM expenses 
         WHERE employee_id = $1`,
        [userId]
      );
      stats = result.rows[0];
    } else if (userRole === 'manager') {
      // Manager stats
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_expenses,
          COUNT(*) FILTER (WHERE e.status = 'pending') as pending_count,
          COUNT(*) FILTER (WHERE e.status = 'approved') as approved_count,
          COUNT(*) FILTER (WHERE e.status = 'rejected') as rejected_count
         FROM expenses e
         JOIN users u ON e.employee_id = u.id
         WHERE u.manager_id = $1`,
        [userId]
      );
      stats = result.rows[0];
    } else if (userRole === 'admin') {
      // Admin stats
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_expenses,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
          COALESCE(SUM(converted_amount) FILTER (WHERE status = 'approved'), 0) as total_approved_amount
         FROM expenses 
         WHERE company_id = $1`,
        [companyId]
      );
      stats = result.rows[0];
    }

    res.json({ stats });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function for currency conversion
async function getCurrencyConversion(fromCurrency, toCurrency) {
  try {
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );
    return response.data.rates[toCurrency];
  } catch (error) {
    console.error('Currency conversion API error:', error);
    return 1; // Return 1 if conversion fails
  }
}