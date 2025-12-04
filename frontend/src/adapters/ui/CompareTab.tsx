import React, { useState, useEffect } from 'react';
import type { RouteComparison, RouteFilters } from '../../core/domain/models/Route';
import { RouteApiAdapter } from '../../adapters/infrastructure/RouteApiAdapter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const routeApi = new RouteApiAdapter();
const TARGET_INTENSITY = 89.3368; // 2% below 91.16 for 2025

export const CompareTab: React.FC = () => {
  const [comparisons, setComparisons] = useState<RouteComparison[]>([]);
  const [filters, setFilters] = useState<RouteFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vesselTypes = ['Container', 'BulkCarrier', 'Tanker', 'RoRo'];
  const fuelTypes = ['HFO', 'LNG', 'MGO'];
  const years = [2024, 2025, 2026];

  useEffect(() => {
    loadComparisons();
  }, [filters]);

  const loadComparisons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routeApi.getComparisons(filters);
      setComparisons(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load comparisons');
    } finally {
      setLoading(false);
    }
  };

  const chartData = comparisons.map((comp) => ({
    name: comp.comparison.routeId,
    baseline: comp.baseline.ghgIntensity,
    comparison: comp.comparison.ghgIntensity,
    target: TARGET_INTENSITY,
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-800 via-teal-900 to-slate-800 text-white p-6 rounded-xl shadow-lg border border-teal-500/30">
        <h2 className="text-3xl font-bold mb-2">📊 Route Comparison</h2>
        <p className="text-teal-300">Compare GHG intensity against baseline and target values</p>
      </div>
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-teal-500/20">

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Vessel Type
            </label>
            <select
              value={filters.vesselType || ''}
              onChange={(e) =>
                setFilters({ ...filters, vesselType: e.target.value || undefined })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-teal-500/30 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All</option>
              {vesselTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Fuel Type
            </label>
            <select
              value={filters.fuelType || ''}
              onChange={(e) =>
                setFilters({ ...filters, fuelType: e.target.value || undefined })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-teal-500/30 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All</option>
              {fuelTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Year</label>
            <select
              value={filters.year || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-teal-500/30 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-300">Loading...</div>
        ) : comparisons.length === 0 ? (
          <div className="text-center py-8 text-gray-300">
            No baseline set or no comparisons available
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                GHG Intensity Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft' }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #14b8a6', color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                  <Bar dataKey="baseline" fill="#14b8a6" name="Baseline" />
                  <Bar dataKey="comparison" fill="#10b981" name="Comparison" />
                  <Bar dataKey="target" fill="#ef4444" name="Target (89.34)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-teal-500/30">
              <table className="min-w-full divide-y divide-teal-500/20">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                      Baseline Intensity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                      Comparison Intensity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                      % Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                      Compliant
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/50 divide-y divide-teal-500/10">
                  {comparisons.map((comp) => (
                    <tr key={comp.comparison.routeId} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                        {comp.comparison.routeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {comp.baseline.ghgIntensity.toFixed(2)} gCO₂e/MJ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {comp.comparison.ghgIntensity.toFixed(2)} gCO₂e/MJ
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          comp.percentDiff < 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {comp.percentDiff > 0 ? '+' : ''}
                        {comp.percentDiff.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {comp.compliant ? (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded">
                            ✓ Compliant
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                            ✗ Non-Compliant
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
