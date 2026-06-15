'use client';

import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, Clock, Target, ShieldCheck } from 'lucide-react';

// Helper to convert Excel Serial Date to JS Date
function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  return new Date(utc_value * 1000);
}

const formatRp = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const DAYS_IN_INDONESIAN = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function BusinessInsights({ masterData }) {
  const insights = useMemo(() => {
    if (!masterData || masterData.length === 0) return null;

    let totalRevenue = 0;
    const dayMap = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
    const branchMap = {};
    const paymentMap = {};
    const categoryMap = {};
    const menuMap = {};

    masterData.forEach(d => {
      const rev = Number(d.Total) || 0;
      totalRevenue += rev;

      // Date parsing for day of week
      const date = excelDateToJSDate(d.SalesDate);
      if (date) {
        dayMap[date.getDay()] += rev;
      }

      // Branch
      const branch = d.Branch || 'Unknown';
      branchMap[branch] = (branchMap[branch] || 0) + rev;

      // Payment
      const pay = d.PaymentMethod || 'Unknown';
      paymentMap[pay] = (paymentMap[pay] || 0) + rev;

      // Category
      const cat = d.Category || 'Unknown';
      categoryMap[cat] = (categoryMap[cat] || 0) + rev;

      // Menu
      const menu = d.Menu || 'Unknown';
      menuMap[menu] = (menuMap[menu] || 0) + rev;
    });

    // 1. Time Insights
    let bestDayIdx = 0;
    let worstDayIdx = 0;
    for (let i = 1; i < 7; i++) {
      if (dayMap[i] > dayMap[bestDayIdx]) bestDayIdx = i;
      if (dayMap[i] < dayMap[worstDayIdx] && dayMap[i] > 0) worstDayIdx = i; 
      // added > 0 check to ignore days with no data at all if any
    }
    const bestDay = DAYS_IN_INDONESIAN[bestDayIdx];
    const worstDay = DAYS_IN_INDONESIAN[worstDayIdx];

    // 2. Branch Insights
    const topBranch = Object.entries(branchMap).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

    // 3. Payment Insights
    const topPayment = Object.entries(paymentMap).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
    const topPaymentPercentage = totalRevenue > 0 ? ((topPayment[1] / totalRevenue) * 100).toFixed(1) : 0;

    // 4. Product Insights
    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
    const topMenus = Object.entries(menuMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(m => m[0]);

    return {
      bestDay, worstDay, 
      topBranchName: topBranch[0], 
      topPaymentName: topPayment[0], topPaymentPercentage,
      topCategoryName: topCategory[0],
      topMenus
    };
  }, [masterData]);

  if (!insights) return null;

  return (
    <div className="glass-card animate-fade-in mt-8 mb-8" style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}>
      <div className="flex items-center gap-3 mb-6">
        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
          <Lightbulb className="text-emerald-400" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-emerald-400">Rekomendasi & Insight Bisnis</h2>
          <p className="text-secondary text-sm">Analisa AI otomatis berdasarkan data operasional Anda</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Card 1: Time */}
        <div className="glass-card flex flex-col gap-3 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={100} />
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={20} />
            <h3 className="font-bold text-white">Analisa Waktu (Trafik)</h3>
          </div>
          <p className="text-secondary text-sm leading-relaxed">
            Hari <strong className="text-white">{insights.bestDay}</strong> adalah puncak keramaian (Peak Day) restoran Anda. Sebaliknya, omset terendah sering terjadi di hari <strong className="text-white">{insights.worstDay}</strong>.
          </p>
          <div className="mt-auto pt-3 border-t border-white/5">
            <p className="text-emerald-400 text-sm font-semibold flex items-start gap-2">
              <span>💡</span>
              <span>Saran: Buat promo khusus "Paket Hemat {insights.worstDay}" untuk mendongkrak penjualan di hari sepi. Pastikan jadwal shift karyawan diperbanyak di hari {insights.bestDay}.</span>
            </p>
          </div>
        </div>

        {/* Card 2: Operations */}
        <div className="glass-card flex flex-col gap-3 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={100} />
          </div>
          <div className="flex items-center gap-2">
            <Target className="text-blue-400" size={20} />
            <h3 className="font-bold text-white">Operasional Cabang</h3>
          </div>
          <p className="text-secondary text-sm leading-relaxed">
            <strong className="text-white">{insights.topBranchName}</strong> saat ini menjadi "Ujung Tombak" yang menyumbang pendapatan tertinggi. Di sisi lain, <strong className="text-white">{insights.topPaymentPercentage}%</strong> pelanggan Anda lebih suka membayar menggunakan <strong className="text-white">{insights.topPaymentName}</strong>.
          </p>
          <div className="mt-auto pt-3 border-t border-white/5">
            <p className="text-blue-400 text-sm font-semibold flex items-start gap-2">
              <span>💡</span>
              <span>Saran: Terapkan SOP sukses dari {insights.topBranchName} ke cabang lain. Pastikan sistem/mesin {insights.topPaymentName} Anda selalu prima dan tidak ada gangguan koneksi.</span>
            </p>
          </div>
        </div>

        {/* Card 3: Products */}
        <div className="glass-card flex flex-col gap-3 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={100} />
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-orange-400" size={20} />
            <h3 className="font-bold text-white">Kekuatan Produk</h3>
          </div>
          <p className="text-secondary text-sm leading-relaxed">
            Kategori <strong className="text-white">{insights.topCategoryName}</strong> adalah magnet utama konsumen Anda. Menu Pahlawan Anda saat ini adalah: <strong className="text-white">{insights.topMenus.join(', ')}</strong>.
          </p>
          <div className="mt-auto pt-3 border-t border-white/5">
            <p className="text-orange-400 text-sm font-semibold flex items-start gap-2">
              <span>💡</span>
              <span>Saran: Beritahu tim Dapur/Gudang (BOM) untuk memprioritaskan ketersediaan bahan baku untuk ketiga menu tersebut. Jangan sampai kehabisan karena itu adalah sumber uang utama Anda!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
