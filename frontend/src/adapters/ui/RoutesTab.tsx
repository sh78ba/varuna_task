import React, { useState, useEffect } from 'react';
import type { Route, RouteFilters } from '../../core/domain/models/Route';
import { RouteApiAdapter } from '../../adapters/infrastructure/RouteApiAdapter';

const routeApi = new RouteApiAdapter();

export const RoutesTab: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filters, setFilters] = useState<RouteFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const vesselTypes = ['Container', 'BulkCarrier', 'Tanker', 'RoRo'];
  const fuelTypes = ['HFO', 'LNG', 'MGO'];
  const years = [2024, 2025, 2026];

  useEffect(() => {
    loadRoutes();
  }, [filters]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routeApi.getRoutes(filters);
      setRoutes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleSetBaseline = async (routeId: string) => {
    try {
      setError(null);
      setSuccess(null);
      await routeApi.setBaseline(routeId);
      setSuccess(`Route ${routeId} set as baseline`);
      loadRoutes();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set baseline');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-slate-800 via-teal-900 to-slate-800 text-white p-6 rounded-xl shadow-lg border border-teal-500/30">
        <h2 className="text-3xl font-bold mb-2">🗺️ Route Management</h2>
        <p className="text-teal-300">Manage vessel routes and set baseline configurations</p>
      </div>

      <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-teal-500/20">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              🚢 Vessel Type
            </label>
            <select
              value={filters.vesselType || ''}
              onChange={(e) =>
                setFilters({ ...filters, vesselType: e.target.value || undefined })
              }
              className="w-full px-4 py-3 bg-slate-700 border-2 border-teal-500/30 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">All Vessels</option>
              {vesselTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              ⛽ Fuel Type
            </label>
            <select
              value={filters.fuelType || ''}
              onChange={(e) =>
                setFilters({ ...filters, fuelType: e.target.value || undefined })
              }
              className="w-full px-4 py-3 bg-slate-700 border-2 border-teal-500/30 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">All Fuels</option>
              {fuelTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">📅 Year</label>
            <select
              value={filters.year || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-3 bg-slate-700 border-2 border-teal-500/30 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg animate-slideIn">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg animate-slideIn">
            <div className="flex items-center">
              <span className="text-xl mr-2">✅</span>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-300 font-medium">Loading routes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-teal-500/30">
            <table className="min-w-full divide-y divide-teal-500/20">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Route ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Vessel Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Fuel Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-teal-400 uppercase tracking-wider">
                    GHG Intensity (gCO₂e/MJ)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Fuel (t)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Distance (km)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Emissions (t)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-teal-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/50 divide-y divide-teal-500/10">
                {routes.map((route) => (
                  <tr 
                    key={route.id} 
                    className={`transition-all hover:bg-slate-700/50 ${route.isBaseline ? 'bg-teal-900/20 hover:bg-teal-900/30' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-200">
                      {route.routeId}
                      {route.isBaseline && (
                        <span className="ml-2 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 rounded-full">
                          ⭐ Baseline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {route.vesselType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="px-2 py-1 bg-slate-700 text-teal-300 rounded-md font-medium">
                        {route.fuelType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {route.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-teal-400">
                      {route.ghgIntensity.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {route.fuelConsumption.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {route.distance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {route.totalEmissions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleSetBaseline(route.routeId)}
                        disabled={route.isBaseline}
                        className={`px-5 py-2 rounded-lg font-semibold transition-all ${
                          route.isBaseline
                            ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 hover:from-teal-600 hover:to-teal-500 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {route.isBaseline ? '✓ Baseline' : 'Set Baseline'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {routes.length === 0 && !loading && (
          <div className="text-center py-12">
            <span className="text-6xl">🔍</span>
            <p className="mt-4 text-gray-400 font-medium">No routes found</p>
          </div>
        )}
      </div>
    </div>
  );
};
