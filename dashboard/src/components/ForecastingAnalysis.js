'use client';

import React, { useState, useMemo } from 'react';
import { PackageSearch, AlertTriangle, CheckCircle, Package } from 'lucide-react';

export default function ForecastingAnalysis({ masterData, bomMenu, stokData }) {
  const [selectedBranch, setSelectedBranch] = useState('All');

  const branches = useMemo(() => {
    const b = new Set(masterData.map(d => d.Branch).filter(Boolean));
    return ['All', ...Array.from(b)];
  }, [masterData]);

  const forecast = useMemo(() => {
    // 1. Filter Master Data & Find Date Range
    let minDate = Infinity;
    let maxDate = -Infinity;
    
    const dataToProcess = selectedBranch === 'All' 
      ? masterData 
      : masterData.filter(d => d.Branch === selectedBranch);

    // 2. Aggregate Qty Sold by Menu
    const menuSales = {};
    dataToProcess.forEach(d => {
      if (d.SalesDate && typeof d.SalesDate === 'number') {
        minDate = Math.min(minDate, d.SalesDate);
        maxDate = Math.max(maxDate, d.SalesDate);
      }
      menuSales[d.Menu] = (menuSales[d.Menu] || 0) + Number(d.Qty);
    });

    // Calculate total days for daily average
    let totalDays = 1;
    if (minDate !== Infinity && maxDate !== -Infinity) {
      totalDays = maxDate - minDate + 1;
    }
    if (totalDays <= 0) totalDays = 1;

    // 3. Calculate 30-Day Forecast Ingredient Usage
    const ingredientUsage = {};
    bomMenu.forEach(bomRow => {
      const menuName = bomRow['MENU'];
      const historicalQtySold = menuSales[menuName];
      
      if (historicalQtySold && historicalQtySold > 0) {
        // Forecast next 30 days: (Historical Total / Total Days) * 30
        const forecastedQty = (historicalQtySold / totalDays) * 30;
        
        // Iterate over ingredient columns (all keys except 'MENU')
        Object.keys(bomRow).forEach(key => {
          if (key !== 'MENU' && bomRow[key]) {
            const amountPerMenu = Number(bomRow[key]);
            if (!isNaN(amountPerMenu)) {
              ingredientUsage[key] = (ingredientUsage[key] || 0) + (forecastedQty * amountPerMenu);
            }
          }
        });
      }
    });

    // 4. Compare with Stock
    const stokMap = {};
    stokData.forEach(s => {
      // Assuming columns are 'BAHAN' and 'STOK'
      stokMap[s['BAHAN']] = Number(s['STOK']) || 0;
    });

    const result = [];
    
    // Process all ingredients that were used OR exist in stock
    const allIngredients = new Set([...Object.keys(ingredientUsage), ...Object.keys(stokMap)]);
    
    allIngredients.forEach(ingredient => {
      const used = Math.ceil(ingredientUsage[ingredient] || 0); // Round up for safety
      const stock = stokMap[ingredient] || 0;
      const remaining = stock - used;
      const needsRestock = remaining < 0;
      
      result.push({
        ingredient,
        used,
        stock,
        remaining,
        needsRestock,
        restockAmount: needsRestock ? Math.abs(remaining) : 0
      });
    });

    // Sort: needs restock first, then by usage
    return result.sort((a, b) => {
      if (a.needsRestock && !b.needsRestock) return -1;
      if (!a.needsRestock && b.needsRestock) return 1;
      return b.used - a.used;
    });

  }, [masterData, bomMenu, stokData, selectedBranch]);

  const itemsToRestock = forecast.filter(f => f.needsRestock).length;

  return (
    <div className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PackageSearch className="text-accent" />
            <span className="header-gradient">Forecasting Bahan (30 Hari Kedepan)</span>
          </h2>
          <p className="text-secondary text-sm">Analisa kebutuhan bahan baku untuk bulan depan berdasarkan rata-rata penjualan</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="input-control" 
            style={{ width: '200px' }}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {itemsToRestock > 0 ? (
        <div className="mb-6 p-4 rounded-xl border border-red-200" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="flex items-center gap-3 text-danger font-semibold">
            <AlertTriangle size={20} />
            <span>Perhatian: {itemsToRestock} bahan baku akan habis dan perlu dibeli untuk bulan depan!</span>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl border border-green-200" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div className="flex items-center gap-3 text-success font-semibold">
            <CheckCircle size={20} />
            <span>Stok sangat aman. Tidak ada bahan baku yang perlu dibeli untuk bulan depan.</span>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Bahan Baku</th>
              <th>Stok Saat Ini</th>
              <th>Estimasi Kebutuhan (30 Hari)</th>
              <th>Proyeksi Sisa</th>
              <th>Jumlah Harus Dibeli</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((item, idx) => (
              <tr key={item.ingredient}>
                <td className="font-medium flex items-center gap-2">
                  <Package size={16} className="text-secondary" />
                  {item.ingredient}
                </td>
                <td>{item.stock.toLocaleString()}</td>
                <td>{item.used.toLocaleString()}</td>
                <td className={item.remaining < 0 ? "text-danger font-bold" : "font-medium"}>
                  {item.remaining.toLocaleString()}
                </td>
                <td className={item.needsRestock ? "text-danger font-bold" : "text-secondary"}>
                  {item.needsRestock ? `+${item.restockAmount.toLocaleString()}` : '-'}
                </td>
                <td>
                  {item.needsRestock ? (
                    <span className="badge badge-danger">Perlu Dibeli</span>
                  ) : (
                    <span className="badge badge-success">Aman</span>
                  )}
                </td>
              </tr>
            ))}
            {forecast.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-secondary">
                  Belum ada data bahan baku untuk kriteria ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
