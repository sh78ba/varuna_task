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
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Banking (Article 20)</h2>

        {/* Ship and Year Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ship ID</label>
            <select
              value={shipId}
              onChange={(e) => setShipId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ships.map((ship) => (
                <option key={ship} value={ship}>
                  {ship}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Current Compliance Balance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Current CB</div>
                <div
                  className={`text-2xl font-bold ${
                    cb && cb.cbGco2eq >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {cb ? cb.cbGco2eq.toFixed(2) : 'N/A'} gCO₂eq
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {cb && cb.cbGco2eq >= 0 ? 'Surplus' : 'Deficit'}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Available Banked</div>
                <div className="text-2xl font-bold text-purple-600">
                  {availableBanked.toFixed(2)} gCO₂eq
                </div>
                <div className="text-xs text-gray-500 mt-1">Not yet applied</div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Records</div>
                <div className="text-2xl font-bold text-orange-600">{bankRecords.length}</div>
                <div className="text-xs text-gray-500 mt-1">Banking transactions</div>
              </div>
            </div>

            {/* Last Summary (if available) */}
            {lastSummary && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Last Operation Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">CB Before:</span>{' '}
                    <span className="font-semibold">{lastSummary.cbBefore.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Applied:</span>{' '}
                    <span className="font-semibold">{lastSummary.applied.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CB After:</span>{' '}
                    <span className="font-semibold">{lastSummary.cbAfter.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Bank Surplus */}
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Bank Positive CB</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={bankAmount}
                    onChange={(e) => setBankAmount(e.target.value)}
                    placeholder="Amount (gCO₂eq)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleBankSurplus}
                    disabled={!cb || cb.cbGco2eq <= 0}
                    className={`w-full px-4 py-2 rounded ${
                      !cb || cb.cbGco2eq <= 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Bank Surplus
                  </button>
                  {cb && cb.cbGco2eq <= 0 && (
                    <p className="text-xs text-red-600">No surplus available to bank</p>
                  )}
                </div>
              </div>

              {/* Apply Banked */}
              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Apply Banked Surplus</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={applyAmount}
                    onChange={(e) => setApplyAmount(e.target.value)}
                    placeholder="Amount (gCO₂eq)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleApplyBanked}
                    disabled={availableBanked <= 0}
                    className={`w-full px-4 py-2 rounded ${
                      availableBanked <= 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    Apply Banked
                  </button>
                  {availableBanked <= 0 && (
                    <p className="text-xs text-red-600">No banked surplus available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Records Table */}
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Banking Records</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (gCO₂eq)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bankRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No banking records found
                      </td>
                    </tr>
                  ) : (
                    bankRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.amountGco2eq.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.isApplied ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Applied
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
