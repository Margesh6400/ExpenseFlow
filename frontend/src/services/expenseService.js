import api from './api';

export const expenseService = {
  // Submit expense
  submitExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Get my expenses
  getMyExpenses: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/expenses/my-expenses?${params}`);
    return response.data;
  },

  // Get team expenses (Manager)
  getTeamExpenses: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/expenses/team-expenses?${params}`);
    return response.data;
  },

  // Get pending approvals (Manager/Admin)
  getPendingApprovals: async () => {
    const response = await api.get('/expenses/pending-approvals');
    return response.data;
  },

  // Approve/Reject expense
  updateExpenseStatus: async (expenseId, action, comments) => {
    const response = await api.patch(`/expenses/${expenseId}/status`, {
      action,
      comments,
    });
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    const response = await api.get('/expenses/categories');
    return response.data;
  },

  // Get stats
  getExpenseStats: async () => {
    const response = await api.get('/expenses/stats');
    return response.data;
  },
};