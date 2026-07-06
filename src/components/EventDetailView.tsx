/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Check, 
  AlertTriangle,
  Clock,
  ArrowLeft,
  Activity,
  Award
} from 'lucide-react';
import { driverProfile } from '../data';

interface EventDetailViewProps {
  onBack: () => void;
  onRegisterSuccess?: () => void;
}

export default function EventDetailView({ onBack, onRegisterSuccess }: EventDetailViewProps) {
  const [registered, setRegistered] = useState(false);
  const [remainingSlots, setRemainingSlots] = useState(4);
  const [driverName, setDriverName] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(driverProfile.vehicles[0]?.id || '');
  const [requirements, setRequirements] = useState([
    { id: 'req-1', label: 'S-Class Outlaw License', checked: true },
    { id: 'req-2', label: 'Active Telemetry Node in Rig', checked: false },
    { id: 'req-3', label: 'Pre-registration completed', checked: false },
    { id: 'req-4', label: 'FIA approved Helmet & Fire Suit', checked: true }
  ]);

  const toggleRequirement = (id: string) => {
    setRequirements(prev => prev.map(req => 
      req.id === id ? { ...req, checked: !req.checked } : req
    ));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;
    
    setRegistered(true);
    setRemainingSlots(prev => prev - 1);
    
    // Auto-check requirements 2 and 3 because user just registered
    setRequirements(prev => prev.map(req => 
      req.id === 'req-2' || req.id === 'req-3' ? { ...req, checked: true } : req
    ));

    if (onRegisterSuccess) onRegisterSuccess();
  };

  // Check if all requirements are checked
  const allRequirementsMet = requirements.every(req => req.checked);

  return (
    <div id="event-detail-container" className="space-y-12 pb-16 animate-fade-in">
      
      {/* Back Button Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#050505] hover:bg-white/5 border border-white/10 text-xs font-mono font-bold tracking-widest text-white uppercase transition-colors flex items-center gap-2 group"
        >
          <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" />
          BACK TO DASHBOARD
        </button>
        <span className="text-[10px] font-mono text-[#FF3E00] font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3E00] animate-pulse" />
          Rally Status: ACTIVE RECON
        </span>
      </div>

      {/* 1. HERO HEADER: CANYON RUN MIDNIGHT */}
      <section 
        id="event-hero" 
        className="relative overflow-hidden border border-white/10 min-h-[380px] flex items-end bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(to top, rgba(5, 5, 5, 0.98) 25%, rgba(5, 5, 5, 0.4) 100%), url('https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1600&q=80')` 
        }}
      >
        <div className="absolute inset-0 racing-grid opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#FF3E00]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="px-2.5 py-1 bg-[#FF3E00]/10 border border-[#FF3E00]/20 text-[10px] font-mono tracking-widest text-[#FF3E00] uppercase font-bold">
              OUTLAW RALLY SERIES
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
              Canyon Run: <span className="text-[#FF3E00]">Midnight</span>
            </h1>
            <p className="text-xs md:text-sm text-white/60 max-w-xl font-sans">
              An underground speed and drift rally starting from the lower foothills up through the high altitude switchbacks of Angeles Crest. Only the skilled survive the redline.
            </p>
          </div>

          <div className="flex gap-4">
            <span className="px-4 py-3 bg-black border border-white/10 text-center shrink-0 min-w-[90px]">
              <span className="block text-[9px] text-white/40 font-mono uppercase">LEVEL</span>
              <span className="block text-2xl font-display font-black italic text-white">40+</span>
            </span>
            <span className="px-4 py-3 bg-black border border-[#FF3E00]/30 text-center shrink-0 min-w-[90px]">
              <span className="block text-[9px] text-white/40 font-mono uppercase">SLOTS</span>
              <span className="block text-2xl font-display font-black italic text-[#FF3E00]">{remainingSlots}/25</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. MAIN SPECIFICATIONS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Core Info, Route, Schedule */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick specs horizontal list */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#111114] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-mono uppercase">
                <Calendar size={13} className="text-[#FF3E00]" />
                <span>DATE</span>
              </div>
              <p className="text-xs font-display font-black italic text-white uppercase">JUNE 22, 2026</p>
            </div>
            
            <div className="p-4 bg-[#111114] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-mono uppercase">
                <MapPin size={13} className="text-[#FF3E00]" />
                <span>LOCATION</span>
              </div>
              <p className="text-xs font-display font-black italic text-white truncate uppercase">Angeles Crest Hwy</p>
            </div>

            <div className="p-4 bg-[#111114] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-mono uppercase">
                <DollarSign size={13} className="text-[#FF3E00]" />
                <span>ENTRY FEE</span>
              </div>
              <p className="text-xs font-display font-black italic text-white uppercase">$150 USD</p>
            </div>

            <div className="p-4 bg-[#111114] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-mono uppercase">
                <Users size={13} className="text-[#FF3E00]" />
                <span>DRIVERS</span>
              </div>
              <p className="text-xs font-display font-black italic text-white uppercase">S-CLASS ONLY</p>
            </div>
          </div>

          {/* The Experience narrative */}
          <div className="p-6 bg-[#111114] border border-white/10 space-y-4">
            <h3 className="font-display text-lg font-black italic text-white uppercase tracking-tighter border-b border-white/10 pb-2">
              The Experience
            </h3>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed font-sans">
              As darkness blankets the valley, Angeles Crest Highway transforms from a scenic tourist route into an asphalt colosseum. This is not a race for the faint of heart; it's a test of precision, throttle control, and pure driver instincts.
            </p>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed font-sans">
              The 24-kilometer route spans tight second-gear hairpins, sudden altitude drops of up to 400 meters, and sweeping speed sweeps where a single error sends your rig into the ravine. Top-tier telemetry tracking will record your speeds, G-forces, and drift slip angles.
            </p>
          </div>

          {/* Route Map - Visual representation */}
          <div className="p-6 bg-[#111114] border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="font-display text-lg font-black italic text-white uppercase tracking-tighter">
                Route telemetry profile
              </h3>
              <span className="text-[10px] font-mono text-[#FF3E00] uppercase font-bold">WINDING CANYON SECTOR A</span>
            </div>
            
            {/* Custom Interactive SVG Route Representation */}
            <div className="relative bg-[#050505] border border-white/5 p-4 flex flex-col justify-between h-64 overflow-hidden">
              <div className="absolute inset-0 racing-grid opacity-10 pointer-events-none" />
              
              {/* Route Map SVG */}
              <div className="absolute inset-0 p-8 flex items-center justify-center">
                <svg className="w-full h-full max-h-[160px]" viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Canyon Path Line */}
                  <path 
                    d="M 10 120 Q 80 40 150 120 T 290 120 T 430 40 T 590 100" 
                    stroke="rgba(255, 255, 255, 0.08)" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <path 
                    id="glowing-path"
                    d="M 10 120 Q 80 40 150 120 T 290 120 T 430 40 T 590 100" 
                    stroke="#FF3E00" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="redline-flicker"
                  />
                  
                  {/* Checkpoints */}
                  <g className="cursor-pointer">
                    <circle cx="10" cy="120" r="6" fill="#fff" stroke="#FF3E00" strokeWidth="2" />
                    <text x="10" y="145" fill="#8E8D94" fontSize="10" fontFamily="monospace" textAnchor="middle">START</text>
                  </g>
                  <g className="cursor-pointer">
                    <circle cx="150" cy="120" r="5" fill="#fff" stroke="#fd8b00" strokeWidth="2" />
                    <text x="150" y="145" fill="#8E8D94" fontSize="10" fontFamily="monospace" textAnchor="middle">CP-1</text>
                  </g>
                  <g className="cursor-pointer">
                    <circle cx="290" cy="120" r="5" fill="#fff" stroke="#fd8b00" strokeWidth="2" />
                    <text x="290" y="145" fill="#8E8D94" fontSize="10" fontFamily="monospace" textAnchor="middle">CP-2 (ALT)</text>
                  </g>
                  <g className="cursor-pointer">
                    <circle cx="430" cy="40" r="5" fill="#fff" stroke="#FF3E00" strokeWidth="2" />
                    <text x="430" y="25" fill="#8E8D94" fontSize="10" fontFamily="monospace" textAnchor="middle">APEX BEND</text>
                  </g>
                  <g className="cursor-pointer">
                    <circle cx="590" cy="100" r="6" fill="#fff" stroke="#FF3E00" strokeWidth="2" />
                    <text x="590" y="125" fill="#8E8D94" fontSize="10" fontFamily="monospace" textAnchor="middle">END</text>
                  </g>
                </svg>
              </div>

              {/* Live Telemetry Sector Box overlays */}
              <div className="absolute top-3 left-3 bg-[#111114] px-2.5 py-1 border border-white/10 font-mono text-[9px] text-white/40">
                <span>EST DISTANCE: </span><span className="text-white font-bold">24.2 KM</span>
              </div>
              <div className="absolute bottom-3 right-3 bg-[#111114] px-2.5 py-1 border border-white/10 font-mono text-[9px] text-white/40 flex gap-3">
                <div>ALT GAIN: <span className="text-amber-500 font-bold">+1,240 M</span></div>
                <div>AVG ANGLE: <span className="text-[#FF3E00] font-bold">42°</span></div>
              </div>
            </div>
          </div>

          {/* Schedule Timeline */}
          <div className="p-6 bg-[#111114] border border-white/10 space-y-6">
            <h3 className="font-display text-lg font-black italic text-white uppercase tracking-tighter border-b border-white/10 pb-2">
              Event Schedule
            </h3>
            
            <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-white/5">
              
              <div className="flex gap-4 relative group">
                <div className="w-6 h-6 bg-[#050505] border border-white/15 flex items-center justify-center shrink-0 z-10 group-hover:border-[#FF3E00]/40 transition-colors">
                  <span className="w-1.5 h-1.5 bg-white group-hover:bg-[#FF3E00] transition-colors" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-[#FF3E00] font-bold">11:00 PM</span>
                    <h4 className="font-display font-black text-xs text-white uppercase">DRIVER BRIEFING</h4>
                  </div>
                  <p className="text-xs text-white/40">
                    Mandatory track sync, weather reports, safety vehicle paths, and telemetry node calibration at base camp.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 relative group">
                <div className="w-6 h-6 bg-[#050505] border border-white/15 flex items-center justify-center shrink-0 z-10 group-hover:border-[#FF3E00]/40 transition-colors">
                  <span className="w-1.5 h-1.5 bg-white group-hover:bg-[#FF3E00] transition-colors" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-[#FF3E00] font-bold">11:15 PM</span>
                    <h4 className="font-display font-black text-xs text-white uppercase">GATES OPEN & GRIDDING</h4>
                  </div>
                  <p className="text-xs text-white/40">
                    Vanguard drivers take grid positions according to qualification times or license grades. Pre-checks complete.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 relative group">
                <div className="w-6 h-6 bg-[#050505] border border-white/15 flex items-center justify-center shrink-0 z-10 group-hover:border-[#FF3E00]/40 transition-colors">
                  <span className="w-1.5 h-1.5 bg-white group-hover:bg-[#FF3E00] transition-colors" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-[#FF3E00] font-bold">11:30 PM</span>
                    <h4 className="font-display font-black text-xs text-white uppercase">WARM-UP LAP (OUTLAW SPEED)</h4>
                  </div>
                  <p className="text-xs text-white/40">
                    Tire warm-up sweep up to Sector 1. Group recon to audit active rockfalls or local highway patrol checkpoints.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 relative group">
                <div className="w-6 h-6 bg-[#050505] border border-[#FF3E00]/40 flex items-center justify-center shrink-0 z-10">
                  <span className="w-1.5 h-1.5 bg-[#FF3E00] animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-[#FF3E00] font-bold">11:45 PM</span>
                    <h4 className="font-display font-black text-xs text-[#FF3E00] uppercase">FULL CANYON OUTLAW RALLY</h4>
                  </div>
                  <p className="text-xs text-white/40">
                    First driver launches from base toll booth. Chrono timers active. Slipstream telemetry active. Save your tires.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right 1 Column: Requirements checklist & Join the Run Card */}
        <div className="space-y-8">
          
          {/* Driver requirements check */}
          <div className="p-6 bg-[#111114] border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="font-display text-base font-black italic text-white uppercase tracking-tighter">
                Driver Credentials
              </h3>
              <span className="text-[10px] font-mono text-white/40 uppercase">CHECKLIST</span>
            </div>
            
            <div className="space-y-3">
              {requirements.map((req) => (
                <label 
                  key={req.id}
                  onClick={() => toggleRequirement(req.id)}
                  className="flex items-center gap-3 p-3 bg-[#050505] hover:bg-white/5 border border-white/5 cursor-pointer transition-colors"
                >
                  <div className={`w-5 h-5 flex items-center justify-center border transition-colors ${req.checked ? 'bg-[#FF3E00]/10 border-[#FF3E00] text-[#FF3E00]' : 'border-white/20 text-transparent'}`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={`text-xs ${req.checked ? 'text-white font-medium' : 'text-white/40'}`}>
                    {req.label}
                  </span>
                </label>
              ))}
            </div>

            {allRequirementsMet ? (
              <div className="p-3 bg-green-500/10 border border-green-500/20 flex gap-2.5 items-start">
                <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-green-400 font-mono leading-relaxed">
                  ALL CREDENTIALS SECURED. DRIVER ELIGIBLE FOR AUTOMATIC TIMING ENTRY.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 flex gap-2.5 items-start">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-500 font-mono leading-relaxed">
                  SOME REQUIREMENT CHECKS REMAIN PENDING. SEED RIG TELEMETRY TO PROCEED.
                </p>
              </div>
            )}
          </div>

          {/* Join the Run Registration Form */}
          <div className="p-6 bg-[#111114] border border-white/10 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF3E00]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-1.5 border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-black italic text-white uppercase tracking-tighter">
                {registered ? "RUN RECON CONFIRMED" : "JOIN THE CANYON RUN"}
              </h3>
              <p className="text-[10px] text-white/40 font-mono leading-normal uppercase">
                {registered 
                  ? "YOUR TIMING NODE HAS BEEN SYNCED. CHECK GARAGE RIGS FOR SECTORS." 
                  : "SECURE YOUR GRID SLOT IMMEDIATELY. PRE-REGISTRATION IS ENCRYPTED."
                }
              </p>
            </div>

            {registered ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-16 h-16 bg-[#FF3E00]/10 border border-[#FF3E00]/30 flex items-center justify-center mx-auto animate-pulse">
                  <Check size={32} className="text-[#FF3E00]" />
                </div>
                <div className="space-y-1">
                  <p className="font-display font-black italic text-white uppercase tracking-tight text-sm">
                    {driverName.toUpperCase() || "DOMINIC T."} IS REGISTERED
                  </p>
                  <p className="text-[10px] font-mono text-[#FF3E00] font-bold uppercase">
                    GRID ASSIGNMENT: SECTOR A-04
                  </p>
                </div>
                <button 
                  onClick={() => setRegistered(false)}
                  className="text-[10px] font-mono text-white/40 hover:text-white uppercase tracking-wider block mx-auto underline pt-2"
                >
                  Modify Registration Details
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase block font-bold">DRIVER LOG CALLSIGN</label>
                  <input 
                    type="text" 
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="E.G. DOMINIC T." 
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 hover:border-white/20 focus:border-[#FF3E00]/50 text-xs font-mono text-white focus:outline-none placeholder-white/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase block font-bold">ACTIVE VEHICLE RIG</label>
                  <select 
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 text-xs font-mono text-white focus:outline-none"
                  >
                    {driverProfile.vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={remainingSlots <= 0}
                    className="w-full py-3 bg-[#FF3E00] hover:bg-[#FF3E00]/90 transition-colors text-xs font-mono font-black italic tracking-widest text-black uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {remainingSlots <= 0 ? "SLOTS OUT" : "LOCK S-MEMBER SLOT"}
                  </button>
                  <p className="text-[9px] font-mono text-white/40 text-center mt-2.5 uppercase">
                    * TIMING TOKEN SECURED VIA OUTLAW LICENSE METRICS
                  </p>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
