/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  Send, 
  Compass, 
  Flame, 
  Activity, 
  Gauge,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { hotspots } from '../data';

export default function HotspotsMapView() {
  const [activeHotspotId, setActiveHotspotId] = useState(hotspots[0]?.id || '');
  const [messages, setMessages] = useState([
    { id: 'm-1', user: 'Marcus_GT3', text: 'Bridge is absolutely packed tonight. 100+ rigs already here.', time: '02:14 AM' },
    { id: 'm-2', user: 'SilviaS15_Outlaw', text: 'PCH patrol spotted near tunnel entrance. Cruisers stay alert!', time: '02:16 AM' },
    { id: 'm-3', user: 'TuningLabs', text: 'Heading out from Cafe now with a few fresh tunes. Let\'s roll.', time: '02:17 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Speedometer telemetry simulation state
  const [speedVal, setSpeedVal] = useState(110);
  const [driftScore, setDriftScore] = useState(42000);

  // Active Hotspot details
  const activeHotspot = hotspots.find(h => h.id === activeHotspotId) || hotspots[0];

  // Simulating slightly fluctuating speedometer and drift metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeedVal(prev => {
        const delta = Math.floor(Math.random() * 12) - 5;
        return Math.min(240, Math.max(0, prev + delta));
      });
      setDriftScore(prev => {
        const delta = Math.floor(Math.random() * 1200) - 200;
        return Math.max(0, prev + delta);
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      user: 'DOMINIC T. (You)',
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');

    // Trigger auto simulated reply after 1.5 seconds to make the chat feel alive!
    setTimeout(() => {
      const replies = [
        "Copy that! Keep the throttle pinned.",
        "Beautiful drift score on Sector A!",
        "Cafe is clearing out, see you at the Bridge.",
        "Watch those tire temps on Angeles Crest.",
        "Locked and loaded!"
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const responders = ["SilviaS15_Outlaw", "OutlawChaser", "Marcus_GT3", "GTR_Rider"];
      const randomResponder = responders[Math.floor(Math.random() * responders.length)];

      setMessages(prev => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          user: randomResponder,
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  return (
    <div id="hotspots-map-container" className="space-y-12 pb-16 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter leading-none flex items-center gap-2.5">
            <Compass className="text-[#FF3E00]" />
            Active Meets & Radar Map
          </h1>
          <p className="text-xs text-white/40 mt-1 font-mono uppercase">
            LIVE SATELLITE ROAD CHANNELS • COUPE POSITIONING COORDINATES
          </p>
        </div>
        
        {/* Active stats badge counters */}
        <div className="flex gap-4">
          <span className="px-4 py-2 bg-[#111114] border border-white/10 rounded-none text-center shrink-0 min-w-[100px]">
            <span className="block text-[10px] text-white/40 font-mono uppercase">LIVE LOCATIONS</span>
            <span className="block text-xl font-display font-black italic text-[#FF3E00]">4 ACTIVE</span>
          </span>
          <span className="px-4 py-2 bg-[#111114] border border-white/10 rounded-none text-center shrink-0 min-w-[100px]">
            <span className="block text-[10px] text-white/40 font-mono uppercase">ACTIVE DRIVERS</span>
            <span className="block text-xl font-display font-black italic text-[#FF3E00]">223</span>
          </span>
        </div>
      </div>

      {/* 1. MAP GRAPHICS SPLIT DESIGN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Map Canvas & Speedometer Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Map Box */}
          <div className="border border-white/10 bg-[#111114] overflow-hidden flex flex-col justify-between h-[440px]">
            <div className="relative flex-1 bg-[#050505] flex items-center justify-center">
              <div className="absolute inset-0 racing-grid opacity-20 pointer-events-none" />
              
              {/* Radar wave pulses */}
              <div className="absolute w-72 h-72 rounded-full border border-[#FF3E00]/10 animate-ping duration-10000 opacity-25" />
              <div className="absolute w-44 h-44 rounded-full border border-[#FF3E00]/20 animate-pulse duration-5000 opacity-30" />

              {/* Core map routes styled inside SVG */}
              <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Simulated winding road tracks */}
                <path d="M 50 150 C 150 200 180 50 300 100 S 450 320 600 200 S 750 350 780 180" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" strokeLinecap="round" />
                <path d="M 120 50 C 220 180 250 120 380 280 S 520 80 680 150 S 720 50 790 90" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="4" strokeLinecap="round" />
                
                {/* Highlighted active route connecting active hotspots */}
                <path 
                  d="M 240 160 Q 380 280 550 140 T 700 280" 
                  stroke="#FF3E00" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  className="redline-flicker"
                  strokeDasharray="6 4"
                />
              </svg>

              {/* Glowing active pinpoint indicators mapping to hotspot list */}
              {hotspots.map((h) => {
                const isActive = h.id === activeHotspotId;
                const dotColor = h.status === 'packed' ? 'bg-[#FF3E00]' : h.status === 'active' ? 'bg-amber-500' : 'bg-white/40';
                const shadowColor = h.status === 'packed' ? 'shadow-[#FF3E00]/50' : h.status === 'active' ? 'shadow-amber-500/50' : 'shadow-transparent';

                return (
                  <div 
                    key={h.id}
                    onClick={() => setActiveHotspotId(h.id)}
                    className="absolute cursor-pointer flex flex-col items-center group transition-all"
                    style={{ top: `${h.coords.y}%`, left: `${h.coords.x}%` }}
                  >
                    <div className="relative">
                      <span className={`absolute -inset-1 rounded-full ${dotColor} blur opacity-75 group-hover:opacity-100 animate-ping duration-1000`} />
                      <span className={`relative block w-3.5 h-3.5 rounded-full ${dotColor} shadow-lg ${shadowColor} border border-[#050505] transition-transform transform group-hover:scale-125 ${isActive ? 'scale-125 ring-2 ring-white/20' : ''}`} />
                    </div>
                    <span className={`text-[9px] font-mono mt-1.5 px-1.5 py-0.5 rounded-none transition-all tracking-wider ${isActive ? 'bg-[#FF3E00] text-black font-black' : 'bg-[#050505]/95 text-white/60 group-hover:text-white'}`}>
                      {h.name.split(' ')[0]}
                    </span>
                  </div>
                );
              })}

              <div className="absolute top-4 left-4 bg-[#050505] px-3 py-1.5 border border-white/10 font-mono text-[9px] text-white/40 space-y-0.5">
                <div>CHANNELS CONNECTED: <span className="text-green-400 font-bold">14 HUD</span></div>
                <div>SIGNAL REFRESH: <span className="text-[#FF3E00] font-bold">0.4 SECS</span></div>
              </div>
            </div>

            {/* Selected Hotspot Overview */}
            <div className="p-5 border-t border-white/10 bg-[#050505] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${activeHotspot.status === 'packed' ? 'bg-[#FF3E00]' : activeHotspot.status === 'active' ? 'bg-amber-500' : 'bg-white/40'}`} />
                  <h3 className="font-display font-black text-white uppercase tracking-tighter text-lg leading-none">
                    {activeHotspot.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] font-mono text-white/60 uppercase rounded-none">
                    {activeHotspot.type}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed max-w-xl font-sans">
                  {activeHotspot.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#111114] border border-white/10 rounded-none font-mono text-xs text-white/80">
                <Users size={14} className="text-[#FF3E00]" />
                <span>ATTENDANCE: <strong className="text-white font-black">{activeHotspot.attendance} Rigs</strong></span>
              </div>
            </div>
          </div>

          {/* Speedometer telemetry panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-5 bg-[#111114] border border-white/10 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2 font-mono text-xs text-white/40">
                <span className="flex items-center gap-1.5"><Gauge size={14} className="text-[#FF3E00]" /> RIG OVERLAY ENGINE</span>
                <span className="text-[#FF3E00]">GPS PORT 1</span>
              </div>
              
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase font-bold">LIVE COUPE SPEED</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-mono font-black text-white">{speedVal}</span>
                    <span className="text-xs text-white/40 font-mono font-bold">KM/H</span>
                  </div>
                </div>

                <div className="flex-1 max-w-[140px] bg-[#050505] h-2 overflow-hidden p-[1px] border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-[#FF3E00] transition-all duration-300"
                    style={{ width: `${(speedVal / 240) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#111114] border border-white/10 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2 font-mono text-xs text-white/40">
                <span className="flex items-center gap-1.5"><Activity size={14} className="text-[#FF3E00]" /> DRIFT SCORE GAUGE</span>
                <span className="text-amber-500">LIVE SCORE</span>
              </div>
              
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase font-bold">ACTIVE ANGLE ACCUMULATE</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-mono font-black text-white">{driftScore.toLocaleString()}</span>
                    <span className="text-[9px] text-white/40 font-mono font-bold uppercase">PTS</span>
                  </div>
                </div>

                <div className="flex-1 max-w-[140px] bg-[#050505] h-2 overflow-hidden p-[1px] border border-white/10">
                  <div 
                    className="h-full bg-[#FF3E00] transition-all duration-300"
                    style={{ width: `${(driftScore / 80000) * 100}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right 1 Column: Live Area Radio chat */}
        <div className="space-y-6 flex flex-col h-full">
          
          <div className="p-5 bg-[#111114] border border-white/10 space-y-4 flex flex-col justify-between h-[564px]">
            
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 shrink-0">
                <h3 className="font-display font-black italic text-base text-white uppercase tracking-tighter flex items-center gap-2">
                  <Flame size={16} className="text-[#FF3E00]" />
                  Area Radio Chat
                </h3>
                <span className="px-2 py-0.5 bg-[#FF3E00]/10 border border-[#FF3E00]/30 text-[8px] font-mono text-[#FF3E00] rounded-none uppercase tracking-wider font-black">
                  UNENCRYPTED
                </span>
              </div>

              {/* Chat messages list scrollable */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {messages.map((m) => {
                  const isUser = m.user.includes('DOMINIC T.');
                  return (
                    <div 
                      key={m.id} 
                      className={`p-3 space-y-1.5 max-w-[85%] rounded-none ${isUser ? 'ml-auto bg-[#FF3E00]/10 border border-[#FF3E00]/20 text-right' : 'bg-[#050505] border border-white/5'}`}
                    >
                      <div className="flex items-center justify-between gap-3 font-mono text-[9px]">
                        <span className={`font-bold ${isUser ? 'text-[#FF3E00]' : 'text-white'}`}>{m.user}</span>
                        <span className="text-white/40">{m.time}</span>
                      </div>
                      <p className="text-white/60 leading-relaxed break-words font-sans">
                        {m.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="pt-4 border-t border-white/10 shrink-0">
              <div className="relative">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="TRANSMIT TO AREA CARS..." 
                  className="w-full pl-3 pr-10 py-3 bg-[#050505] border border-white/10 hover:border-white/20 focus:border-[#FF3E00]/50 text-xs font-mono text-white placeholder-white/20 focus:outline-none rounded-none"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#FF3E00] hover:bg-[#FF3E00]/90 text-black rounded-none transition-colors"
                >
                  <Send size={12} />
                </button>
              </div>
            </form>

          </div>

        </div>

      </div>

    </div>
  );
}
