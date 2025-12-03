import React, { useState, useEffect } from 'react';
import { RouteComparison, RouteFilters } from '../../core/domain/models/Route';
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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Compare Routes</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vessel Type
            </label>
            <select
              value={filters.vesselType || ''}
              onChange={(e) =>
                setFilters({ ...filters, vesselType: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Type
            </label>
            <select
              value={filters.fuelType || ''}
              onChange={(e) =>
                setFilters({ ...filters, fuelType: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={filters.year || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : comparisons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No baseline set or no comparisons available
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                GHG Intensity Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="baseline" fill="#3b82f6" name="Baseline" />
                  <Bar dataKey="comparison" fill="#10b981" name="Comparison" />
                  <Bar dataKey="target" fill="#ef4444" name="Target (89.34)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Baseline Intensity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comparison Intensity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Difference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compliant
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisons.map((comp) => (
                    <tr key={comp.comparison.routeId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {comp.comparison.routeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comp.baseline.ghgIntensity.toFixed(2)} gCO₂e/MJ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comp.comparison.ghgIntensity.toFixed(2)} gCO₂e/MJ
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          comp.percentDiff < 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {comp.percentDiff > 0 ? '+' : ''}
                        {comp.percentDiff.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {comp.compliant ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            ✓ Compliant
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
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
