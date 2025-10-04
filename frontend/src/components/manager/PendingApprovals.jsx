import { useState, useEffect } from 'react';
import { expenseService } from '../../services/expenseService';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PendingApprovals = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const data = await expenseService.getPendingApprovals();
      setExpenses(data.expenses);
    } catch (error) {
      toast.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (expense, actionType) => {
    setSelectedExpense(expense);
    setAction(actionType);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      await expenseService.updateExpenseStatus(
        selectedExpense.id,
        action,
        comments
      );
      
      toast.success(`Expense ${action} successfully`);
      fetchPendingApprovals();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update expense');
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedExpense(null);
    setComments('');
    setAction('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <AlertCircle className="h-8 w-8 text-indigo-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
        <span className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          {expenses.length} pending
        </span>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No pending expenses to review</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.employee_name}
                    </div>
                    <div className="text-sm text-gray-500">{expense.employee_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.category_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.currency_code} {parseFloat(expense.amount).toFixed(2)}
                    </div>
                    {expense.converted_amount && expense.currency_code !== expense.company_currency && (
                      <div className="text-xs text-gray-500">
                        ({expense.company_currency} {parseFloat(expense.converted_amount).toFixed(2)})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {expense.description || '-'}
                    </div>
                    {expense.merchant_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        Merchant: {expense.merchant_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleAction(expense, 'approved')}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleAction(expense, 'rejected')}
                      className="text-red-600 hover:text-red-900"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
                {action === 'approved' ? 'Approve Expense' : 'Reject Expense'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {action === 'approved'
                  ? 'Are you sure you want to approve this expense?'
                  : 'Are you sure you want to reject this expense?'}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (optional)
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    rows="3"
                    placeholder="Add any comments..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className={`px-4 py-2 text-white rounded-md ${
                      action === 'approved'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {processing
                      ? 'Processing...'
                      : action === 'approved'
                      ? 'Approve'
                      : 'Reject'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;