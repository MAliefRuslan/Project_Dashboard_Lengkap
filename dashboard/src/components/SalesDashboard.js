'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend 
} from 'recharts';
import { Filter, TrendingUp, ShoppingBag, Calendar } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

// Helper to convert Excel Serial Date to JS Date
function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  // Excel epoch is Jan 1, 1900. 25569 days to Jan 1, 1970.
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  return new Date(utc_value * 1000);
}

function getMonthYearStr(serial) {
  const date = excelDateToJSDate(serial);
  if (!date) return 'Unknown';
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function getDayStr(serial) {
  const date = excelDateToJSDate(serial);
  if (!date) return 'Unknown';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function SalesDashboard({ masterData }) {
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');

  // Add parsed date properties to data
  const processedData = useMemo(() => {
    return masterData.map(d => {
      const monthYear = getMonthYearStr(d.SalesDate);
      const day = getDayStr(d.SalesDate);
      return { ...d, monthYear, day, qtyNum: Number(d.Qty) || 0 };
    });
  }, [masterData]);

  // Extract unique branches and months
  const branches = useMemo(() => {
    const b = new Set(processedData.map(d => d.Branch).filter(Boolean));
    return ['All', ...Array.from(b)];
  }, [processedData]);

  const months = useMemo(() => {
    const m = new Set(processedData.map(d => d.monthYear).filter(val => val !== 'Unknown'));
    // Sort logic could be added here if needed
    return ['All', ...Array.from(m)];
  }, [processedData]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return processedData.filter(d => {
      const matchBranch = selectedBranch === 'All' || d.Branch === selectedBranch;
      const matchMonth = selectedMonth === 'All' || d.monthYear === selectedMonth;
      return matchBranch && matchMonth;
    });
  }, [processedData, selectedBranch, selectedMonth]);

  // Metrics
  const totalItemsSold = useMemo(() => filteredData.reduce((sum, d) => sum + d.qtyNum, 0), [filteredData]);

  // Daily Trend Data (Line Chart)
  const trendData = useMemo(() => {
    const dailyMap = {};
    filteredData.forEach(d => {
      if (d.SalesDate) {
        dailyMap[d.SalesDate] = (dailyMap[d.SalesDate] || 0) + d.qtyNum;
      }
    });
    // Sort by serial date
    return Object.entries(dailyMap)
      .map(([serial, qty]) => ({ serial: Number(serial), qty, day: getDayStr(Number(serial)) }))
      .sort((a, b) => a.serial - b.serial);
  }, [filteredData]);

  // Branch Distribution Data (Pie Chart)
  const branchDistData = useMemo(() => {
    const bMap = {};
    filteredData.forEach(d => {
      const b = d.Branch || 'Unknown';
      bMap[b] = (bMap[b] || 0) + d.qtyNum;
    });
    return Object.entries(bMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Top Menus
  const topMenus = useMemo(() => {
    const menuMap = {};
    filteredData.forEach(d => {
      menuMap[d.Menu] = (menuMap[d.Menu] || 0) + d.qtyNum;
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
      const cat = d.Category || 'Lainnya';
      catMap[cat] = (catMap[cat] || 0) + d.qtyNum;
    });
    return Object.entries(catMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredData]);

  return (
    <div className="glass-card animate-fade-in mb-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="text-accent" />
            <span className="header-gradient">Performance Overview</span>
          </h2>
          <p className="text-secondary text-sm">Analisa penjualan komprehensif untuk evaluasi bisnis</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
            <Calendar size={16} className="text-secondary ml-1" />
            <select 
              className="input-control !bg-transparent !border-none !py-1" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">Semua Bulan</option>
              {months.filter(m => m !== 'All').map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
            <Filter size={16} className="text-secondary ml-1" />
            <select 
              className="input-control !bg-transparent !border-none !py-1" 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="All">Semua Cabang</option>
              {branches.filter(b => b !== 'All').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card flex items-center gap-4 border-l-4" style={{ borderLeftColor: 'var(--accent-color)' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <ShoppingBag className="text-accent" size={24} />
          </div>
          <div>
            <p className="text-sm text-secondary">Total Porsi Terjual</p>
            <p className="text-3xl font-bold">{totalItemsSold.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-card md:col-span-2">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Top 5 Menu Paling Laris</h3>
          <div className="flex flex-col gap-3">
            {topMenus.map((m, i) => (
              <div key={m.name} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-accent w-6" style={{ opacity: 1 - i * 0.15 }}>#{i + 1}</span>
                  <span className="font-medium group-hover:text-accent transition-colors">{m.name}</span>
                </div>
                <span className="font-semibold">{m.qty.toLocaleString()} porsi</span>
              </div>
            ))}
            {topMenus.length === 0 && <p className="text-secondary text-sm">Tidak ada data untuk filter ini.</p>}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        
        {/* Daily Trend Chart */}
        <div className="glass-card flex flex-col">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Tren Penjualan Harian</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--card-shadow)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="qty" 
                  name="Porsi Terjual"
                  stroke="var(--accent-color)" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: 'var(--bg-primary)', strokeWidth: 2 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Distribution Pie Chart */}
        <div className="glass-card flex flex-col">
          <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Kontribusi Penjualan per Cabang</h3>
          <div style={{ height: 300, width: '100%' }}>
            {branchDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {branchDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--card-shadow)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value) => [`${value.toLocaleString()} porsi`, 'Penjualan']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-secondary">
                Data tidak tersedia
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Category Bar Chart */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold text-secondary mb-4 uppercase tracking-wider">Penjualan Berdasarkan Kategori</h3>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--card-shadow)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                formatter={(value) => [`${value.toLocaleString()} porsi`, 'Terjual']}
              />
              <Bar dataKey="qty" name="Porsi Terjual" radius={[4, 4, 0, 0]}>
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
