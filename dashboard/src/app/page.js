'use client';

import React, { useEffect, useState } from 'react';
import SalesDashboard from '@/components/SalesDashboard';
import ForecastingAnalysis from '@/components/ForecastingAnalysis';
import { Database } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('Failed to fetch data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="loader"></div>
        <p className="text-secondary font-medium">Processing your data. This might take a moment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="glass-card text-center" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <p className="text-danger font-bold text-xl mb-2">Error Loading Data</p>
          <p className="text-secondary">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="container">
      <header className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <Database className="text-accent" size={28} />
          </div>
          <h1 className="text-2xl font-bold header-gradient" style={{ fontSize: '2rem' }}>
            Business Intelligence
          </h1>
        </div>
        <p className="text-secondary text-lg ml-14">
          Interactive sales analytics and ingredient forecasting
        </p>
      </header>

      {data && (
        <>
          <SalesDashboard masterData={data.masterData} />
          <ForecastingAnalysis 
            masterData={data.masterData} 
            bomMenu={data.bomMenu} 
            stokData={data.stok} 
          />
        </>
      )}
    </main>
  );
}
