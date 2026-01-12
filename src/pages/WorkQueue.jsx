import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Clock, RefreshCw, ChevronDown, ChevronLeft, ChevronRight,
  FileText, CheckCircle2, Loader2, AlertTriangle, Bell, Inbox
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api';

const WorkQueue = () => {
  const navigate = useNavigate();
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [stats, setStats] = useState(null);
  const [queueStats, setQueueStats] = useState(null);

  const [filters, setFilters] = useState({
    facility: '',
    specialty: '',
    reviewStatus: '',
    search: ''
  });

  const [facilities, setFacilities] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  const reviewStatusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_review', label: 'In Review' },
    { value: 'submitted', label: 'Submitted' }
  ];

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.facility && { facility: filters.facility }),
        ...(filters.specialty && { specialty: filters.specialty }),
        ...(filters.reviewStatus && { reviewStatus: filters.reviewStatus }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${API_BASE_URL}/charts?${params}`);
      const data = await response.json();

      if (data.success) {
        setCharts(data.charts);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching charts:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/charts/stats/sla`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/queue/stats`);
      const data = await response.json();
      if (data.success) {
        setQueueStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [facilitiesRes, specialtiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/charts/filters/facilities`),
        fetch(`${API_BASE_URL}/charts/filters/specialties`)
      ]);

      const facilitiesData = await facilitiesRes.json();
      const specialtiesData = await specialtiesRes.json();

      if (facilitiesData.success) setFacilities(facilitiesData.facilities);
      if (specialtiesData.success) setSpecialties(specialtiesData.specialties);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  useEffect(() => {
    fetchCharts();
    fetchStats();
    fetchQueueStats();
    fetchFilterOptions();

    // Auto-refresh every 10 seconds to show processing updates
    const interval = setInterval(() => {
      fetchCharts();
      fetchStats();
      fetchQueueStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchCharts]);

  const handleRefresh = () => {
    fetchCharts();
    fetchStats();
    fetchQueueStats();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleOpenChart = (chartNumber) => {
    navigate(`/chart/${chartNumber}`);
  };

  const getAIStatusBadge = (status) => {
    const config = {
      queued: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Inbox, label: 'Queued' },
      processing: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Loader2, label: 'Processing', animate: true },
      ready: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2, label: 'Ready' },
      failed: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertTriangle, label: 'Failed' }
    };

    const { bg, text, icon: Icon, label, animate } = config[status] || config.queued;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className={`w-3.5 h-3.5 ${animate ? 'animate-spin' : ''}`} />
        {label}
      </span>
    );
  };

  const getReviewStatusBadge = (status) => {
    const config = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'Pending' },
      in_review: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: 'In Review' },
      submitted: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: 'Submitted' }
    };

    const { bg, text, border, label } = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} border ${border}`}>
        {label}
      </span>
    );
  };

  const getSLABadge = (sla) => {
    if (!sla) return <span className="text-sm text-gray-400">--</span>;

    // For charts still processing
    if (!sla.isComplete) {
      return (
        <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          {sla.display || sla.hours}
        </span>
      );
    }

    // Critical: processing took too long (≥5 min)
    if (sla.isCritical) {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          {sla.display || sla.hours}
        </span>
      );
    }

    // Warning: processing took a while (≥2 min)
    if (sla.isWarning) {
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          {sla.display || sla.hours}
        </span>
      );
    }

    // Excellent or Good: processed quickly
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />
        {sla.display || sla.hours}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate total items in queue (queued + processing)
  const queuedCount = (stats?.queued || 0) + (stats?.processing || 0);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">Chart Work Queue</h1>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-xs text-blue-600">AI = First Coder | Human = Auditor (Paired)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Facility Filter */}
          <div className="relative">
            <select
              value={filters.facility}
              onChange={(e) => handleFilterChange('facility', e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="">All Facilities</option>
              {facilities.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Specialty Filter */}
          <div className="relative">
            <select
              value={filters.specialty}
              onChange={(e) => handleFilterChange('specialty', e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="">All Specialties</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Review Status Filter */}
          <div className="relative">
            <select
              value={filters.reviewStatus}
              onChange={(e) => handleFilterChange('reviewStatus', e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              {reviewStatusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Notification */}
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Bell className="w-5 h-5" />
            {stats?.slaCritical > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {stats.slaCritical}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Queue Status Banner - shows when items are processing */}
      {queuedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Processing Documents</p>
              <p className="text-sm text-blue-700">
                {stats?.queued || 0} queued, {stats?.processing || 0} processing
              </p>
            </div>
          </div>
          <div className="text-sm text-blue-600">
            Auto-refreshing every 10s
          </div>
        </div>
      )}

      {/* Search and Stats Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by MRN or Chart Number..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">
                Queue: <span className="font-semibold text-slate-900">{stats?.total || 0}</span>
              </span>
              {queuedCount > 0 && (
                <span className="text-sm text-blue-600">
                  Processing: <span className="font-semibold">{queuedCount}</span>
                </span>
              )}
              <span className="text-sm text-amber-600">
                Warning: <span className="font-semibold">{stats?.slaWarning || 0}</span>
              </span>
              <span className="text-sm text-red-600">
                Critical: <span className="font-semibold">{stats?.slaCritical || 0}</span>
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">MRN</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Chart Number</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Facility</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Date of Service</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Specialty</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Documents</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">AI Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Review Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Processing Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-slate-500">Loading charts...</p>
                  </td>
                </tr>
              ) : charts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No charts found</p>
                  </td>
                </tr>
              ) : (
                charts.map((chart) => (
                  <tr
                    key={chart.id}
                    className={`hover:bg-slate-50/50 transition-colors ${chart.aiStatus === 'queued' || chart.aiStatus === 'processing'
                        ? 'bg-blue-50/30'
                        : ''
                      }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">{chart.mrn || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{chart.chartNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{chart.facility || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{formatDate(chart.dateOfService)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{chart.specialty || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <FileText className="w-4 h-4" />
                        {chart.documentCount || 0} {chart.documentCount === 1 ? 'doc' : 'docs'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getAIStatusBadge(chart.aiStatus)}</td>
                    <td className="px-6 py-4">{getReviewStatusBadge(chart.reviewStatus)}</td>
                    <td className="px-6 py-4">{getSLABadge(chart.sla)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenChart(chart.chartNumber)}
                        disabled={chart.aiStatus === 'queued' || chart.aiStatus === 'processing'}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${chart.aiStatus === 'queued' || chart.aiStatus === 'processing'
                            ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                            : chart.reviewStatus === 'submitted'
                              ? 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                              : 'text-white bg-blue-600 hover:bg-blue-700'
                          }`}
                      >
                        {chart.aiStatus === 'queued' ? 'Queued' :
                          chart.aiStatus === 'processing' ? 'Processing...' :
                            chart.reviewStatus === 'submitted' ? 'View' : 'Open Chart'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && charts.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-200">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="px-4 py-2 text-sm text-slate-600">
              {pagination.page} / {pagination.pages}
            </span>

            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkQueue;
