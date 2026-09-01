export type UserRole = 'admin' | 'bidder';
export type SessionStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type StartupStatus = 'UPCOMING' | 'PRESENTING' | 'ACTIVE_BIDDING' | 'PAUSED' | 'SOLD' | 'UNSOLD';
export type BidStatus = 'ACTIVE' | 'OUTBID' | 'WINNING' | 'VOID' | 'SETTLED';
export type HoldStatus = 'HELD' | 'RELEASED' | 'SETTLED';

export interface Profile {
  id: string;
  display_user_id: string;
  team_name: string;
  role: UserRole;
  is_active: boolean;
  session_version: number;
  created_at: string;
  updated_at: string;
}

export interface BidderWallet {
  id: string;
  team_id: string;
  initial_balance: number;
  available_balance: number;
  locked_balance: number;
  total_spent: number;
  updated_at: string;
}

export interface AuctionSession {
  id: string;
  name: string;
  is_rehearsal: boolean;
  status: SessionStatus;
  initial_purse_amount: number;
  bid_increments: number[];
  wallets_initialized: boolean;
  active_startup_id: string | null;
  created_by?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface Startup {
  id: string;
  session_id: string;
  display_order: number;
  name: string;
  founder_names: string[];
  sector: string;
  tagline: string;
  description?: string;
  logo_url?: string;
  base_price: number;
  status: StartupStatus;
  current_highest_bid: number | null;
  current_highest_bidder_id: string | null;
  winner_team_id: string | null;
  winning_bid_amount: number | null;
  started_presenting_at?: string;
  bidding_started_at?: string;
  paused_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  startup_id: string;
  bidder_id: string;
  amount: number;
  status: BidStatus;
  idempotency_key: string;
  server_seq: number;
  created_at: string;
  voided_at?: string;
  voided_by?: string;
  void_reason?: string;
  // Joined fields
  bidder_profile?: Profile;
}

export interface FundHold {
  id: string;
  startup_id: string;
  bidder_id: string;
  bid_id: string;
  amount: number;
  status: HoldStatus;
  held_at: string;
  released_at?: string;
  settled_at?: string;
}

export interface StartupAccount {
  id: string;
  startup_id: string;
  received_amount: number;
  settled_at?: string;
  winning_bid_id?: string;
}

export interface AuctionEvent {
  id: string;
  session_id: string;
  startup_id?: string;
  event_type: string;
  actor_id?: string;
  target_id?: string;
  payload: Record<string, any>;
  prev_state?: Record<string, any>;
  new_state?: Record<string, any>;
  created_at: string;
}

export interface AccountActivityLog {
  id: string;
  user_id: string;
  event_type: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'display_user_id' | 'team_name'>;
        Update: Partial<Profile>;
      };
      bidder_wallets: {
        Row: BidderWallet;
        Insert: Partial<BidderWallet> & Pick<BidderWallet, 'team_id'>;
        Update: Partial<BidderWallet>;
      };
      auction_sessions: {
        Row: AuctionSession;
        Insert: Partial<AuctionSession> & Pick<AuctionSession, 'name'>;
        Update: Partial<AuctionSession>;
      };
      startups: {
        Row: Startup;
        Insert: Partial<Startup> & Pick<Startup, 'session_id' | 'display_order' | 'name' | 'sector' | 'tagline'>;
        Update: Partial<Startup>;
      };
      bids: {
        Row: Bid;
        Insert: Partial<Bid> & Pick<Bid, 'startup_id' | 'bidder_id' | 'amount' | 'idempotency_key'>;
        Update: Partial<Bid>;
      };
      fund_holds: {
        Row: FundHold;
        Insert: Partial<FundHold> & Pick<FundHold, 'startup_id' | 'bidder_id' | 'bid_id' | 'amount'>;
        Update: Partial<FundHold>;
      };
      startup_accounts: {
        Row: StartupAccount;
        Insert: Partial<StartupAccount> & Pick<StartupAccount, 'startup_id'>;
        Update: Partial<StartupAccount>;
      };
      auction_events: {
        Row: AuctionEvent;
        Insert: Partial<AuctionEvent> & Pick<AuctionEvent, 'event_type'>;
        Update: Partial<AuctionEvent>;
      };
      account_activity_logs: {
        Row: AccountActivityLog;
        Insert: Partial<AccountActivityLog> & Pick<AccountActivityLog, 'user_id' | 'event_type'>;
        Update: Partial<AccountActivityLog>;
      };
    };
    Functions: {
      place_bid: {
        Args: {
          p_startup_id: string;
          p_amount: number;
          p_idempotency_key: string;
        };
        Returns: Record<string, any>;
      };
      close_auction: {
        Args: {
          p_startup_id: string;
        };
        Returns: Record<string, any>;
      };
      void_bid: {
        Args: {
          p_bid_id: string;
          p_reason: string;
        };
        Returns: Record<string, any>;
      };
      reopen_auction: {
        Args: {
          p_startup_id: string;
        };
        Returns: Record<string, any>;
      };
      set_startup_status: {
        Args: {
          p_startup_id: string;
          p_status: StartupStatus;
        };
        Returns: Record<string, any>;
      };
      initialize_session_wallets: {
        Args: {
          p_session_id: string;
        };
        Returns: Record<string, any>;
      };
      force_logout_bidder: {
        Args: {
          p_user_id: string;
        };
        Returns: Record<string, any>;
      };
      emergency_pause_session: {
        Args: {
          p_session_id: string;
        };
        Returns: Record<string, any>;
      };
      emergency_resume_session: {
        Args: {
          p_session_id: string;
        };
        Returns: Record<string, any>;
      };
      reset_rehearsal_session: {
        Args: {
          p_session_id: string;
        };
        Returns: Record<string, any>;
      };
    };
  };
}
