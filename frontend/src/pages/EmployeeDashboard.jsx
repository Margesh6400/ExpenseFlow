import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { expenseService } from '../services/expenseService';
import SubmitExpense from '../components/employee/SubmitExpense';
import ExpenseHistory from '../components/employee/ExpenseHistory';
import { LogOut, DollarSign, ClipboardList, User } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submit');
  const [stats, setStats] = useState({
    total_expenses: 0,
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    total_approved_amount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenseStats();
  }, []);

  const fetchExpenseStats = async () => {
    try {
      const response = await expenseService.getExpenseStats();
      setStats(response.stats);
    } catch (error) {
      toast.error('Failed to fetch expense statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color}`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color.replace('border', 'bg')} bg-opacity-10 mr-4`}>
          <Icon className={`h-6 w-6 ${color.replace('border', 'text')}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">ExpenseFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                Employee
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Expenses"
            value={stats.total_expenses}
            icon={DollarSign}
            color="border-blue-500"
          />
          <StatCard
            title="Pending"
            value={stats.pending_count}
            icon={ClipboardList}
            color="border-yellow-500"
          />
          <StatCard
            title="Approved"
            value={stats.approved_count}
            icon={ClipboardList}
            color="border-green-500"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected_count}
            icon={ClipboardList}
            color="border-red-500"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('submit')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'submit'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="h-4 w-4 inline mr-2" />
                Submit Expense
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClipboardList className="h-4 w-4 inline mr-2" />
                Expense History
              </button>
            </nav>
          </div>

          <div className="p-4">
            {activeTab === 'submit' ? <SubmitExpense /> : <ExpenseHistory />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;