import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  BarChart3, Users, TrendingUp, TrendingDown, Target, CheckCircle2,
  AlertCircle, Loader2, ChevronDown, RefreshCw, Award
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

const CoderAccuracy = () => {
  const { authFetch } = useAuthStore();

  const [coderStats, setCoderStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateRange, setDateRange] = useState('30');

  const fetchAccuracyData = async () => {
    try {
      setLoading(true);
      setError('');

      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();

      const params = new URLSearchParams({ startDate, endDate });

      const response = await authFetch(`${API_BASE_URL}/analytics/coder-accuracy?${params}`);
      const data = await response.json();

      if (data.success) {
        setCoderStats(data.coderStats || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccuracyData();
  }, [dateRange]);

  // Calculate overall stats
  const overallStats = React.useMemo(() => {
    if (!coderStats.length) return null;

    const totalCharts = coderStats.reduce((sum, c) => sum + parseInt(c.totalCharts || 0), 0);
    const totalApproved = coderStats.reduce((sum, c) => sum + parseInt(c.approvedCharts || 0), 0);
    const totalCorrected = coderStats.reduce((sum, c) => sum + parseInt(c.correctedCharts || 0), 0);

    return {
      totalCharts,
      totalApproved,
      totalCorrected,
      overallAccuracy: totalCharts > 0 ? ((totalApproved / totalCharts) * 100).toFixed(1) : 0
    };
  }, [coderStats]);

  const getAccuracyColor = (accuracy) => {
    const acc = parseFloat(accuracy);
    if (acc >= 95) return 'text-emerald-600';
    if (acc >= 85) return 'text-amber-600';
    return 'text-red-600';
  };

  const getAccuracyBg = (accuracy) => {
    const acc = parseFloat(accuracy);
    if (acc >= 95) return 'bg-emerald-50 border-emerald-200';
    if (acc >= 85) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-indigo-600" />
              Coder Accuracy Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Track and analyze coder performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={fetchAccuracyData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading accuracy data...</p>
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Target className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-sm text-slate-500">Overall Accuracy</span>
                </div>
                <p className={`text-3xl font-bold ${getAccuracyColor(overallStats?.overallAccuracy || 0)}`}>
                  {overallStats?.overallAccuracy || 0}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Chart-level approval rate
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-500">Charts Approved</span>
                </div>
                <p className="text-3xl font-bold text-emerald-600">{overallStats?.totalApproved || 0}</p>
                <p className="text-xs text-slate-400 mt-1">No corrections needed</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm text-slate-500">Charts Corrected</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{overallStats?.totalCorrected || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Required QA corrections</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-slate-500">Total Reviewed</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">{overallStats?.totalCharts || 0}</p>
                <p className="text-xs text-slate-400 mt-1">By QA team</p>
              </div>
            </div>

            {/* Individual Coder Performance */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Individual Coder Performance</h3>
              </div>

              {coderStats.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No data available for selected period</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Coder</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Total Charts</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Approved</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Corrected</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Accuracy</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coderStats.map((coder, idx) => {
                      const accuracy = coder.chartAccuracy || 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                                {coder.codedBy?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span className="font-medium text-slate-900">{coder.codedBy || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-slate-700 font-medium">{coder.totalCharts}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-emerald-600 font-medium">{coder.approvedCharts}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-amber-600 font-medium">{coder.correctedCharts}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>
                              {accuracy}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getAccuracyBg(accuracy)}`}>
                              {parseFloat(accuracy) >= 95 ? (
                                <><Award className="w-3.5 h-3.5" /> Excellent</>
                              ) : parseFloat(accuracy) >= 85 ? (
                                <><TrendingUp className="w-3.5 h-3.5" /> Good</>
                              ) : (
                                <><TrendingDown className="w-3.5 h-3.5" /> Needs Improvement</>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CoderAccuracy;
