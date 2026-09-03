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
      className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white hover:bg-[#f1f4f7] border border-[#e2e5ea] text-xs font-semibold text-[#33404f] shadow-sm transition active:scale-[0.98] disabled:opacity-50"
    >
      {isExporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a5c3e]" />
      ) : (
        <Download className="w-3.5 h-3.5 text-[#1a5c3e]" />
      )}
      <span>Export CSV Ledger</span>
    </button>
  );
}
