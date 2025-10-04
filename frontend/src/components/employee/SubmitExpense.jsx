import { useState, useEffect } from 'react';
import { expenseService } from '../../services/expenseService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { DollarSign, Calendar, FileText } from 'lucide-react';

const SubmitExpense = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currencyCode: user?.company?.currencyCode || 'USD',
    categoryId: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    merchantName: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await expenseService.getCategories();
      setCategories(data.categories);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await expenseService.submitExpense(formData);
      toast.success('Expense submitted successfully!');
      
      // Reset form
      setFormData({
        amount: '',
        currencyCode: user?.company?.currencyCode || 'USD',
        categoryId: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        merchantName: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <DollarSign className="h-8 w-8 text-indigo-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Submit Expense</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency *
              </label>
              <input
                type="text"
                name="currencyCode"
                required
                value={formData.currencyCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="USD"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="categoryId"
              required
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Expense Date *
            </label>
            <input
              type="date"
              name="expenseDate"
              required
              value={formData.expenseDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merchant/Vendor Name
            </label>
            <input
              type="text"
              name="merchantName"
              value={formData.merchantName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Starbucks, Uber"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline h-4 w-4 mr-1" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add any additional details..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Expense'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitExpense;