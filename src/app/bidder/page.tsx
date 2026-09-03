'use client';

import React, { useState } from 'react';
import { useAuctionSync } from '@/hooks/useAuctionSync';
import { usePresence } from '@/hooks/usePresence';
import { Header } from '@/components/layout/Header';
import { ConnectionBanner } from '@/components/layout/ConnectionBanner';
import { StartupHero } from '@/components/bidder/StartupHero';
import { BiddingPad } from '@/components/bidder/BiddingPad';
import { BidHistoryList } from '@/components/bidder/BidHistoryList';
import { WalletSummaryBar } from '@/components/bidder/WalletSummaryBar';
import { PortfolioDrawer } from '@/components/bidder/PortfolioDrawer';
import { PortfolioAnalytics } from '@/components/bidder/PortfolioAnalytics';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

export default function BidderPage() {
  const {
    profile,
    session,
    startups,
    activeStartup,
    bids,
    wallet,
    wonStartups,
    connectionStatus,
    refresh,
  } = useAuctionSync();

  const { bidderCount } = usePresence(profile);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center text-slate-900 dark:text-white transition-colors duration-150">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Initializing Live Auction Console...
          </p>
        </div>
      </div>
    );
  }

  const increments = session?.bid_increments || [1000, 2500, 5000, 10000];

  return (
    <ErrorBoundary fallbackTitle="Investor Console Interface Error">
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col justify-between text-slate-900 dark:text-slate-100 transition-colors duration-150">
        {/* Top Section */}
        <div>
          <ConnectionBanner status={connectionStatus} onRetry={refresh} />

          <Header
            profile={profile}
            sessionStatus={session?.status}
            isRehearsal={session?.is_rehearsal}
            onlineCount={bidderCount}
            onOpenPortfolio={() => setIsPortfolioOpen(true)}
            wonCount={wonStartups.length}
          />

          {/* Main Content Arena */}
          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Primary Arena: Startup Brief + Bidding Action */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-6 flex flex-col">
                <StartupHero
                  startup={activeStartup}
                  totalLots={startups.length}
                />
              </div>

              <div className="lg:col-span-6 flex flex-col">
                <BiddingPad
                  startup={activeStartup}
                  profile={profile}
                  wallet={wallet}
                  increments={increments}
                  connectionStatus={connectionStatus}
                  onBidSuccess={refresh}
                />
              </div>
            </div>

            {/* Supporting Information: Bid Ledger + Portfolio Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <BidHistoryList bids={bids} currentProfile={profile} />
              </div>

              <div className="lg:col-span-5">
                <PortfolioAnalytics
                  wonStartups={wonStartups}
                  wallet={wallet}
                  onOpenDrawer={() => setIsPortfolioOpen(true)}
                />
              </div>
            </div>
          </main>
        </div>

        {/* Integrated Bottom Financial Bar */}
        <div className="sticky bottom-0 z-30">
          <WalletSummaryBar
            wallet={wallet}
            onOpenDrawer={() => setIsPortfolioOpen(true)}
          />
        </div>

        {/* Portfolio Drawer */}
        <PortfolioDrawer
          isOpen={isPortfolioOpen}
          onClose={() => setIsPortfolioOpen(false)}
          wonStartups={wonStartups}
          wallet={wallet}
          teamName={profile.team_name}
          totalLots={startups.length}
        />
      </div>
    </ErrorBoundary>
  );
}
