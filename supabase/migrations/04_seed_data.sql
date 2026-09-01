-- ==============================================================================
-- SEEP 4.0 Live Startup Auction Platform — 04_seed_data.sql
-- Default Seed Data for Rehearsal and Event Day
-- ==============================================================================

-- 1. Create Default Session
INSERT INTO auction_sessions (
  id,
  name,
  is_rehearsal,
  status,
  initial_purse_amount,
  bid_increments,
  wallets_initialized
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'SEEP 4.0 Grand Finale',
  true,
  'DRAFT',
  50000.00,
  ARRAY[1000, 2500, 5000, 10000],
  false
)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed 12 Student Startups (BITS Pilani Hyderabad Campus TBI)
INSERT INTO startups (
  id,
  session_id,
  display_order,
  name,
  founder_names,
  sector,
  tagline,
  description,
  base_price,
  status
)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    1,
    'AeroVolt Dynamics',
    ARRAY['Aarav Sharma', 'Rohan Verma'],
    'CleanTech & EV',
    'Solid-state battery thermal management for commercial drones & electric aerial vehicles.',
    'AeroVolt has engineered an ultra-lightweight phase-change cooling composite that extends drone flight duration by 38% and cycle life by 2.4x.',
    10000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    2,
    'NeuroPulse AI',
    ARRAY['Sneha Reddy', 'Aditya Iyer'],
    'MedTech / AI',
    'Non-invasive EEG neural headband for early epileptic seizure prediction.',
    'Clinical-grade wearable with embedded edge-AI inference predicting focal onset seizures up to 25 minutes prior to occurrence.',
    12000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    3,
    'KisanSutra',
    ARRAY['Vikram Patel', 'Ananya Deshmukh'],
    'AgriTech & IoT',
    'Hyperlocal soil microbiome sensing & precision automated micro-irrigation.',
    'Solar-powered subterranean telemetry pods delivering real-time nitrogen-phosphorus-potassium and microbial activity maps directly to farmers.',
    8000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    4,
    'HyperLoom Logistics',
    ARRAY['Kabir Mehta', 'Tanvi Joshi'],
    'Supply Chain',
    'Autonomous warehouse robotic orchestration with sub-millimeter swarm positioning.',
    'Modular pallet-rover fleet software cutting pick-and-pack turnaround times by 65% for Tier-2 dark store distribution centers.',
    15000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    5,
    'ZetaTrust Security',
    ARRAY['Devansh Nair'],
    'Cybersecurity',
    'Zero-knowledge quantum-resistant hardware enclave for edge devices.',
    'Silicon-proven RISC-V coprocessor that protects smart grid infrastructure and IoT gateways from post-quantum cryptographic attacks.',
    10000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    6,
    'OptiFlow Hydro',
    ARRAY['Pooja Rao', 'Manish Gupta'],
    'Water & Sustainability',
    'Smart acoustic AI pipeline leak detection and automated pressure modulating valves.',
    'Reduces municipal water transmission losses (NRW) from 40% to under 6% via non-intrusive ultrasonic clamp-on nodes.',
    9000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    7,
    'CogniCraft Labs',
    ARRAY['Rishi Kulkarni', 'Meera Swaminathan'],
    'EdTech & VR',
    'Spatial computing simulators for high-hazard industrial vocational training.',
    'Photorealistic haptic VR simulations for petrochemical plant maintenance, reducing on-site training fatalities and equipment downtime.',
    11000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    8,
    'BioSynthetix',
    ARRAY['Dr. Siddharth Sen', 'Neha Bhatt'],
    'BioTech / Materials',
    'Mycelium-derived biodegradable flame-retardant structural foam packaging.',
    'Drop-in replacement for EPS styrofoam with zero petroleum inputs, 100% soil compostability in 45 days, and class-A fire safety rating.',
    14000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    9,
    'PayGrid Protocol',
    ARRAY['Varun Aggarwal', 'Divya Krishnan'],
    'FinTech & Web3',
    'Sub-second offline soundwave & NFC micro-settlement for rural transit networks.',
    'Hardware-agnostic sound modulation protocol processing offline transit transactions with zero cellular connectivity requirement.',
    12000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    10,
    'Chronos Nanotech',
    ARRAY['Karthik Sundaram'],
    'DeepTech / Space',
    'Atomic clock miniaturization on chip scale for satellite constellation synchrony.',
    'Ultra-stable rubidium vapor cell miniaturized to 1.2 cm³ for GPS-denied autonomous navigation and LEO microsatellites.',
    16000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    11,
    'SentientRobotics',
    ARRAY['Harish Murthy', 'Shruti Paul'],
    'Robotics & Defense',
    'Quadruped robotic scout with autonomous terrain mapping in subterranean tunnels.',
    'All-weather terrain rover with LIDAR SLAM and thermal imaging for disaster search-and-rescue and industrial inspection.',
    13000.00,
    'UPCOMING'
  ),
  (
    'b0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000001',
    12,
    'Zenith Propulsion',
    ARRAY['Pranav Nambiar', 'Ishita Ghosh'],
    'Aerospace',
    'Non-toxic green hypergolic thrusters for commercial satellite orbital repositioning.',
    'Hydrogen peroxide based orbital propulsion modules replacing carcinogenic hydrazine for low earth orbit commercial satellites.',
    18000.00,
    'UPCOMING'
  )
ON CONFLICT (id) DO NOTHING;
