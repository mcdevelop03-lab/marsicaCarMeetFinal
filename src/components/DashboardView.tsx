/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ShoppingBag, 
  Heart, 
  MessageSquare,
  Compass,
  ArrowUpRight,
  Flame,
  Award
} from 'lucide-react';
import { upcomingRallies, shopProducts, communityFeed, hotspots } from '../data';
import { EventActivity, Product } from '../types';

interface DashboardViewProps {
  onNavigate: (view: 'dashboard' | 'canyon-run' | 'garage' | 'shop' | 'map') => void;
  onSelectProduct: (productId: string) => void;
  onAddToCart: (product: Product) => void;
}

export default function DashboardView({ onNavigate, onSelectProduct, onAddToCart }: DashboardViewProps) {
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedList, setLikedList] = useState<Record<string, boolean>>({});

  const handleLike = (id: string, currentLikes: number) => {
    if (likedList[id]) {
      setLikes(prev => ({ ...prev, [id]: (prev[id] ?? currentLikes) - 1 }));
      setLikedList(prev => ({ ...prev, [id]: false }));
    } else {
      setLikes(prev => ({ ...prev, [id]: (prev[id] ?? currentLikes) + 1 }));
      setLikedList(prev => ({ ...prev, [id]: true }));
    }
  };

  // Get first 3 products for preview
  const previewProducts = shopProducts.slice(0, 3);

  // Get active run hotspot for map preview
  const activeRun = hotspots.find(h => h.status === 'packed') || hotspots[0];

  return (
    <div id="dashboard-container" className="space-y-12 pb-16 animate-fade-in">
      
      {/* 1. HERO BANNER: IGNITE YOUR PASSION (Editorial Styled) */}
      <section 
        id="dashboard-hero" 
        className="relative border border-white/10 min-h-[460px] flex items-center bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(5, 5, 5, 0.95) 45%, rgba(5, 5, 5, 0.3) 100%), url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80')` 
        }}
      >
        {/* Decorative Grid and Accents */}
        <div className="absolute inset-0 racing-grid opacity-15 pointer-events-none" />
        
        <div id="hero-content" className="relative z-10 max-w-2xl px-6 md:px-12 py-12 space-y-6">
          <div>
            <span className="bg-[#FF3E00] px-3 py-1 text-[10px] font-mono font-bold italic uppercase text-black tracking-widest inline-block skew-x-[-10deg]">
              LIVE_STATUS // SEASON_04
            </span>
          </div>
          
          <h1 id="hero-title" className="font-display text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-white uppercase">
            IGNITE YOUR <br />
            <span className="text-[#FF3E00]">PASSION</span>
          </h1>
          
          <p id="hero-description" className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl">
            Welcome to the ultimate hub for car enthusiasts, outlaw speed trials, and custom rigs. Explore active tracks, tune your garage, and pre-register for upcoming midnight rallies.
          </p>

          <div id="hero-ctas" className="flex flex-wrap gap-4 pt-2">
            <button 
              id="hero-register-btn"
              onClick={() => onNavigate('canyon-run')}
              className="px-6 py-3 bg-white hover:bg-[#FF3E00] text-black hover:text-white font-mono font-bold text-xs uppercase tracking-widest transition-colors duration-200"
            >
              Canyon Run: Midnight
            </button>
            <button 
              id="hero-garage-btn"
              onClick={() => onNavigate('garage')}
              className="px-6 py-3 border border-white/20 hover:border-white hover:bg-white/5 text-white font-mono font-bold text-xs uppercase tracking-widest transition-colors duration-200"
            >
              Manage Garage
            </button>
          </div>
        </div>

        {/* Floating Live Telemetry Overlay in Hero */}
        <div id="hero-telemetry" className="absolute bottom-8 right-8 hidden lg:flex flex-col gap-3 bg-[#050505] p-5 border border-white/10 max-w-xs font-mono text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-[#FF3E00] font-black tracking-widest">ROUTE MONITOR</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> ONLINE</span>
          </div>
          <div className="space-y-1 text-white/60 text-[11px]">
            <p>ROUTE: Angeles Crest Canyon</p>
            <p>GPS LAT: 34.3312° N</p>
            <p>ACTIVE RUNNERS: 14/25</p>
            <div className="flex items-center gap-2 pt-1.5">
              <span className="w-16 h-1.5 bg-white/10 overflow-hidden block">
                <span className="w-3/4 h-full bg-[#FF3E00] block" />
              </span>
              <span className="text-white text-[10px]">75% CAPACITY</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DUAL LAYOUT: UPCOMING RALLIES & TELEMETRY INSIGHT */}
      <div id="dashboard-split" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Upcoming Rallies */}
        <div id="dashboard-events" className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end border-b border-white/10 pb-3">
            <h2 id="events-heading" className="font-display text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#FF3E00]" />
              Upcoming Rallies & Meets
            </h2>
            <button 
              onClick={() => onNavigate('map')}
              className="text-[11px] font-mono font-bold text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-1 group"
            >
              See Map
              <ArrowUpRight size={13} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          <div id="events-list-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingRallies.map((rally) => (
              <div 
                key={rally.id} 
                id={`rally-card-${rally.id}`}
                className="group relative bg-[#111114] border border-white/5 hover:border-white/10 p-5 transition-all duration-300 flex flex-col justify-between min-h-[160px]"
              >
                {rally.status === 'ongoing' && (
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#FF3E00]/15 to-transparent pointer-events-none" />
                )}
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-white/60 uppercase">
                      {rally.type}
                    </span>
                    {rally.status === 'ongoing' ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#FF3E00]/10 border border-[#FF3E00]/20 text-[9px] font-mono tracking-widest text-[#FF3E00] uppercase font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3E00] animate-pulse" />
                        LIVE NOW
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-white/5 border border-white/5 text-[9px] font-mono tracking-widest text-white/40 uppercase">
                        STANDBY
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-display font-black text-lg text-white uppercase tracking-tight group-hover:text-[#FF3E00] transition-colors">
                      {rally.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-white/40 mt-1 font-mono">
                      <MapPin size={12} className="text-[#FF3E00]" />
                      <span>{rally.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 mt-3 border-t border-white/5 font-mono text-xs">
                  <div className="flex items-center gap-1 text-white/40">
                    <Clock size={12} />
                    <span>{rally.time}</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (rally.id === 'rally-1') {
                        onNavigate('canyon-run');
                      } else {
                        onNavigate('map');
                      }
                    }}
                    className="text-white hover:text-[#FF3E00] font-bold uppercase tracking-widest text-[10px] flex items-center gap-1"
                  >
                    Details
                    <ChevronRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Mini Hotspot Map Preview */}
        <div id="dashboard-map-preview" className="space-y-6">
          <h2 id="map-preview-heading" className="font-display text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#FF3E00]" />
            Local Hotspots
          </h2>

          <div id="mini-map-card" className="bg-[#111114] border border-white/5 overflow-hidden flex flex-col justify-between h-[340px]">
            {/* Interactive map visualization */}
            <div className="relative h-44 bg-[#050505] flex items-center justify-center border-b border-white/5">
              <div className="absolute inset-0 racing-grid opacity-20 pointer-events-none" />
              
              {/* Radar sweeps */}
              <div className="absolute w-40 h-40 rounded-full border border-[#FF3E00]/10 animate-ping duration-10000 opacity-30" />
              <div className="absolute w-24 h-24 rounded-full border border-[#FF3E00]/20 animate-pulse duration-3000 opacity-45" />

              {/* Grid dots mapping pins */}
              <div className="absolute top-1/3 left-1/4 flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF3E00] animate-pulse cursor-pointer shadow-lg shadow-[#FF3E00]/50" />
                <span className="text-[9px] font-mono mt-1 text-[#FF3E00] uppercase tracking-tighter">PCH RUN</span>
              </div>
              <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
                <span className="w-3 h-3 rounded-full bg-accent-orange animate-pulse cursor-pointer shadow-lg shadow-accent-orange/50" />
                <span className="text-[9px] font-mono mt-1 text-accent-orange uppercase tracking-tighter">DRIFT PIT</span>
              </div>
              
              <div className="absolute bottom-3 left-3 text-[9px] font-mono text-white/40 bg-black/80 px-2 py-0.5 border border-white/10">
                LIVE GPS LINK
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-tight">{activeRun.name}</h3>
                  <span className="px-2 py-0.5 bg-[#FF3E00]/10 border border-[#FF3E00]/20 text-[9px] font-mono text-[#FF3E00] uppercase font-bold">
                    {activeRun.attendance} ACTIVE
                  </span>
                </div>
                <p className="text-xs text-white/60 line-clamp-2">
                  {activeRun.description}
                </p>
              </div>

              <button 
                onClick={() => onNavigate('map')}
                className="w-full mt-3 py-2.5 bg-white text-black hover:bg-[#FF3E00] hover:text-white font-mono font-bold text-[10px] tracking-widest uppercase transition-colors"
              >
                Open Active Radar
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. PERFORMANCE COLLABS & CURATED GEAR SECTION */}
      <section id="dashboard-shop-highlight" className="space-y-6">
        <div className="flex justify-between items-end border-b border-white/10 pb-3">
          <h2 id="shop-heading" className="font-display text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#FF3E00]" />
            Curated Gear & Collabs
          </h2>
          <button 
            onClick={() => onNavigate('shop')}
            className="text-[11px] font-mono font-bold text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-1 group"
          >
            Visit Shop
            <ChevronRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Bento Box Styling for Gear Showcase */}
        <div id="shop-highlight-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Showcase Item: Velocity Chronograph */}
          <div 
            id="featured-product-card" 
            className="lg:col-span-2 relative bg-[#111114] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 group hover:border-[#FF3E00]/20 transition-all duration-500"
          >
            <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-[#FF3E00]/5 rounded-full blur-3xl group-hover:bg-[#FF3E00]/10 transition-all duration-500 pointer-events-none" />
            
            <div className="space-y-6 md:max-w-xs flex flex-col justify-between z-10">
              <div className="space-y-3">
                <span className="bg-[#FF3E00]/10 border border-[#FF3E00]/20 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-[#FF3E00] uppercase">
                  LIMITED RELEASE (14 PIECES)
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-black italic text-white tracking-tighter uppercase leading-none">
                  APEX CHRONOGRAPH
                </h3>
                <p className="text-xs text-white/40 font-mono tracking-wide uppercase">
                  VELOCITY CHRONOGRAPH | LIMITED EDITION
                </p>
                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  The ultimate driver accessory. Real carbon fiber twill dial, titanium grade-5 outer housing, and Flyback mechanical chronograph movement.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-black text-white">$849</span>
                  <span className="text-xs text-white/40 line-through font-mono">$1,250</span>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => onSelectProduct('apex-chrono')}
                    className="flex-1 py-2.5 bg-white text-black hover:bg-[#FF3E00] hover:text-white text-xs font-mono font-bold tracking-widest uppercase transition-colors"
                  >
                    TECHNICAL SPECS
                  </button>
                  <button 
                    onClick={() => {
                      const prod = shopProducts.find(p => p.id === 'apex-chrono');
                      if (prod) onAddToCart(prod);
                    }}
                    className="px-4 border border-white/20 hover:bg-[#FF3E00] hover:border-[#FF3E00] text-white hover:text-black transition-colors flex items-center justify-center"
                  >
                    <ShoppingBag size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Img Section */}
            <div className="relative flex-1 min-h-[220px] flex items-center justify-center bg-[#050505] border border-white/5 overflow-hidden">
              <div className="absolute inset-0 racing-grid opacity-10" />
              <img 
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80" 
                alt="Velocity Chronograph" 
                referrerPolicy="no-referrer"
                className="w-full max-w-[220px] h-auto object-contain transform group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity hover:mix-blend-normal"
              />
              <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-[#FF3E00] text-black text-[9px] font-mono font-bold uppercase">
                SAVE 32%
              </span>
            </div>
          </div>

          {/* Quick List of Other Products */}
          <div id="side-products-card" className="space-y-4 flex flex-col justify-between">
            {previewProducts.filter(p => p.id !== 'apex-chrono').map((product) => (
              <div 
                key={product.id}
                onClick={() => onSelectProduct(product.id)}
                className="group p-4 bg-[#111114] border border-white/5 hover:border-white/15 transition-all duration-300 flex items-center gap-4 cursor-pointer"
              >
                <div className="w-16 h-16 bg-[#050505] border border-white/5 p-2 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-luminosity group-hover:mix-blend-normal" 
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">
                    {product.category}
                  </span>
                  <h4 className="font-display text-xs font-bold text-white truncate uppercase">
                    {product.name}
                  </h4>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-mono text-accent-pink font-semibold">${product.price}</span>
                    <span className="text-[9px] font-mono text-white/40 group-hover:text-white transition-colors">Details →</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Loyalty Banner */}
            <div className="p-4 bg-[#FF3E00] text-black flex items-center justify-between skew-x-[-2deg]">
              <div className="space-y-0.5">
                <h4 className="text-xs font-mono font-black uppercase tracking-wider">VELOCITY S-MEMBER</h4>
                <p className="text-[10px] text-black/80 font-bold">Collect tokens on every purchase for exclusive race events</p>
              </div>
              <Award size={20} className="text-black shrink-0 ml-2 animate-bounce" />
            </div>
          </div>

        </div>
      </section>

      {/* 4. DRIVER COMMUNITY FEED */}
      <section id="dashboard-community" className="space-y-6">
        <div className="flex justify-between items-end border-b border-white/10 pb-3">
          <h2 id="community-heading" className="font-display text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#FF3E00]" />
            Driver Community Live Feed
          </h2>
        </div>

        <div id="community-feed-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {communityFeed.map((post) => {
            const displayLikes = likes[post.id] ?? post.likes;
            const isLiked = likedList[post.id] ?? false;

            return (
              <article 
                key={post.id}
                id={`feed-post-${post.id}`}
                className="bg-[#111114] border border-white/5 p-5 flex flex-col justify-between space-y-4"
              >
                {/* User Header */}
                <div className="flex items-center gap-3">
                  <img 
                    src={post.avatar} 
                    alt={post.user} 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-white/10 object-cover" 
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-display font-bold text-sm text-white uppercase tracking-tight">{post.user}</h4>
                      <span className="bg-white/5 border border-white/10 text-[8px] font-mono text-white/60 uppercase px-1.5 py-0.5 rounded">
                        {post.role}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-white/40">{post.time}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-white/70 leading-relaxed font-sans">
                    {post.content}
                  </p>

                  {post.image && (
                    <div className="overflow-hidden border border-white/5 h-36 bg-[#050505]">
                      <img 
                        src={post.image} 
                        alt="Post media" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 mix-blend-luminosity hover:mix-blend-normal" 
                      />
                    </div>
                  )}
                </div>

                {/* Engagement Actions */}
                <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-[10px] font-mono">
                  <button 
                    onClick={() => handleLike(post.id, post.likes)}
                    className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-[#FF3E00] font-bold' : 'text-white/40 hover:text-white'}`}
                  >
                    <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
                    <span>{displayLikes}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-white/40">
                    <MessageSquare size={13} />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 5. JOIN COMMUNITY FOOTER BANNER */}
      <section 
        id="dashboard-join-banner" 
        className="border border-white/10 overflow-hidden relative p-8 md:p-12 text-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(5, 5, 5, 0.9), rgba(5, 5, 5, 0.9)), url('https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1600&q=80')`
        }}
      >
        <div className="absolute inset-0 racing-grid opacity-10 pointer-events-none" />
        
        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <h2 className="font-display text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
            READY TO CLIP THE APEX?
          </h2>
          <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-md mx-auto">
            Get early alerts for outlaw drag runs, performance gear drops, and private garage meets. Register your S-Class License with the Velocity Hub today.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="ENTER DRIVER EMAIL..." 
              className="flex-1 px-4 py-3 bg-[#050505] border border-white/10 focus:border-[#FF3E00] text-xs font-mono text-white placeholder-white/20 focus:outline-none rounded-none"
            />
            <button 
              onClick={() => onNavigate('garage')}
              className="px-6 py-3 bg-white hover:bg-[#FF3E00] text-black hover:text-white transition-colors text-xs font-mono font-bold tracking-widest uppercase"
            >
              Request Entry
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
