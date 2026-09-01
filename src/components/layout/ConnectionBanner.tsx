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
    <div className="bg-rose-600/90 backdrop-blur-md text-white px-4 py-2 flex items-center justify-between text-sm font-medium sticky top-0 z-50 shadow-lg animate-pulse">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>
          {status === 'CONNECTING'
            ? 'Connecting to live auction synchronization network...'
            : 'Connection Lost. Live bidding paused. Reconnecting automatically...'}
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition active:scale-95"
        >
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Re-sync Now</span>
        </button>
      )}
    </div>
  );
}
