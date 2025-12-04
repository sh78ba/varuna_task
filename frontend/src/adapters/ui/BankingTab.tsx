import React, { useState, useEffect } from 'react';
import type { ComplianceBalance } from '../../core/domain/models/ComplianceBalance';
import type { BankEntry, BankingSummary } from '../../core/domain/models/BankEntry';
import { ComplianceApiAdapter } from '../../adapters/infrastructure/ComplianceApiAdapter';
import { BankingApiAdapter } from '../../adapters/infrastructure/BankingApiAdapter';

const complianceApi = new ComplianceApiAdapter();
const bankingApi = new BankingApiAdapter();

export const BankingTab: React.FC = () => {
  const [shipId, setShipId] = useState('SHIP001');
  const [year, setYear] = useState(2024);
  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [bankRecords, setBankRecords] = useState<BankEntry[]>([]);
  const [bankAmount, setBankAmount] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [lastSummary, setLastSummary] = useState<BankingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ships = ['SHIP001', 'SHIP002', 'SHIP003', 'SHIP004'];
  const years = [2024, 2025, 2026];

  useEffect(() => {
    loadData();
  }, [shipId, year]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cbData, records] = await Promise.all([
        complianceApi.getComplianceBalance(shipId, year),
        bankingApi.getBankRecords(shipId, year),
      ]);

      setCb(cbData);
      setBankRecords(records);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBankSurplus = async () => {
    try {
      setError(null);
      setSuccess(null);

      const amount = parseFloat(bankAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid positive amount');
        return;
      }

      await bankingApi.bankSurplus(shipId, year, amount);
      setSuccess(`Successfully banked ${amount.toFixed(2)} gCO₂eq`);
      setBankAmount('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to bank surplus');
    }
  };

  const handleApplyBanked = async () => {
    try {
      setError(null);
      setSuccess(null);

      const amount = parseFloat(applyAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid positive amount');
        return;
      }

      const summary = await bankingApi.applyBanked(shipId, year, amount);
      setLastSummary(summary);
      setSuccess(`Successfully applied ${amount.toFixed(2)} gCO₂eq from banked surplus`);
      setApplyAmount('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to apply banked surplus');
    }
  };

  const availableBanked = bankRecords
    .filter((r) => !r.isApplied)
    .reduce((sum, r) => sum + r.amountGco2eq, 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 p-6 rounded-lg border border-teal-500/30">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-teal-500 bg-clip-text text-transparent mb-4">Banking (Article 20)</h2>

        {/* Ship and Year Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Ship ID</label>
            <select
              value={shipId}
              onChange={(e) => setShipId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-teal-500/30 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {ships.map((ship) => (
                <option key={ship} value={ship}>
                  {ship}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-teal-500/30 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-300">Loading...</div>
        ) : (
          <>
            {/* Current Compliance Balance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-teal-500/20">
                <div className="text-sm text-gray-300 mb-1">Current CB</div>
                <div
                  className={`text-2xl font-bold ${
                    cb && cb.cbGco2eq >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {cb ? cb.cbGco2eq.toFixed(2) : 'N/A'} gCO₂eq
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {cb && cb.cbGco2eq >= 0 ? 'Surplus' : 'Deficit'}
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20">
                <div className="text-sm text-gray-300 mb-1">Available Banked</div>
                <div className="text-2xl font-bold text-purple-400">
                  {availableBanked.toFixed(2)} gCO₂eq
                </div>
                <div className="text-xs text-gray-400 mt-1">Not yet applied</div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg border border-orange-500/20">
                <div className="text-sm text-gray-300 mb-1">Total Records</div>
                <div className="text-2xl font-bold text-orange-400">{bankRecords.length}</div>
                <div className="text-xs text-gray-400 mt-1">Banking transactions</div>
              </div>
            </div>

            {/* Last Summary (if available) */}
            {lastSummary && (
              <div className="bg-slate-900/50 p-4 rounded-lg border border-teal-500/20 mb-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Last Operation Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-300">CB Before:</span>{' '}
                    <span className="font-semibold text-gray-200">{lastSummary.cbBefore.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">Applied:</span>{' '}
                    <span className="font-semibold text-gray-200">{lastSummary.applied.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">CB After:</span>{' '}
                    <span className="font-semibold text-gray-200">{lastSummary.cbAfter.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Bank Surplus */}
              <div className="border border-teal-500/30 p-4 rounded-lg bg-slate-900/30">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Bank Positive CB</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={bankAmount}
                    onChange={(e) => setBankAmount(e.target.value)}
                    placeholder="Amount (gCO₂eq)"
                    className="w-full px-3 py-2 bg-slate-700 border border-teal-500/30 text-gray-200 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={handleBankSurplus}
                    disabled={!cb || cb.cbGco2eq <= 0}
                    className={`w-full px-4 py-2 rounded ${
                      !cb || cb.cbGco2eq <= 0
                        ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700'
                    }`}
                  >
                    Bank Surplus
                  </button>
                  {cb && cb.cbGco2eq <= 0 && (
                    <p className="text-xs text-red-400">No surplus available to bank</p>
                  )}
                </div>
              </div>

              {/* Apply Banked */}
              <div className="border border-teal-500/30 p-4 rounded-lg bg-slate-900/30">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Apply Banked Surplus</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={applyAmount}
                    onChange={(e) => setApplyAmount(e.target.value)}
                    placeholder="Amount (gCO₂eq)"
                    className="w-full px-3 py-2 bg-slate-700 border border-teal-500/30 text-gray-200 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={handleApplyBanked}
                    disabled={availableBanked <= 0}
                    className={`w-full px-4 py-2 rounded ${
                      availableBanked <= 0
                        ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    Apply Banked
                  </button>
                  {availableBanked <= 0 && (
                    <p className="text-xs text-red-400">No banked surplus available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Records Table */}
            <div className="overflow-x-auto rounded-lg border border-teal-500/30">
              <h3 className="text-lg font-semibold text-gray-200 mb-3">Banking Records</h3>
              <table className="min-w-full divide-y divide-teal-500/20">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-teal-400 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/50 divide-y divide-teal-500/10">
                  {bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-300">
                        No banking records found
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-700/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                          {record.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {record.amountGco2eq.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.isApplied ? (
                            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded">
                              Applied
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
