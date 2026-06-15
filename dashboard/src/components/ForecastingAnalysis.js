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
    // 1. Filter Master Data
    const dataToProcess = selectedBranch === 'All' 
      ? masterData 
      : masterData.filter(d => d.Branch === selectedBranch);

    // 2. Aggregate Qty Sold by Menu
    const menuSales = {};
    dataToProcess.forEach(d => {
      menuSales[d.Menu] = (menuSales[d.Menu] || 0) + Number(d.Qty);
    });

    // 3. Calculate Ingredient Usage
    const ingredientUsage = {};
    bomMenu.forEach(bomRow => {
      const menuName = bomRow['MENU'];
      const qtySold = menuSales[menuName];
      
      if (qtySold && qtySold > 0) {
        // Iterate over ingredient columns (all keys except 'MENU')
        Object.keys(bomRow).forEach(key => {
          if (key !== 'MENU' && bomRow[key]) {
            const amountPerMenu = Number(bomRow[key]);
            if (!isNaN(amountPerMenu)) {
              ingredientUsage[key] = (ingredientUsage[key] || 0) + (qtySold * amountPerMenu);
            }
          }
        });
      }
    });

    // 4. Compare with Stock
    const stokMap = {};
    stokData.forEach(s => {
      // Assuming columns are 'BAHAN' and 'STOK' based on our inspection
      stokMap[s['BAHAN']] = Number(s['STOK']) || 0;
    });

    const result = [];
    
    // Process all ingredients that were used OR exist in stock
    const allIngredients = new Set([...Object.keys(ingredientUsage), ...Object.keys(stokMap)]);
    
    allIngredients.forEach(ingredient => {
      const used = ingredientUsage[ingredient] || 0;
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
            <span className="header-gradient">Ingredient Forecasting</span>
          </h2>
          <p className="text-secondary text-sm">Analyze stock usage and restocking needs based on sales</p>
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
            <span>Attention: {itemsToRestock} ingredients need to be restocked!</span>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl border border-green-200" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div className="flex items-center gap-3 text-success font-semibold">
            <CheckCircle size={20} />
            <span>Stock levels are healthy. No immediate restock needed.</span>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Current Stock</th>
              <th>Forecasted Usage</th>
              <th>Remaining</th>
              <th>Restock Amount</th>
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
                    <span className="badge badge-danger">Needs Restock</span>
                  ) : (
                    <span className="badge badge-success">Sufficient</span>
                  )}
                </td>
              </tr>
            ))}
            {forecast.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-secondary">
                  No ingredient data available for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
