import { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, BarChart3, Download, ChevronDown,
  CheckCircle2, Target, Edit3, AlertTriangle,
  Info, CheckCircle, Loader2, Database, Brain, X
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

// Color palette
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  teal: '#14B8A6',
  violet: '#8B5CF6'
};

const PIE_COLORS = ['#EF4444', '#F97316', '#FBBF24', '#3B82F6', '#10B981'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/charts/analytics/dashboard?period=${period}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || 'Failed to fetch analytics');
        setAnalytics(null);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Unable to connect to server. Please check if the backend is running.');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Analytics</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const data = analytics;
  const hasData = data && data.summary && data.summary.chartsProcessed > 0;
  const hasCodeData = data?.summary?.totalAICodes > 0;

  // Prepare pie chart data from real data only
  const pieData = data?.correctionReasons?.length > 0
    ? data.correctionReasons.map((item, index) => ({
      name: item.reason,
      value: parseFloat(item.percentage),
      color: PIE_COLORS[index % PIE_COLORS.length]
    }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin & Analytics</h1>
          <p className="text-slate-500 text-sm">AI performance metrics and system analytics</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Export Button */}
          {/* <button */}
          {/*   className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed" */}
          {/*   disabled={!hasData} */}
          {/* > */}
          {/*   <Download className="w-4 h-4" /> */}
          {/*   Export Report */}
          {/* </button> */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* AI Accuracy - Primary Metric (NEW) */}
        <SummaryCard
          icon={Brain}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          value={hasCodeData ? `${data.summary.aiAccuracy}%` : '--'}
          label="AI Accuracy"
          subLabel={hasCodeData
            ? `${data.summary.unchangedCodes}/${data.summary.totalAICodes} codes unchanged`
            : 'No submitted data'}
          hasData={hasCodeData}
          tooltip="Percentage of AI codes accepted without changes"
        />
        <SummaryCard
          icon={BarChart3}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          value={hasData ? data.summary.chartsProcessed.toLocaleString() : '0'}
          label="Charts Processed"
          subLabel={hasData && data.performance ? `${data.performance.chartsPerDay} charts/day avg` : 'No data available'}
          hasData={hasData}
        />
        <SummaryCard
          icon={Target}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          value={hasData ? `${data.summary.totalSubmitted || 0}` : '0'}
          label="Charts Submitted"
          subLabel="Reviewed and submitted"
          hasData={hasData}
        />
        <SummaryCard
          icon={Edit3}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          value={hasCodeData ? `${data.summary.correctionRate}%` : '--'}
          label="Correction Rate"
          subLabel={hasCodeData
            ? `${data.summary.totalModifications} codes changed`
            : 'No submitted data'}
          hasData={hasCodeData}
          tooltip="Percentage of AI codes that were modified or rejected"
        />
      </div>

      {/* AI Code Breakdown - NEW Section */}
      {hasCodeData && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-900">AI Code Analysis</h3>
            </div>
            <div className="text-sm text-slate-500">
              Based on {data.summary.totalSubmitted} submitted charts
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <CodeStatBox
              label="Total AI Codes"
              value={data.summary.totalAICodes}
              icon={Brain}
              color="bg-slate-100"
              textColor="text-slate-700"
            />
            <CodeStatBox
              label="Unchanged"
              value={data.summary.unchangedCodes}
              percentage={data.summary.totalAICodes > 0
                ? ((data.summary.unchangedCodes / data.summary.totalAICodes) * 100).toFixed(1)
                : 0}
              icon={CheckCircle}
              color="bg-emerald-100"
              textColor="text-emerald-700"
            />
            <CodeStatBox
              label="Modified"
              value={data.summary.modifiedCodes}
              percentage={data.summary.totalAICodes > 0
                ? ((data.summary.modifiedCodes / data.summary.totalAICodes) * 100).toFixed(1)
                : 0}
              icon={Edit3}
              color="bg-blue-100"
              textColor="text-blue-700"
            />
            <CodeStatBox
              label="Rejected"
              value={data.summary.rejectedCodes}
              percentage={data.summary.totalAICodes > 0
                ? ((data.summary.rejectedCodes / data.summary.totalAICodes) * 100).toFixed(1)
                : 0}
              icon={X}
              color="bg-red-100"
              textColor="text-red-700"
            />
            <CodeStatBox
              label="User Added"
              value={data.summary.addedCodes}
              icon={TrendingUp}
              color="bg-violet-100"
              textColor="text-violet-700"
            />
          </div>

          {/* Visual Progress Bar */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-slate-600">AI Code Outcome Distribution</span>
            </div>
            <div className="h-4 rounded-full bg-slate-100 overflow-hidden flex">
              {data.summary.totalAICodes > 0 && (
                <>
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${(data.summary.unchangedCodes / data.summary.totalAICodes) * 100}%` }}
                    title={`Unchanged: ${data.summary.unchangedCodes}`}
                  />
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${(data.summary.modifiedCodes / data.summary.totalAICodes) * 100}%` }}
                    title={`Modified: ${data.summary.modifiedCodes}`}
                  />
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${(data.summary.rejectedCodes / data.summary.totalAICodes) * 100}%` }}
                    title={`Rejected: ${data.summary.rejectedCodes}`}
                  />
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span className="text-slate-600">Unchanged</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-slate-600">Modified</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-slate-600">Rejected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* AI Accuracy Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">AI Accuracy Trend</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              Accuracy %
            </div>
          </div>
          <div className="h-64">
            {data?.trends?.acceptanceRate?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends.acceptanceRate}>
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [`${value}%`, 'AI Accuracy']}
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    fill="url(#accuracyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No trend data available" />
            )}
          </div>
        </div>

        {/* Volume by Facility */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Volume by Facility</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              Charts Processed
            </div>
          </div>
          <div className="h-64">
            {data?.volumeByFacility?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.volumeByFacility} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis
                    type="category"
                    dataKey="facility"
                    tick={{ fontSize: 11 }}
                    stroke="#94A3B8"
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value, 'Charts']}
                  />
                  <Bar dataKey="count" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No facility data available" />
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Most Common Correction Reasons */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Most Common Correction Reasons</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">View Details</button>
          </div>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {data.correctionReasons.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-slate-700 truncate max-w-[180px]" title={item.reason}>
                        {item.reason}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48">
              <EmptyState message="No correction data available" />
            </div>
          )}
        </div>

        {/* Accuracy by Specialty */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Accuracy by Specialty</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Accuracy %
            </div>
          </div>
          <div className="h-64">
            {data?.specialtyAccuracy?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.specialtyAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Accuracy']}
                  />
                  <Bar
                    dataKey="accuracy"
                    fill={COLORS.primary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No specialty accuracy data available" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Top Correction Reasons */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Top Correction Reasons</h3>
          {data?.correctionReasons?.length > 0 ? (
            <div className="space-y-3">
              {data.correctionReasons.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-sm text-slate-700 truncate max-w-[150px]" title={item.reason}>
                      {item.reason}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">({item.count})</span>
                    <span className="text-sm font-semibold text-slate-900">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No correction data" small />
          )}
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <MetricRow
              label="Avg Processing Time"
              value={data?.performance?.avgProcessingTime && parseFloat(data.performance.avgProcessingTime) > 0
                ? `${data.performance.avgProcessingTime} min`
                : '--'}
            />
            <MetricRow
              label="Avg Review Time"
              value={data?.performance?.avgReviewTime && parseFloat(data.performance.avgReviewTime) > 0
                ? `${data.performance.avgReviewTime} min`
                : '--'}
            />
            <MetricRow
              label="Total Cycle Time"
              value={data?.performance?.totalCycleTime && parseFloat(data.performance.totalCycleTime) > 0
                ? `${data.performance.totalCycleTime} min`
                : '--'}
            />
            <div className="border-t border-slate-100 pt-3 mt-3">
              <MetricRow
                label="Queue Backlog"
                value={data?.performance?.queueBacklog !== undefined
                  ? `${data.performance.queueBacklog} charts`
                  : '--'}
              />
              <MetricRow
                label="SLA Compliance"
                value={data?.performance?.slaCompliance && parseFloat(data.performance.slaCompliance) > 0
                  ? `${data.performance.slaCompliance}%`
                  : '--'}
                valueColor={data?.performance?.slaCompliance >= 90 ? 'text-emerald-600' : 'text-amber-600'}
              />
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            {data?.alerts?.length > 0 ? (
              data.alerts.map((alert, idx) => (
                <AlertItem key={idx} alert={alert} />
              ))
            ) : (
              <AlertItem alert={{ type: 'success', title: 'All Systems Normal', message: 'No issues detected' }} />
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      {hasCodeData && (
        <div className="flex items-center justify-center mt-6">
          <div className="flex items-center gap-4 bg-white rounded-full px-6 py-3 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Brain className="w-4 h-4 text-emerald-500" />
              <span><strong>{data.summary.totalAICodes}</strong> AI codes generated</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span><strong>{data.summary.aiAccuracy}%</strong> accuracy</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Edit3 className="w-4 h-4 text-blue-500" />
              <span><strong>{data.summary.totalModifications}</strong> corrections</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ message, small = false }) => (
  <div className={`flex flex-col items-center justify-center ${small ? 'py-6' : 'h-full'} text-slate-400`}>
    <Database className={`${small ? 'w-8 h-8' : 'w-12 h-12'} mb-2`} />
    <p className={`${small ? 'text-xs' : 'text-sm'}`}>{message}</p>
  </div>
);

// Summary Card Component
const SummaryCard = ({ icon: Icon, iconBg, iconColor, value, label, subLabel, hasData, tooltip }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 relative group">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      {tooltip && (
        <div className="relative">
          <Info className="w-4 h-4 text-slate-300 hover:text-slate-500 cursor-help" />
          <div className="absolute right-0 top-6 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {tooltip}
          </div>
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
    <div className="text-sm text-slate-600">{label}</div>
    <div className="text-xs text-slate-400 mt-1">{subLabel}</div>
  </div>
);

// Code Stat Box Component (NEW)
const CodeStatBox = ({ label, value, percentage, icon: Icon, color, textColor }) => (
  <div className={`${color} rounded-xl p-4 text-center`}>
    <div className="flex items-center justify-center mb-2">
      <Icon className={`w-5 h-5 ${textColor}`} />
    </div>
    <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
    <div className="text-sm text-slate-600">{label}</div>
    {percentage !== undefined && (
      <div className={`text-xs ${textColor} mt-1`}>{percentage}%</div>
    )}
  </div>
);

// Metric Row Component
const MetricRow = ({ label, value, valueColor = 'text-slate-900' }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-600">{label}</span>
    <span className={`font-semibold ${valueColor}`}>{value}</span>
  </div>
);

// Alert Item Component
const AlertItem = ({ alert }) => {
  const styles = {
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-700',
      textColor: 'text-amber-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: Info,
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-700',
      textColor: 'text-blue-600'
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-700',
      textColor: 'text-emerald-600'
    }
  };

  const style = styles[alert.type] || styles.info;
  const Icon = style.icon;

  return (
    <div className={`p-3 rounded-xl ${style.bg} border ${style.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 ${style.iconColor} mt-0.5`} />
        <div>
          <p className={`text-sm font-medium ${style.titleColor}`}>{alert.title}</p>
          <p className={`text-xs ${style.textColor}`}>{alert.message}</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
