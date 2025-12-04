import React, { useState, useEffect } from 'react';
import type { AdjustedComplianceBalance } from '../../core/domain/models/ComplianceBalance';
import type { Pool, CreatePoolRequest } from '../../core/domain/models/Pool';
import { ComplianceApiAdapter } from '../../adapters/infrastructure/ComplianceApiAdapter';
import { PoolApiAdapter } from '../../adapters/infrastructure/PoolApiAdapter';

const complianceApi = new ComplianceApiAdapter();
const poolApi = new PoolApiAdapter();

interface ShipSelection {
  shipId: string;
  selected: boolean;
  adjustedCb: AdjustedComplianceBalance | null;
}

export const PoolingTab: React.FC = () => {
  const [year, setYear] = useState(2024);
  const [ships, setShips] = useState<ShipSelection[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableShips = ['SHIP001', 'SHIP002', 'SHIP003', 'SHIP004'];
  const years = [2024, 2025, 2026];

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [adjustedCbs, poolsData] = await Promise.all([
        Promise.all(
          availableShips.map(async (shipId) => {
            try {
              const cb = await complianceApi.getAdjustedComplianceBalance(shipId, year);
              return { shipId, selected: false, adjustedCb: cb };
            } catch {
              return { shipId, selected: false, adjustedCb: null };
            }
          })
        ),
        poolApi.getPoolsByYear(year),
      ]);

      setShips(adjustedCbs);
      setPools(poolsData);
    } catch (err: any) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleShipSelection = (shipId: string) => {
    setShips((prev) =>
      prev.map((ship) =>
        ship.shipId === shipId ? { ...ship, selected: !ship.selected } : ship
      )
    );
  };

  const selectedShips = ships.filter((s) => s.selected && s.adjustedCb);
  const totalCb = selectedShips.reduce((sum, s) => sum + (s.adjustedCb?.adjustedCb || 0), 0);
  const canCreatePool = selectedShips.length >= 2 && totalCb >= 0;

  const handleCreatePool = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!canCreatePool) {
        setError('Pool requirements not met: need at least 2 ships and total CB ≥ 0');
        return;
      }

      const request: CreatePoolRequest = {
        year,
        members: selectedShips.map((s) => ({
          shipId: s.shipId,
          cbBefore: s.adjustedCb!.adjustedCb,
        })),
      };

      const pool = await poolApi.createPool(request);
      setSuccess(`Pool created successfully with ID: ${pool.id}`);
      
      // Reset selections
      setShips((prev) => prev.map((s) => ({ ...s, selected: false })));
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create pool');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-800 via-teal-900 to-slate-800 text-white p-6 rounded-xl shadow-lg border border-teal-500/30">
        <h2 className="text-3xl font-bold mb-2">🤝 Compliance Pooling</h2>
        <p className="text-teal-300">Create and manage ship compliance pools for balanced distribution</p>
      </div>
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-teal-500/20">

        {/* Year Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-200 mb-2">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-300">Loading...</div>
        ) : (
          <>
            {/* Ship Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-3">
                Select Ships for Pool
              </h3>
              <div className="overflow-x-auto rounded-lg border border-teal-500/30">
                <table className="min-w-full divide-y divide-teal-500/20">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                        Ship ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                        Original CB
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                        Banked Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                        Adjusted CB
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800/50 divide-y divide-teal-500/10">
                    {ships.map((ship) => (
                      <tr
                        key={ship.shipId}
                        className={ship.selected ? 'bg-teal-900/20' : 'hover:bg-slate-700/50'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={ship.selected}
                            onChange={() => toggleShipSelection(ship.shipId)}
                            disabled={!ship.adjustedCb}
                            className="h-4 w-4 text-teal-500 focus:ring-teal-500 border-teal-500/30 rounded bg-slate-700"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                          {ship.shipId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {ship.adjustedCb
                            ? ship.adjustedCb.originalCb.toFixed(2)
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {ship.adjustedCb
                            ? ship.adjustedCb.bankedAmount.toFixed(2)
                            : 'N/A'}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            ship.adjustedCb && ship.adjustedCb.adjustedCb >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {ship.adjustedCb
                            ? ship.adjustedCb.adjustedCb.toFixed(2)
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {ship.adjustedCb ? (
                            ship.adjustedCb.adjustedCb >= 0 ? (
                              <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded">
                                Surplus
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                                Deficit
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded">
                              No Data
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pool Summary */}
            {selectedShips.length > 0 && (
              <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-teal-500/20">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Pool Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-300">Ships Selected</div>
                    <div className="text-2xl font-bold text-teal-400">
                      {selectedShips.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">Total CB</div>
                    <div
                      className={`text-2xl font-bold ${
                        totalCb >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {totalCb.toFixed(2)} gCO₂eq
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">Pool Validation</div>
                    <div className="text-2xl font-bold">
                      {canCreatePool ? (
                        <span className="text-green-400">✓ Valid</span>
                      ) : (
                        <span className="text-red-400">✗ Invalid</span>
                      )}
                    </div>
                  </div>
                </div>

                {!canCreatePool && (
                  <div className="mt-3 text-sm text-red-400">
                    {selectedShips.length < 2 && '• Need at least 2 ships'}
                    {selectedShips.length >= 2 && totalCb < 0 && '• Total CB must be ≥ 0'}
                  </div>
                )}

                <button
                  onClick={handleCreatePool}
                  disabled={!canCreatePool}
                  className={`mt-4 w-full px-4 py-2 rounded ${
                    canCreatePool
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700'
                      : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Create Pool
                </button>
              </div>
            )}

            {/* Existing Pools */}
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-3">Existing Pools</h3>
              {pools.length === 0 ? (
                <div className="text-center py-8 text-gray-300">
                  No pools created for {year} yet
                </div>
              ) : (
                <div className="space-y-4">
                  {pools.map((pool) => (
                    <div key={pool.id} className="border border-teal-500/30 rounded-lg p-4 bg-slate-900/50">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className="text-sm text-gray-300">Pool ID:</span>{' '}
                          <span className="font-semibold text-gray-200">{pool.id}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(pool.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-teal-500/20">
                        <table className="min-w-full divide-y divide-teal-500/20">
                          <thead className="bg-slate-800/50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-teal-400 uppercase">
                                Ship ID
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-teal-400 uppercase">
                                CB Before
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-teal-400 uppercase">
                                CB After
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-teal-400 uppercase">
                                Change
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-slate-900/30 divide-y divide-teal-500/10">
                            {pool.members.map((member) => (
                              <tr key={member.id} className="hover:bg-slate-700/30">
                                <td className="px-4 py-2 text-sm font-medium text-gray-200">
                                  {member.shipId}
                                </td>
                                <td
                                  className={`px-4 py-2 text-sm ${
                                    member.cbBefore >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}
                                >
                                  {member.cbBefore.toFixed(2)}
                                </td>
                                <td
                                  className={`px-4 py-2 text-sm ${
                                    member.cbAfter >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}
                                >
                                  {member.cbAfter.toFixed(2)}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-300">
                                  {(member.cbAfter - member.cbBefore) >= 0 ? '+' : ''}
                                  {(member.cbAfter - member.cbBefore).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
