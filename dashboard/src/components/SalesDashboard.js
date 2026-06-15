'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Filter, TrendingUp, ShoppingBag } from 'lucide-react';

export default function SalesDashboard({ masterData }) {
  const [selectedBranch, setSelectedBranch] = useState('All');

  // Extract unique branches
  const branches = useMemo(() => {
    const b = new Set(masterData.map(d => d.Branch).filter(Boolean));
    return ['All', ...Array.from(b)];
  }, [masterData]);

  // Filter data
  const filteredData = useMemo(() => {
    if (selectedBranch === 'All') return masterData;
    return masterData.filter(d => d.Branch === selectedBranch);
  }, [masterData, selectedBranch]);

  // Metrics
  const totalItemsSold = useMemo(() => filteredData.reduce((sum, d) => sum + Number(d.Qty), 0), [filteredData]);

  // Top Menus
  const topMenus = useMemo(() => {
    const menuMap = {};
    filteredData.forEach(d => {
      menuMap[d.Menu] = (menuMap[d.Menu] || 0) + Number(d.Qty);
    });
    return Object.entries(menuMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredData]);

  // Category Sales Data
  const categoryData = useMemo(() => {
    const catMap = {};
    filteredData.forEach(d => {
      const cat = d.Category || 'Unknown';
      catMap[cat] = (catMap[cat] || 0) + Number(d.Qty);
    });
    return Object.entries(catMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredData]);

  return (
    <div className="glass-card animate-fade-in mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="text-accent" />
            <span className="header-gradient">Sales Overview</span>
          </h2>
          <p className="text-secondary text-sm">Monitor your best sellers and volume</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-secondary" />
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

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card flex items-center gap-4">
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <ShoppingBag className="text-accent" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary">Total Items Sold</p>
            <p className="text-2xl font-bold">{totalItemsSold.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-card md:col-span-2">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Top 5 Menus</h3>
          <div className="flex flex-col gap-3">
            {topMenus.map((m, i) => (
              <div key={m.name} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-accent" style={{ opacity: 1 - i * 0.15 }}>#{i + 1}</span>
                  <span className="font-medium">{m.name}</span>
                </div>
                <span className="font-semibold">{m.qty.toLocaleString()} pcs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Sales by Category</h3>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.2)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--card-shadow)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
              <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-color)' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
