import React, { useState } from 'react';
import { RoutesTab } from './adapters/ui/RoutesTab';
import { CompareTab } from './adapters/ui/CompareTab';
import { BankingTab } from './adapters/ui/BankingTab';
import { PoolingTab } from './adapters/ui/PoolingTab';

type Tab = 'routes' | 'compare' | 'banking' | 'pooling';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'routes', label: 'Routes', icon: '🗺️' },
    { id: 'compare', label: 'Compare', icon: '📊' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'pooling', label: 'Pooling', icon: '🤝' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header with Varuna Marine inspired colors */}
      <header className="bg-gradient-to-r from-slate-900 via-gray-800 to-slate-900 text-white shadow-2xl border-b-2 border-teal-500/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <span className="text-5xl">⚓</span>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">FuelEU Maritime Compliance</h1>
              <p className="text-teal-400 mt-2 text-lg font-medium">
                Regulation (EU) 2023/1805 - Smart Sustainable Shipping
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Tabs Navigation with Varuna colors */}
      <nav className="bg-slate-900/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-teal-500/20">
        <div className="container mx-auto px-4">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 font-semibold text-sm transition-all duration-200 flex items-center gap-2 relative ${
                  activeTab === tab.id
                    ? 'text-teal-400 bg-teal-500/10'
                    : 'text-gray-300 hover:text-teal-400 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-teal-400 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content with animation */}
      <main className="container mx-auto px-4 py-8 animate-fadeIn">
        {activeTab === 'routes' && <RoutesTab />}
        {activeTab === 'compare' && <CompareTab />}
        {activeTab === 'banking' && <BankingTab />}
        {activeTab === 'pooling' && <PoolingTab />}
      </main>

      {/* Enhanced Footer with Varuna colors */}
      <footer className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 text-gray-300 mt-16 border-t border-teal-500/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚓</span>
              <span className="font-semibold text-teal-400">FuelEU Maritime Platform</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2025 Implementing Regulation (EU) 2023/1805 - Smart Sustainable Shipping
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
