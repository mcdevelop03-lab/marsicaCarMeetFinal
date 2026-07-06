/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppView = 'dashboard' | 'canyon-run' | 'garage' | 'shop' | 'map';

export interface DriverStats {
  rallies: number;
  podiums: number;
  totalDistance: string;
  rank: string;
  reputation: number;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  image: string;
  class: string;
  specs: {
    power: string;
    weight: string;
    drivetrain: string;
    engine: string;
    zeroToSixty: string;
  };
  telemetry: {
    boost: number;
    temp: number;
    oil: number;
    rpm: number;
  };
}

export interface EventActivity {
  id: string;
  title: string;
  location: string;
  time: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'canceled';
  type: 'Rally' | 'Meet' | 'Track Day' | 'Outlaw Run';
}

export interface ActivityLog {
  id: string;
  event: string;
  vehicle: string;
  date: string;
  time: string;
  statName: string;
  statValue: string;
  type: string;
}

export interface Trophy {
  id: string;
  title: string;
  event: string;
  date: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  price: number;
  image: string;
  category: 'wearables' | 'hardware' | 'accessories' | 'gear';
  isLimited: boolean;
  stock: number;
  description: string;
  specs: string[];
  gallery: string[];
}

export interface Hotspot {
  id: string;
  name: string;
  type: 'meet' | 'run' | 'hangout';
  coords: { x: number; y: number };
  status: 'active' | 'packed' | 'quiet';
  attendance: number;
  description: string;
  highlights: string[];
}

export interface DriverProfile {
  name: string;
  tag: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  avatar: string;
  licenseStatus: string;
  licenseType: string;
  stats: DriverStats;
  vehicles: Vehicle[];
  recentActivity: ActivityLog[];
  trophies: Trophy[];
}
