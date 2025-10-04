import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { expenseService } from '../services/expenseService';
import PendingApprovals from '../components/manager/PendingApprovals';
import ExpenseHistory from '../components/employee/ExpenseHistory';
import SubmitExpense from '../components/employee/SubmitExpense';
import { 
  LogOut, 
  ClipboardCheck, 
  DollarSign, 
  Users, 
  ClipboardList,
  User 
} from 'lucide-react';
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    team_total: 0,
    team_pending: 0,
    team_approved: 0,
    team_rejected: 0,
    personal_total: 0,
    personal_approved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await expenseService.getExpenseStats();
      setStats(response.stats);
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics');
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
              <span className="ml-4 text-gray-600">Manager Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Manager
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard
            title="Team Pending"
            value={stats.team_pending}
            icon={ClipboardCheck}
            color="border-yellow-500"
          />
          <StatCard
            title="Team Approved"
            value={stats.team_approved}
            icon={ClipboardCheck}
            color="border-green-500"
          />
          <StatCard
            title="Team Rejected"
            value={stats.team_rejected}
            icon={ClipboardCheck}
            color="border-red-500"
          />
          <StatCard
            title="Team Total"
            value={stats.team_total}
            icon={Users}
            color="border-blue-500"
          />
          <StatCard
            title="My Total"
            value={stats.personal_total}
            icon={DollarSign}
            color="border-purple-500"
          />
          <StatCard
            title="My Approved"
            value={stats.personal_approved}
            icon={ClipboardCheck}
            color="border-indigo-500"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClipboardCheck className="h-4 w-4 inline mr-2" />
                Pending Approvals
                {stats.team_pending > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    {stats.team_pending}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'team'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Team Expenses
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'personal'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="h-4 w-4 inline mr-2" />
                Submit Expense
              </button>
            </nav>
          </div>

          <div className="p-4">
            {activeTab === 'pending' && <PendingApprovals onActionComplete={fetchDashboardStats} />}
            {activeTab === 'team' && (
              <ExpenseHistory 
                mode="team"
                onRefresh={fetchDashboardStats}
              />
            )}
            {activeTab === 'personal' && (
              <SubmitExpense 
                onSubmitSuccess={fetchDashboardStats}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;