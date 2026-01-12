import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  Users, BarChart3, ArrowRight, Loader2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/charts/stats/sla`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // Use mock data
      setStats({
        total: 1238,
        pendingReview: 47,
        processing: 3,
        inReview: 12,
        submitted: 1176,
        slaWarning: 5,
        slaCritical: 2
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">Overview of your medical coding operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FileText}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          value={stats?.total || 0}
          label="Total Charts"
        />
        <StatCard
          icon={Clock}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          value={stats?.pendingReview || 0}
          label="Pending Review"
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          value={stats?.submitted || 0}
          label="Submitted"
        />
        <StatCard
          icon={AlertTriangle}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          value={(stats?.slaWarning || 0) + (stats?.slaCritical || 0)}
          label="SLA Alerts"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <QuickActionCard
          title="Work Queue"
          description="Review and process pending charts"
          icon={FileText}
          link="/work-queue"
          count={stats?.pendingReview || 0}
          countLabel="charts waiting"
        />
        <QuickActionCard
          title="Document Ingestion"
          description="Upload new clinical documents"
          icon={TrendingUp}
          link="/document-ingestion"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          <Link to="/work-queue" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="text-center py-8 text-slate-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Activity feed coming soon</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, iconBg, iconColor, value, label }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

const QuickActionCard = ({ title, description, icon: Icon, link, count, countLabel }) => (
  <Link
    to={link}
    className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all group"
  >
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
        {count !== undefined && (
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

export default Dashboard;
