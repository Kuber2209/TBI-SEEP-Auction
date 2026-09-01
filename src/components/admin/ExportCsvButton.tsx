'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export function ExportCsvButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/export');
      if (!res.ok) throw new Error('Failed to generate export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SEEP_4.0_Auction_Results_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
    >
      {isExporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400" />
      ) : (
        <Download className="w-3.5 h-3.5 text-gold-400" />
      )}
      <span>Export CSV Ledger</span>
    </button>
  );
}
