import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle2, Layers, TrendingUp,
  BarChart3, ArrowRight, Loader2, RefreshCw, WifiOff
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch combined dashboard stats (charts + transactions)
      const response = await fetch(`${API_BASE_URL}/documents/dashboard/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch stats');
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Unable to connect to server. Please check if the backend is running.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <WifiOff className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Connection Error</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of your medical coding operations</p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FileText}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          value={stats?.total ?? 0}
          label="Total Charts"
        />
        <StatCard
          icon={Clock}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          value={stats?.pendingReview ?? 0}
          label="Pending Review"
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          value={stats?.submitted ?? 0}
          label="Submitted"
        />
        {/* Total Transactions - replacing SLA Alerts */}
        <StatCard
          icon={Layers}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          value={stats?.totalTransactions ?? 0}
          label="Total Transactions"
          subValue={stats?.doneTransactions ? `${stats.doneTransactions} done` : null}
          doneCount={stats?.doneTransactions}
          totalCount={stats?.totalTransactions}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Queued</span>
            <span className="text-lg font-semibold text-slate-900">{stats?.queued ?? 0}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Processing</span>
            <span className="text-lg font-semibold text-slate-900">{stats?.processing ?? 0}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">In Review</span>
            <span className="text-lg font-semibold text-slate-900">{stats?.inReview ?? 0}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-slate-500 block">Pending Transactions</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold text-amber-600">
                {(stats?.totalTransactions ?? 0) - (stats?.doneTransactions ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <QuickActionCard
          title="Work Queue"
          description="Review and process pending charts"
          icon={FileText}
          link="/work-queue"
          count={stats?.pendingReview ?? 0}
          countLabel="charts waiting"
        />
        <QuickActionCard
          title="Document Ingestion"
          description="Upload new clinical documents"
          icon={TrendingUp}
          link="/document-ingestion"
        />
      </div>

      {/* Status Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">System Status</h3>
          <Link to="/analytics" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View Analytics <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {stats && stats.total > 0 ? (
          <div className="space-y-3">
            <StatusRow
              label="Charts Ready for Review"
              value={stats.pendingReview}
              total={stats.total}
              color="amber"
            />
            <StatusRow
              label="Currently In Review"
              value={stats.inReview}
              total={stats.total}
              color="blue"
            />
            <StatusRow
              label="Submitted to NextCode"
              value={stats.submitted}
              total={stats.total}
              color="emerald"
            />
            {/* Transaction breakdown */}
            {stats.totalTransactions > 0 && (
              <>
                <div className="border-t border-slate-100 pt-3 mt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-medium text-slate-700">Transaction Breakdown</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-xl font-bold text-slate-900">{stats.totalTransactions}</div>
                      <div className="text-xs text-slate-500">Total</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <div className="text-xl font-bold text-emerald-600">{stats.doneTransactions ?? 0}</div>
                      <div className="text-xs text-slate-500">Done</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-xl font-bold text-red-600">{stats.pdfTransactions}</div>
                      <div className="text-xs text-slate-500">PDFs</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{stats.imageGroupTransactions}</div>
                      <div className="text-xs text-slate-500">Image Groups</div>
                    </div>
                  </div>
                  {/* Done progress bar */}
                  {stats.totalTransactions > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Completion Rate</span>
                        <span className="font-medium text-emerald-600">
                          {(((stats.doneTransactions ?? 0) / stats.totalTransactions) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${((stats.doneTransactions ?? 0) / stats.totalTransactions) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No charts in the system yet</p>
            <Link
              to="/document-ingestion"
              className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-700"
            >
              Upload your first document <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, iconBg, iconColor, value, label, subValue, highlight = false, doneCount, totalCount }) => {
  const showProgress = doneCount !== undefined && totalCount !== undefined && totalCount > 0;
  const progressPercent = showProgress ? (doneCount / totalCount) * 100 : 0;

  return (
    <div className={`bg-white rounded-xl border p-5 ${highlight ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {subValue && (
        <div className="flex items-center gap-2 mt-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs text-emerald-600 font-medium">{subValue}</span>
        </div>
      )}
      {showProgress && (
        <div className="mt-2">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const QuickActionCard = ({ title, description, icon: Icon, link, count, countLabel }) => (
  <Link
    to={link}
    className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all group"
  >
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
        {count !== undefined && count > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            {count} {countLabel}
          </div>
        )}
      </div>
      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
        <Icon className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </div>
  </Link>
);

const StatusRow = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClasses = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
