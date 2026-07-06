/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Clock, 
  Flame, 
  Shield, 
  Wrench, 
  Gauge, 
  Activity, 
  Award, 
  Check, 
  AlertCircle,
  Play,
  Square
} from 'lucide-react';
import { driverProfile } from '../data';
import { Vehicle } from '../types';

export default function GarageView() {
  const [activeVehicleId, setActiveVehicleId] = useState(driverProfile.vehicles[0]?.id || '');
  const [engineRunning, setEngineRunning] = useState<Record<string, boolean>>({});
  const [telemetryState, setTelemetryState] = useState<Record<string, Vehicle['telemetry']>>({});

  // Get active vehicle object
  const activeVehicle = driverProfile.vehicles.find(v => v.id === activeVehicleId) || driverProfile.vehicles[0];

  // Initialize telemetry states
  useEffect(() => {
    const initial: Record<string, Vehicle['telemetry']> = {};
    driverProfile.vehicles.forEach(v => {
      initial[v.id] = { ...v.telemetry };
    });
    setTelemetryState(initial);
  }, []);

  // Engine telemetries simulator when running
  useEffect(() => {
    const activeRunningId = Object.keys(engineRunning).find(id => engineRunning[id]);
    if (!activeRunningId) return;

    const interval = setInterval(() => {
      setTelemetryState(prev => {
        const current = prev[activeRunningId];
        if (!current) return prev;

        // Is it turbocharged (GT-R has boost, Porsche is naturally aspirated Flat-6)
        const isTurbo = activeRunningId === 'gtr-r35';
        
        // Random slight oscillations representing combustion engine dynamics
        const targetRPM = Math.floor(Math.random() * 2800) + 4000; // Oscillate between 4000 and 6800 RPM
        const targetBoost = isTurbo ? parseFloat((Math.random() * 0.8 + 1.2).toFixed(1)) : 0.0;
        const tempDelta = Math.random() * 2 - 1;
        const oilDelta = Math.random() * 1.5 - 0.75;

        return {
          ...prev,
          [activeRunningId]: {
            rpm: targetRPM,
            boost: targetBoost,
            temp: Math.min(115, Math.max(85, parseFloat((current.temp + tempDelta).toFixed(1)))),
            oil: Math.min(110, Math.max(80, parseFloat((current.oil + oilDelta).toFixed(1))))
          }
        };
      });
    }, 450);

    return () => clearInterval(interval);
  }, [engineRunning]);

  const toggleEngine = (id: string) => {
    setEngineRunning(prev => {
      const isRunning = !prev[id];
      // Reset RPM and boost back to standby if turned off
      if (!isRunning) {
        setTelemetryState(tPrev => ({
          ...tPrev,
          [id]: {
            ...tPrev[id],
            rpm: 900, // Idle
            boost: 0.0
          }
        }));
      }
      return {
        ...prev,
        [id]: isRunning
      };
    });
  };

  const getTrophyIcon = (name: string) => {
    switch (name) {
      case 'Award': return <Award className="text-[#FF3E00]" size={22} />;
      case 'Clock': return <Clock className="text-white" size={22} />;
      case 'Flame': return <Flame className="text-[#FF3E00]" size={22} />;
      default: return <Trophy className="text-white" size={22} />;
    }
  };

  return (
    <div id="garage-container" className="space-y-12 pb-16 animate-fade-in">
      
      {/* 1. DRIVER PROFILE HEADER */}
      <section id="driver-profile-header" className="bg-[#111114] border border-white/10 p-6 md:p-8 relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#FF3E00]/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 racing-grid opacity-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
          {/* Avatar frame */}
          <div className="relative shrink-0 skew-x-[-4deg]">
            <div className="absolute -inset-1 bg-[#FF3E00] opacity-40" />
            <img 
              src={driverProfile.avatar} 
              alt={driverProfile.name} 
              referrerPolicy="no-referrer"
              className="w-24 h-24 object-cover border border-black relative" 
            />
          </div>

          {/* Identity & Level details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter leading-none">
                {driverProfile.name}
              </h1>
              <p className="text-[10px] font-mono text-[#FF3E00] mt-1.5 tracking-widest uppercase font-bold">
                {driverProfile.tag}
              </p>
            </div>

            {/* XP progress track */}
            <div className="max-w-md space-y-2 mx-auto md:mx-0">
              <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
                <span>REPUTATION XP LEVEL {driverProfile.level}</span>
                <span>{driverProfile.xp} / {driverProfile.xpToNextLevel} XP</span>
              </div>
              <div className="w-full h-1.5 bg-[#050505] overflow-hidden border border-white/5 p-[1px]">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF3E00] to-amber-500" 
                  style={{ width: `${(driverProfile.xp / driverProfile.xpToNextLevel) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Outlaw License Badge Status */}
          <div className="shrink-0 p-4 bg-[#050505] border border-white/10 flex items-center gap-3.5 max-w-xs text-left skew-x-[-2deg]">
            <Shield size={26} className="text-[#FF3E00] shrink-0" />
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-white/40 uppercase block">LICENSE GRANTED</span>
              <span className="text-xs font-display font-black italic text-white block uppercase tracking-wide">
                {driverProfile.licenseType}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-green-400 font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                STATUS: {driverProfile.licenseStatus}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Core stats row */}
        <div id="stats-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="p-4 bg-[#050505]/60 border border-white/5 space-y-1">
            <span className="text-[9px] font-mono text-white/40 uppercase block">RALLIES STARTED</span>
            <span className="text-2xl font-display font-black italic text-white">{driverProfile.stats.rallies}</span>
          </div>
          <div className="p-4 bg-[#050505]/60 border border-white/5 space-y-1">
            <span className="text-[9px] font-mono text-white/40 uppercase block">PODIUM FINISHES</span>
            <span className="text-2xl font-display font-black italic text-[#FF3E00]">{driverProfile.stats.podiums}</span>
          </div>
          <div className="p-4 bg-[#050505]/60 border border-white/5 space-y-1">
            <span className="text-[9px] font-mono text-white/40 uppercase block">TOTAL SPEED DISTANCE</span>
            <span className="text-2xl font-display font-black italic text-white">{driverProfile.stats.totalDistance}</span>
          </div>
          <div className="p-4 bg-[#050505]/60 border border-white/5 space-y-1">
            <span className="text-[9px] font-mono text-white/40 uppercase block">DRIVER RANK GRADE</span>
            <span className="text-2xl font-display font-black italic text-white">{driverProfile.stats.rank}</span>
          </div>
        </div>
      </section>

      {/* 2. THE DUAL COUPE RIGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Vehicles Selector & Detail */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end border-b border-white/10 pb-3">
            <h2 className="font-display text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#FF3E00]" />
              Active Garage Rigs
            </h2>
            
            {/* Rig switcher buttons */}
            <div className="flex gap-1 p-1 bg-[#050505] border border-white/10">
              {driverProfile.vehicles.map((v) => (
                <button 
                  key={v.id}
                  onClick={() => setActiveVehicleId(v.id)}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all ${activeVehicleId === v.id ? 'bg-[#FF3E00] text-black italic font-black' : 'text-white/40 hover:text-white'}`}
                >
                  {v.model.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Active vehicle showcase card */}
          <div className="bg-[#111114] border border-white/10 space-y-6">
            
            {/* Rig image with engine running overlay banner */}
            <div className="relative h-64 bg-[#050505] overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 racing-grid opacity-15 pointer-events-none" />
              
              <img 
                src={activeVehicle.image} 
                alt={activeVehicle.model} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-transparent opacity-90" />
              
              {/* Overlay telemetry badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-2.5 py-1 bg-black border border-white/15 font-mono text-[10px] font-bold text-white">
                  CLASS {activeVehicle.class}
                </span>
                <span className="px-2.5 py-1 bg-black border border-white/15 font-mono text-[10px] font-bold text-[#FF3E00]">
                  {activeVehicle.year}
                </span>
              </div>

              {engineRunning[activeVehicle.id] && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-[#FF3E00] text-black text-[9px] font-mono font-bold uppercase tracking-widest skew-x-[-10deg]">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                  RIG ONLINE
                </div>
              )}
            </div>

            {/* Tuning specs & live telemetry */}
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Specs parameters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 border-b border-white/5 pb-6">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-white/40 uppercase block">HORSEPOWER</span>
                  <span className="text-sm font-display font-black italic text-white uppercase">{activeVehicle.specs.power}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-white/40 uppercase block">WEIGHT CURB</span>
                  <span className="text-sm font-display font-black italic text-white uppercase">{activeVehicle.specs.weight}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-white/40 uppercase block">DRIVETRAIN</span>
                  <span className="text-sm font-display font-black italic text-white uppercase">{activeVehicle.specs.drivetrain}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-white/40 uppercase block">0-100 KM/H</span>
                  <span className="text-sm font-display font-black italic text-[#FF3E00] uppercase">{activeVehicle.specs.zeroToSixty}</span>
                </div>
                <div className="col-span-2 md:col-span-1 space-y-0.5">
                  <span className="text-[9px] font-mono text-white/40 uppercase block">POWERTRAIN</span>
                  <span className="text-xs font-display font-black italic text-white truncate block uppercase">{activeVehicle.specs.engine}</span>
                </div>
              </div>

              {/* Dynamic Telemetry Dials Grid */}
              <div className="p-5 bg-[#050505] border border-white/5 space-y-5">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-[#FF3E00]" />
                    <h4 className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">RIG LOG TELEMETRY</h4>
                  </div>

                  {/* Engine ignition toggle button */}
                  <button 
                    onClick={() => toggleEngine(activeVehicle.id)}
                    className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${engineRunning[activeVehicle.id] ? 'bg-[#FF3E00] text-black' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'}`}
                  >
                    {engineRunning[activeVehicle.id] ? (
                      <>
                        <Square size={10} fill="currentColor" />
                        IGNITION OFF
                      </>
                    ) : (
                      <>
                        <Play size={10} fill="currentColor" />
                        ENGAGE ENGINE
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* RPM dial */}
                  <div className="p-3 bg-[#111114] border border-white/5 text-center space-y-1">
                    <span className="text-[9px] font-mono text-white/40 uppercase block">RPM METER</span>
                    <span className="text-lg font-mono font-black text-white block">
                      {telemetryState[activeVehicle.id]?.rpm || activeVehicle.telemetry.rpm}
                    </span>
                    <div className="w-full bg-[#050505] h-1 overflow-hidden mt-1.5">
                      <div 
                        className={`h-full transition-all duration-300 ${((telemetryState[activeVehicle.id]?.rpm || activeVehicle.telemetry.rpm) > 6000) ? 'bg-[#FF3E00] animate-pulse' : 'bg-amber-500'}`}
                        style={{ width: `${((telemetryState[activeVehicle.id]?.rpm || activeVehicle.telemetry.rpm) / 9000) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Boost pressure */}
                  <div className="p-3 bg-[#111114] border border-white/5 text-center space-y-1">
                    <span className="text-[9px] font-mono text-white/40 uppercase block">BOOST BAR</span>
                    <span className="text-lg font-mono font-black text-white block">
                      {telemetryState[activeVehicle.id]?.boost !== undefined ? telemetryState[activeVehicle.id].boost : activeVehicle.telemetry.boost} BAR
                    </span>
                    <div className="w-full bg-[#050505] h-1 overflow-hidden mt-1.5">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${((telemetryState[activeVehicle.id]?.boost || activeVehicle.telemetry.boost) / 2.5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Oil temperature */}
                  <div className="p-3 bg-[#111114] border border-white/5 text-center space-y-1">
                    <span className="text-[9px] font-mono text-white/40 uppercase block">COOLANT TEMP</span>
                    <span className="text-lg font-mono font-black text-white block">
                      {telemetryState[activeVehicle.id]?.temp || activeVehicle.telemetry.temp}°C
                    </span>
                    <div className="w-full bg-[#050505] h-1 overflow-hidden mt-1.5">
                      <div 
                        className={`h-full transition-all duration-300 ${((telemetryState[activeVehicle.id]?.temp || activeVehicle.telemetry.temp) > 100) ? 'bg-[#FF3E00] animate-pulse' : 'bg-green-500'}`}
                        style={{ width: `${((telemetryState[activeVehicle.id]?.temp || activeVehicle.telemetry.temp) / 130) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Oil pressure */}
                  <div className="p-3 bg-[#111114] border border-white/5 text-center space-y-1">
                    <span className="text-[9px] font-mono text-white/40 uppercase block">OIL PRESSURE</span>
                    <span className="text-lg font-mono font-black text-white block">
                      {telemetryState[activeVehicle.id]?.oil || activeVehicle.telemetry.oil} PSI
                    </span>
                    <div className="w-full bg-[#050505] h-1 overflow-hidden mt-1.5">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${((telemetryState[activeVehicle.id]?.oil || activeVehicle.telemetry.oil) / 120) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Right 1 Column: Trophy Room & Recent Activity Logs */}
        <div className="space-y-8">
          
          {/* Trophy room showcase */}
          <div className="p-6 bg-[#111114] border border-white/10 space-y-4">
            <h3 className="font-display text-base font-black italic text-white uppercase tracking-tighter border-b border-white/10 pb-2">
              Trophy Cabinet
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {driverProfile.trophies.map((trophy) => (
                <div 
                  key={trophy.id}
                  className="p-3 bg-[#050505] border border-white/5 text-center space-y-2 group transition-all"
                >
                  <div className="w-10 h-10 bg-[#111114] border border-white/5 flex items-center justify-center mx-auto">
                    {getTrophyIcon(trophy.icon)}
                  </div>
                  <div>
                    <h4 className="text-xs font-display font-bold text-white uppercase truncate">
                      {trophy.title}
                    </h4>
                    <p className="text-[9px] font-mono text-white/40 truncate mt-0.5 uppercase">
                      {trophy.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Logs history */}
          <div className="p-6 bg-[#111114] border border-white/10 space-y-4">
            <h3 className="font-display text-base font-black italic text-white uppercase tracking-tighter border-b border-white/10 pb-2">
              Recent Activity Logs
            </h3>

            <div className="space-y-3">
              {driverProfile.recentActivity.map((log) => (
                <div 
                  key={log.id}
                  className="p-3.5 bg-[#050505] border border-white/5 space-y-2 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono text-[#FF3E00] font-bold">{log.date}</span>
                      <h4 className="font-display font-black text-xs text-white uppercase truncate">
                        {log.event}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/5 text-[8px] font-mono text-white/40 uppercase">
                      {log.type}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-white/5 font-mono text-[10px] text-white/40">
                    <span>{log.vehicle}</span>
                    <span className="text-white font-bold">{log.statValue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
