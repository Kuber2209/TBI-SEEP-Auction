'use client';

import React, { useState, useEffect } from 'react';
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
import { WelcomeLobbyScreen } from '@/components/bidder/WelcomeLobbyScreen';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Loader2, LayoutGrid, Radio } from 'lucide-react';

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
  // Default start is 'lobby' as requested
  const [userViewOverride, setUserViewOverride] = useState<'lobby' | 'arena'>('lobby');

  // Determine if auction has officially started live on stage
  const isAuctionLive = Boolean(
    session?.status === 'ACTIVE' &&
      activeStartup &&
      ['PRESENTING', 'ACTIVE_BIDDING', 'PAUSED'].includes(activeStartup.status)
  );

  // If stage resets to Welcome Lobby (active_startup_id === null), ensure view returns to lobby
  useEffect(() => {
    if (!activeStartup) {
      setUserViewOverride('lobby');
    }
  }, [activeStartup]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#dfe7e0] flex items-center justify-center text-[#203126] transition-colors duration-150">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#1a5c3e]" />
          <p className="text-xs font-medium text-[#56695e]">
            Initializing Live Auction Console...
          </p>
        </div>
      </div>
    );
  }

  const increments = session?.bid_increments || [1000, 2500, 5000, 10000];
  const shouldShowLobby = userViewOverride === 'lobby';

  return (
    <ErrorBoundary fallbackTitle="Investor Console Interface Error">
      <div className="min-h-screen bg-[#dfe7e0] flex flex-col justify-between text-[#203126] transition-colors duration-150">
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

          {/* Lobby / Arena Mode Switcher Bar (Always accessible for easy navigation) */}
          <div className="bg-[#eff4f0] border-b border-[#cad7cc] px-4 sm:px-6 lg:px-8 py-2">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#56695e]">
                {isAuctionLive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="font-semibold text-emerald-800">Stage Live: Lot #{activeStartup?.display_order}</span>
                    <span>·</span>
                    <span className="text-[#203126] font-medium">{activeStartup?.name}</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#1a5c3e] animate-pulse" />
                    <span>Pre-Auction Standby</span>
                    <span>·</span>
                    <span>Welcome & Rules Briefing Active</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserViewOverride('lobby')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                    shouldShowLobby
                      ? 'bg-[#1a5c3e] text-white shadow-sm'
                      : 'bg-[#e5ece6] text-[#56695e] hover:text-[#203126] border border-[#cad7cc]'
                  }`}
                >
                  <span>Welcome & Rules</span>
                </button>
                <button
                  onClick={() => setUserViewOverride('arena')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                    !shouldShowLobby
                      ? 'bg-[#1a5c3e] text-white shadow-sm'
                      : 'bg-[#e5ece6] text-[#56695e] hover:text-[#203126] border border-[#cad7cc]'
                  }`}
                >
                  <span>Live Bidding Arena</span>
                  {isAuctionLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Render Welcome Screen OR Live Bidding Arena */}
          {shouldShowLobby ? (
            <WelcomeLobbyScreen
              profile={profile}
              startups={startups}
              wallet={wallet}
              onlineCount={bidderCount}
              onEnterArena={() => setUserViewOverride('arena')}
            />
          ) : (
            /* Main Content Arena */
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
          )}
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
