/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Gauge, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  ChevronRight, 
  Sparkles,
  Compass,
  Award
} from 'lucide-react';
import { AppView, Product } from './types';
import DashboardView from './components/DashboardView';
import EventDetailView from './components/EventDetailView';
import GarageView from './components/GarageView';
import ShopView from './components/ShopView';
import ProductDetailView from './components/ProductDetailView';
import HotspotsMapView from './components/HotspotsMapView';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Shared global cart state
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: qty } : item
    ));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setSelectedProductId(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentView('shop');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface-variant relative flex flex-col justify-between">
      
      {/* Decorative Grid and Ambient Glows */}
      <div className="absolute inset-0 racing-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-[20%] w-[500px] h-[500px] bg-accent-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-[10%] w-[600px] h-[600px] bg-accent-orange/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Top Header Navbar */}
      <header id="main-header" className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Slogan */}
          <div 
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 bg-accent-red flex items-center justify-center font-display font-black text-black skew-x-[-10deg] transition-transform duration-300 group-hover:scale-105">
              V
            </div>
            <div>
              <span className="font-display text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase leading-none block">
                VELOCITY
              </span>
              <span className="text-[9px] font-mono text-accent-red tracking-widest uppercase block leading-none pt-1">
                Outlaw Performance Platform
              </span>
            </div>
          </div>

          {/* Desktop Links */}
          <nav id="desktop-nav" className="hidden lg:flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
            {([
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'canyon-run', label: 'Canyon Run' },
              { id: 'garage', label: 'Garage Rig' },
              { id: 'shop', label: 'Performance Shop' },
              { id: 'map', label: 'Active Radar Map' }
            ] as const).map((view) => {
              const isActive = currentView === view.id;
              return (
                <button 
                  key={view.id}
                  onClick={() => handleNavigate(view.id)}
                  className={`px-4 py-2 rounded transition-all flex items-center gap-2 ${isActive ? 'text-white bg-accent-red/10 border-b-2 border-accent-red font-black' : 'text-white/60 hover:text-white'}`}
                >
                  {isActive && <div className="w-1.5 h-1.5 bg-accent-red rounded-full animate-pulse" />}
                  {view.label}
                </button>
              );
            })}
          </nav>

          {/* Utility Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => handleNavigate('garage')}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-on-surface-muted hover:text-white rounded-lg transition-colors hidden sm:block"
            >
              <User size={16} />
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-on-surface-muted hover:text-white rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/95 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="relative w-full max-w-xs h-full bg-surface-card border-r border-white/10 p-6 flex flex-col justify-between z-10 shadow-2xl">
            <div className="space-y-8">
              {/* Logo */}
              <div 
                onClick={() => handleNavigate('dashboard')}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Gauge size={22} className="text-accent-red" />
                <span className="font-display text-lg font-black text-white uppercase tracking-tight">
                  VELOCITY
                </span>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col gap-2 font-mono text-xs font-bold uppercase tracking-widest text-left">
                <button 
                  onClick={() => handleNavigate('dashboard')}
                  className={`px-4 py-3 rounded-lg text-left transition-colors ${currentView === 'dashboard' ? 'bg-accent-red text-white' : 'hover:bg-white/5 text-on-surface-muted'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => handleNavigate('canyon-run')}
                  className={`px-4 py-3 rounded-lg text-left transition-colors ${currentView === 'canyon-run' ? 'bg-accent-red text-white' : 'hover:bg-white/5 text-on-surface-muted'}`}
                >
                  Canyon Run
                </button>
                <button 
                  onClick={() => handleNavigate('garage')}
                  className={`px-4 py-3 rounded-lg text-left transition-colors ${currentView === 'garage' ? 'bg-accent-red text-white' : 'hover:bg-white/5 text-on-surface-muted'}`}
                >
                  Garage Rig
                </button>
                <button 
                  onClick={() => handleNavigate('shop')}
                  className={`px-4 py-3 rounded-lg text-left transition-colors ${currentView === 'shop' ? 'bg-accent-red text-white' : 'hover:bg-white/5 text-on-surface-muted'}`}
                >
                  Performance Shop
                </button>
                <button 
                  onClick={() => handleNavigate('map')}
                  className={`px-4 py-3 rounded-lg text-left transition-colors ${currentView === 'map' ? 'bg-accent-red text-white' : 'hover:bg-white/5 text-on-surface-muted'}`}
                >
                  Active Radar Map
                </button>
              </nav>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-panel border border-white/5 flex items-center gap-3 text-left">
                <Compass size={16} className="text-accent-orange" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-on-surface-muted uppercase block">VELOCITY S-MEMBER</span>
                  <span className="text-[11px] font-display font-bold text-white block uppercase">Dominic T.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-10">
        {selectedProductId ? (
          <ProductDetailView 
            productId={selectedProductId}
            onBack={() => setSelectedProductId(null)}
            onAddToCart={handleAddToCart}
            onSelectProduct={handleSelectProduct}
          />
        ) : (
          <>
            {currentView === 'dashboard' && (
              <DashboardView 
                onNavigate={handleNavigate}
                onSelectProduct={handleSelectProduct}
                onAddToCart={handleAddToCart}
              />
            )}
            
            {currentView === 'canyon-run' && (
              <EventDetailView 
                onBack={() => handleNavigate('dashboard')}
              />
            )}

            {currentView === 'garage' && (
              <GarageView />
            )}

            {currentView === 'shop' && (
              <ShopView 
                onSelectProduct={handleSelectProduct}
                cart={cart}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onCheckout={handleClearCart}
              />
            )}

            {currentView === 'map' && (
              <HotspotsMapView />
            )}
          </>
        )}
      </main>

      {/* Global Bottom Footer */}
      <footer id="main-footer" className="mt-auto bg-[#050505] border-t border-white/5 py-6 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-8 text-[10px] font-mono text-white/40">
            <span>LAT: 34.0522° N</span>
            <span>LON: 118.2437° W</span>
            <span>TEMP: 24°C (TRACK)</span>
            <span className="hidden md:inline text-white/10">|</span>
            <span>© 2026 VELOCITY INC</span>
          </div>
          <div className="text-[10px] font-bold text-[#FF3E00] uppercase tracking-[0.3em] font-mono">
            System Status: Optimized // Signal: Encryption Secure
          </div>
        </div>
      </footer>

    </div>
  );
}
