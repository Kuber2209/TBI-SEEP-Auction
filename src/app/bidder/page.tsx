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
import { PortfolioModal } from '@/components/bidder/PortfolioModal';
import { PortfolioAnalytics } from '@/components/bidder/PortfolioAnalytics';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Loader2, PieChart } from 'lucide-react';

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
  const [showAnalytics, setShowAnalytics] = useState(false);

  if (!profile) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          <p className="text-sm font-semibold text-slate-300">
            Initializing Live Auction Console...
          </p>
        </div>
      </div>
    );
  }

  const increments = session?.bid_increments || [1000, 2500, 5000, 10000];

  return (
    <ErrorBoundary fallbackTitle="Investor Console Interface Error">
      <div className="min-h-screen bg-navy-950 flex flex-col justify-between text-slate-100">
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
            {/* Two-Column Auction Arena */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 6 Cols: Startup Pitch Information */}
              <div className="lg:col-span-6 flex flex-col">
                <StartupHero
                  startup={activeStartup}
                  totalLots={startups.length}
                />
              </div>

              {/* Right 6 Cols: Bidding Action Control Pad */}
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

            {/* Bottom 2-Col Grid: Live Bid History & Portfolio Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <BidHistoryList bids={bids} currentProfile={profile} />
              </div>

              <div className="lg:col-span-5">
                <PortfolioAnalytics wonStartups={wonStartups} wallet={wallet} />
              </div>
            </div>
          </main>
        </div>

        {/* Fixed Bottom Wallet Summary Bar */}
        <div className="sticky bottom-0 z-30">
          <WalletSummaryBar wallet={wallet} />
        </div>

        {/* Portfolio Modal */}
        <PortfolioModal
          isOpen={isPortfolioOpen}
          onClose={() => setIsPortfolioOpen(false)}
          wonStartups={wonStartups}
          teamName={profile.team_name}
        />
      </div>
    </ErrorBoundary>
  );
}
