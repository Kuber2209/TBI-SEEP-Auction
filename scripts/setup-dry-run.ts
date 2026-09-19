import { createAdminClient } from '../src/lib/supabase/admin';
import { normalizeUserIdToEmail } from '../src/lib/auth/utils';

async function run() {
  console.log('🚀 Updating Dry Run Database with 14 Final Startups & 4 Mock Bidders...');
  const supabase = createAdminClient();

  // 1. Get default session
  const { data: session, error: sessErr } = await supabase
    .from('auction_sessions')
    .select('*')
    .limit(1)
    .single();

  if (sessErr || !session) {
    throw new Error('Session not found: ' + sessErr?.message);
  }

  const sessionId = (session as any).id;

  // 2. Clear old transactions
  console.log('🧹 Clearing previous transactions...');
  await supabase.from('fund_holds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('bids').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('startup_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 3. Update the 14 Final Startups
  console.log('🏢 Updating all 14 startups in database...');
  const finalStartups = [
    {
      display_order: 1,
      name: 'Core Opti',
      sector: 'AI & Operations',
      tagline: 'AI-powered computational efficiency & infrastructure optimization.',
      description: 'Core Opti delivers algorithmic resource orchestration and computational runtime optimization for high-throughput enterprise architectures.',
      founder_names: ['Core Opti Founders'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 2,
      name: 'Enervia',
      sector: 'CleanTech & Energy',
      tagline: 'AI-Based Energy Orchestration for Data Centers.',
      description: 'Intelligent energy-management system designed to reduce energy consumption, operational costs, and carbon footprints for data centers and compute clusters.',
      founder_names: ['Sattwik Das', 'Chinnam Hitesh Chandra', 'Agnibh Karmakar'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 3,
      name: 'Gigpe',
      sector: 'GigTech & Mobility',
      tagline: 'AI co-pilot app for gig economy drivers across India.',
      description: 'Real-time multi-platform income optimization and intelligent trip arbitration co-pilot for on-demand rideshare and delivery drivers.',
      founder_names: ['Kurelli Abhiram Reddy', 'Hari Hara Prasad Goud'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 4,
      name: 'HotSeatAI',
      sector: 'EdTech & AI',
      tagline: 'AI-powered role-specific interview simulation platform.',
      description: 'Simulates real-world, high-pressure candidate interviews with dynamic adaptive questioning, granular behavioral feedback, and competency rubrics.',
      founder_names: ['Harshal Anand Shah'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 5,
      name: 'KRAMARINE PVT LTD',
      sector: 'DeepTech & Marine',
      tagline: 'Matsya — Autonomous marine systems for inland water drowning prevention.',
      description: 'Autonomous rapid-deployment life-saving watercraft and sensor telemetry protecting inland waterways, reservoirs, and public water bodies.',
      founder_names: ['Rudra Joshi'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 6,
      name: 'KRATHVEIL',
      sector: 'DefenceTech',
      tagline: 'Tactical communication and battlefield intelligence layer for defence.',
      description: 'Indigenous resilient battlefield communications, secure mesh networks, and situational awareness layers engineered for tactical edge deployment.',
      founder_names: ['Samarth Alok Srivastava'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 7,
      name: 'LenoMAX',
      sector: 'Consumer Goods',
      tagline: 'Leno — 100% natural and sugar-free chewing gum for the Indian market.',
      description: 'Pioneering clean-label, biodegradable, plastic-free natural gum formulations crafted for healthy mastication and oral wellness.',
      founder_names: ['Kaushal Chetlapalli'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 8,
      name: 'Mitti Sanjeevani',
      sector: 'AgriTech',
      tagline: 'Re-engineering controlled-release plant nutrient delivery.',
      description: 'Next-generation bio-carrier agricultural inputs delivering micronutrients and soil revitalization to boost crop yields with reduced fertilizer runoff.',
      founder_names: ['Pranjal Agarwal'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 9,
      name: 'NovAtom Labs',
      sector: 'DeepTech & AI',
      tagline: 'Physics-native autonomous discovery & research copilot for experimental science.',
      description: 'Autonomous laboratory copilot accelerating material discovery and experimental chemistry through physics-informed machine learning models.',
      founder_names: ['Arnav Kulshrestha', 'Sattwik Das'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 10,
      name: 'Open corner',
      sector: 'PropTech & 3D Design',
      tagline: 'Build Your Own Washroom — Real-time interactive 3D configurator.',
      description: 'Web-based photorealistic 3D interior configurator enabling sanitaryware retail customers and architects to design, fit, and cost washroom layouts instantly.',
      founder_names: ['Tejas Ajmera'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 11,
      name: 'PA ji',
      sector: 'LegalTech',
      tagline: 'AI litigation workflow & research copilot for Indian advocates.',
      description: 'Purpose-built legal intelligence platform streamlining case research, draft preparation, and court procedure navigation for law students and advocates.',
      founder_names: ['Preena Sengupta', 'Aniket Gupta'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 12,
      name: 'Signal -AI',
      sector: 'AI & Media',
      tagline: 'Curated intelligence and executive briefings on artificial intelligence.',
      description: 'High-signal executive synthesis and technical intelligence filtering through the frontier AI ecosystem for researchers, operators, and technologists.',
      founder_names: ['Bhoovan Dhona'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 13,
      name: 'SPATHE ventures',
      sector: 'CleanTech & Infra',
      tagline: 'Sustainable modular temporary housing for construction ecosystems.',
      description: 'Rapidly assembleable, thermally insulated, dignified modular habitat units revolutionizing on-site workforce accommodation for major infrastructure projects.',
      founder_names: ['Prathik Tuniguntla', 'Nikhilesh Kosagi'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
    {
      display_order: 14,
      name: 'Sprout',
      sector: 'HealthTech',
      tagline: 'Evidence-based digital neurodevelopmental autism therapy.',
      description: 'Structured clinical methodologies and caregiver-assisted neurodivergent developmental support interventions for early childhood autism spectrum management.',
      founder_names: ['Parth', 'Chaitrali Dharmadhikari'],
      base_price: 10000.0,
      status: 'UPCOMING',
    },
  ];

  // Fetch current startups in DB
  const { data: currentStartups } = await supabase
    .from('startups')
    .select('id, display_order')
    .order('display_order');

  for (let i = 0; i < finalStartups.length; i++) {
    const s = finalStartups[i];
    const existing = (currentStartups || []).find((cs: any) => cs.display_order === s.display_order);

    if (existing) {
      console.log(`Updating startup #${s.display_order}: ${s.name}...`);
      const { error: updErr } = await (supabase.from('startups') as any)
        .update({
          name: s.name,
          sector: s.sector,
          tagline: s.tagline,
          description: s.description,
          founder_names: s.founder_names,
          base_price: s.base_price,
          status: 'UPCOMING',
          current_highest_bid: null,
          current_highest_bidder_id: null,
          winner_team_id: null,
          winning_bid_amount: null,
          started_presenting_at: null,
          bidding_started_at: null,
          paused_at: null,
          closed_at: null,
        })
        .eq('id', (existing as any).id);

      if (updErr) console.error(`Error updating #${s.display_order}:`, updErr);
    } else {
      console.log(`Inserting new startup #${s.display_order}: ${s.name}...`);
      const { error: insErr } = await (supabase.from('startups') as any)
        .insert({
          ...s,
          session_id: sessionId,
          current_highest_bid: null,
          current_highest_bidder_id: null,
          winner_team_id: null,
          winning_bid_amount: null,
        });

      if (insErr) console.error(`Error inserting #${s.display_order}:`, insErr);
    }
  }

  // 4. Reset Session Stage to Welcome Lobby (Standby)
  console.log('🏟️  Resetting Auction Session to Welcome Lobby...');
  await (supabase.from('auction_sessions') as any).update({
    status: 'ACTIVE',
    active_startup_id: null,
    wallets_initialized: true,
    is_rehearsal: true,
  }).eq('id', sessionId);

  console.log('✅ Final startups & session successfully configured!');
}

run().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
