'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '@/hooks/useAuctionSync';

interface ConnectionBannerProps {
  status: ConnectionStatus;
  onRetry?: () => void;
}

export function ConnectionBanner({ status, onRetry }: ConnectionBannerProps) {
  if (status === 'CONNECTED') return null;

  return (
    <div className="bg-red-50 border-b border-red-200 text-red-800 px-4 py-2 flex items-center justify-between text-xs font-medium sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-red-600 shrink-0" />
        <span>
          {status === 'CONNECTING'
            ? 'Connecting to live auction synchronization network...'
            : 'Connection Lost. Live bidding paused. Reconnecting automatically...'}
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded-md text-xs font-semibold transition active:scale-[0.98]"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-700" />
          <span>Re-sync Now</span>
        </button>
      )}
    </div>
  );
}
