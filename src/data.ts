/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DriverProfile, Product, Hotspot, EventActivity } from './types';

export const driverProfile: DriverProfile = {
  name: "DOMINIC T.",
  tag: "Elite Driver #410",
  level: 42,
  xp: 8420,
  xpToNextLevel: 10000,
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80",
  licenseStatus: "VALID",
  licenseType: "S-CLASS OUTLAW LICENSE",
  stats: {
    rallies: 154,
    podiums: 89,
    totalDistance: "12,450 KM",
    rank: "PRO-II",
    reputation: 94
  },
  vehicles: [
    {
      id: "gtr-r35",
      make: "Nissan",
      model: "GT-R R35",
      year: 2021,
      image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80",
      class: "S",
      specs: {
        power: "720 HP",
        weight: "1,680 KG",
        drivetrain: "AWD",
        engine: "3.8L V6 TWIN-TURBO",
        zeroToSixty: "2.5S"
      },
      telemetry: {
        boost: 1.8,
        temp: 94,
        oil: 88,
        rpm: 6800
      }
    },
    {
      id: "911-gt3-rs",
      make: "Porsche",
      model: "911 GT3 RS",
      year: 2023,
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
      class: "S+",
      specs: {
        power: "518 HP",
        weight: "1,450 KG",
        drivetrain: "RWD",
        engine: "4.0L FLAT-6 NA",
        zeroToSixty: "3.0S"
      },
      telemetry: {
        boost: 0.0,
        temp: 89,
        oil: 92,
        rpm: 8200
      }
    }
  ],
  recentActivity: [
    {
      id: "act-1",
      event: "CANYON RUN: MIDNIGHT",
      vehicle: "Nissan GT-R R35",
      date: "JUN 15, 2026",
      time: "02:14 AM",
      statName: "DRIFT SCORE",
      statValue: "182,450 PTS",
      type: "drift"
    },
    {
      id: "act-2",
      event: "PCH SPEED RUN",
      vehicle: "Porsche 911 GT3 RS",
      date: "JUN 12, 2026",
      time: "11:45 PM",
      statName: "TOP SPEED",
      statValue: "312 KM/H",
      type: "speed"
    },
    {
      id: "act-3",
      event: "BRIDGE DRIFT MEET",
      vehicle: "Nissan GT-R R35",
      date: "JUN 08, 2026",
      time: "10:30 PM",
      statName: "ATTENDED",
      statValue: "+50 REP",
      type: "meet"
    }
  ],
  trophies: [
    {
      id: "tr-1",
      title: "CANYON KING",
      event: "Mulholland Midnight Run",
      date: "MAY 2026",
      icon: "Award"
    },
    {
      id: "tr-2",
      title: "PERFECT RHYTHM",
      event: "PCH Time Attack",
      date: "APR 2026",
      icon: "Clock"
    },
    {
      id: "tr-3",
      title: "TIRE SLAYER",
      event: "Industrial Drift Off",
      date: "FEB 2026",
      icon: "Flame"
    },
    {
      id: "tr-4",
      title: "S-CLASS CLEAR",
      event: "Velocity Licensing",
      date: "JAN 2026",
      icon: "Shield"
    }
  ]
};

export const upcomingRallies: EventActivity[] = [
  {
    id: "rally-1",
    title: "CANYON RUN: MIDNIGHT",
    location: "Angeles Crest Hwy",
    time: "TODAY - 11:30 PM",
    status: "ongoing",
    type: "Rally"
  },
  {
    id: "rally-2",
    title: "BRIDGE DRIFT MEET",
    location: "Sixth Street Bridge",
    time: "TOMORROW - 10:00 PM",
    status: "upcoming",
    type: "Meet"
  },
  {
    id: "rally-3",
    title: "PACIFIC COAST SHAKEDOWN",
    location: "PCH Route 1",
    time: "JUN 24 - 09:00 PM",
    status: "upcoming",
    type: "Rally"
  },
  {
    id: "rally-4",
    title: "NEO TOKYO GRIP",
    location: "Willow Springs Circuit",
    time: "JUN 28 - 08:00 AM",
    status: "upcoming",
    type: "Track Day"
  }
];

export const shopProducts: Product[] = [
  {
    id: "apex-chrono",
    name: "VELOCITY CHRONOGRAPH",
    tagline: "APEX PRECISION TIMEPIECE - LIMITED EDITION",
    price: 849,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    category: "wearables",
    isLimited: true,
    stock: 14,
    description: "Engineered for high-octane precision. Features a real carbon-fiber dial, tachymeter bezel, hybrid flyback chronograph mechanics, and a micro-etched steel case inspired by lightweight racing alloys. Designed in collaboration with APEX Engineering.",
    specs: [
      "DIAL: Genuine 3K Twill Weave Carbon Fiber",
      "MOVEMENT: Mechanical Flyback Chrono hybrid",
      "STRAP: Perforated FKM Racing Rubber",
      "CASE: 42mm grade-5 titanium with DLC coating",
      "WATER RESISTANCE: 100 Meters / 10 ATM",
      "GLASS: Double-domed scratchproof Sapphire crystal"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    id: "apex-gloves",
    name: "APEX RACING GLOVES",
    tagline: "V-SERIES ERGONOMIC GRIP",
    price: 189,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
    category: "gear",
    isLimited: false,
    stock: 45,
    description: "Premium perforated Cabretta leather construction with custom silicone palm grids engineered for flawless steering response. Integrated carbon knuckle shield plates for protection against track-day debris.",
    specs: [
      "MATERIAL: Grade-A perforated Cabretta leather",
      "GRIP: Ergonomic V-grip silicone molding",
      "PROTECTION: Carbon fiber knuckles",
      "CLOSURE: Micro-velcro wrist stabilizer"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    id: "v-steering",
    name: "V-SERIES STEERING WHEEL",
    tagline: "ALCANTARA & FORGED CARBON",
    price: 1150,
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
    category: "hardware",
    isLimited: true,
    stock: 5,
    description: "Constructed of structural forged carbon core, wrapped in authentic Italian Alcantara with contrasting signal-red cross-stitching. Featuring fully customizable telemetry shift indicator LEDs and magnetic paddle shifters.",
    specs: [
      "CORE: Full Forged Carbon Structure",
      "GRIP: Genuine Alcantara 9002",
      "LIGHTING: 15-LED shift array",
      "PADDLES: Aerospace-grade magnetic titanium shifters"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    id: "aero-mirrors",
    name: "AERO MIRROR CAPS",
    tagline: "PRE-PREG AUTOCLAVE DRY CARBON",
    price: 499,
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
    category: "accessories",
    isLimited: false,
    stock: 12,
    description: "Extremely lightweight dry carbon fiber side mirror shells, autoclaved under 6 bars of pressure for aerospace durability and pristine structural finish. Reduces drag coefficients by 1.2%.",
    specs: [
      "MANUFACTURING: Autoclave pre-preg dry carbon",
      "WEAVE: 2x2 Twill weave with UV-stable gloss clearcoat",
      "WEIGHT: 85g per mirror cap",
      "FITMENT: Laser-scanned OEM snap replacement"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    id: "monocoque-bucket",
    name: "APEX MONOCOQUE BUCKET",
    tagline: "FIA-APPROVED TRACK SEAT",
    price: 2450,
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
    category: "hardware",
    isLimited: true,
    stock: 2,
    description: "FIA 8855-1999 certified full carbon monocoque racing seat. Upholstered in energy-absorbing memory foam pads and flame-retardant Nomex upholstery. Provides optimal lateral support and lumbar relief for heavy G-force high cornering loads.",
    specs: [
      "STRUCTURE: Full carbon fiber shell",
      "CERTIFICATION: FIA Approved 8855-1999",
      "WEIGHT: 4.8 KG shell weight",
      "HARNESS: Configured for 4, 5, or 6 point restraints"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80"
    ]
  }
];

export const hotspots: Hotspot[] = [
  {
    id: "hot-1",
    name: "MIDNIGHT PCH RUN",
    type: "run",
    coords: { x: 30, y: 40 },
    status: "active",
    attendance: 48,
    description: "Cruising along Pacific Coast Highway under the full moon. Fast sections, cool breeze, and classic coastal tunnels.",
    highlights: ["Sunset Tunnel Sprint", "Malibu Pier regroup", "Pacific Soundscapes"]
  },
  {
    id: "hot-2",
    name: "BRIDGE DRIFT MEET",
    type: "meet",
    coords: { x: 75, y: 55 },
    status: "packed",
    attendance: 125,
    description: "Under the towering arches, tire smoke and rev limiters echo. The largest active car assembly in the city.",
    highlights: ["Tire Slaying Pit", "Dynamic neon showcase", "Live DJs and telemetry"]
  },
  {
    id: "hot-3",
    name: "REDLINE CAFE HANGOUT",
    type: "hangout",
    coords: { x: 50, y: 70 },
    status: "quiet",
    attendance: 18,
    description: "High-octane specialty coffee hub. Unwind, check other builds, and chat with team drivers about track stats.",
    highlights: ["Cold Brew & Turbos", "Dyno station review", "Gear and livery boutique"]
  },
  {
    id: "hot-4",
    name: "GLENDORA MOUNTAIN RECON",
    type: "run",
    coords: { x: 82, y: 28 },
    status: "active",
    attendance: 32,
    description: "Tight hairpins and sheer drop-offs. Only recommended for experienced drivers with tuned setups.",
    highlights: ["Apex-clipping sweeps", "Lookout photo point", "Tuning data check"]
  }
];

export const communityFeed = [
  {
    id: "feed-1",
    user: "Marcus_GT3",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    role: "Driver",
    time: "20 min ago",
    content: "Just dialed in the camber on the front axle of the 911. Glendora curves are ready to get carved tonight. Who's in?",
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=600&q=80",
    likes: 42,
    comments: 8
  },
  {
    id: "feed-2",
    user: "TuningLabs",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
    role: "Workshop Partner",
    time: "2 hours ago",
    content: "The Apex Precision watch looks absolutely insane in hand. Highly recommend visiting the collab boutique in the Performance Shop.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    likes: 84,
    comments: 15
  },
  {
    id: "feed-3",
    user: "OutlawChaser",
    avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=100&h=100&q=80",
    role: "Speed Enthusiast",
    time: "4 hours ago",
    content: "Caught a clean sound bite of the GT-R R35 downshifting inside the Sunset Tunnel during the midnight PCH sprint. Pure acoustic magic.",
    image: null,
    likes: 56,
    comments: 4
  }
];
