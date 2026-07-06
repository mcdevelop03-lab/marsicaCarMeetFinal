/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  X, 
  Trash2, 
  CheckCircle2, 
  Check, 
  ChevronRight,
  TrendingUp,
  Flame,
  Plus,
  Minus
} from 'lucide-react';
import { shopProducts } from '../data';
import { Product } from '../types';

interface ShopViewProps {
  onSelectProduct: (id: string) => void;
  cart: Array<{ product: Product; quantity: number }>;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateCartQuantity: (productId: string, qty: number) => void;
  onCheckout: () => void;
}

export default function ShopView({ 
  onSelectProduct, 
  cart, 
  onAddToCart, 
  onRemoveFromCart, 
  onUpdateCartQuantity,
  onCheckout
}: ShopViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const categories = [
    { id: 'all', label: 'All gear' },
    { id: 'wearables', label: 'Wearables' },
    { id: 'hardware', label: 'Rig Hardware' },
    { id: 'gear', label: 'Racing Gear' },
    { id: 'accessories', label: 'Carbon parts' }
  ];

  // Filter products
  const filteredProducts = shopProducts.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate cart metrics
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleTriggerCheckout = () => {
    setCheckoutComplete(true);
    setTimeout(() => {
      onCheckout(); // Callback clear cart
      setCheckoutComplete(false);
      setCartOpen(false);
    }, 2800);
  };

  return (
    <div id="shop-container" className="space-y-12 pb-16 animate-fade-in relative">
      
      {/* Search & Categories Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Categories Tab Selector */}
        <div className="flex gap-1 overflow-x-auto pb-1 w-full md:w-auto no-scrollbar">
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-[#FF3E00] text-black border-[#FF3E00] italic font-black' : 'bg-[#111114] hover:bg-[#050505] text-white/40 hover:text-white border-white/10'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search bar and Cart trigger */}
        <div className="flex gap-3 w-full md:w-auto justify-end shrink-0">
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH CATALOGUE..." 
              className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-white/10 hover:border-white/20 focus:border-[#FF3E00]/50 text-xs font-mono text-white placeholder-white/20 focus:outline-none"
            />
          </div>

          <button 
            onClick={() => setCartOpen(true)}
            className="px-4 py-2.5 bg-[#050505] hover:bg-white/5 border border-white/10 transition-all text-xs font-mono font-bold text-white uppercase flex items-center gap-2 relative"
          >
            <ShoppingBag size={14} />
            <span>Cart</span>
            {totalCartItems > 0 && (
              <span className="w-5 h-5 bg-[#FF3E00] border border-black text-[10px] font-mono font-black text-black flex items-center justify-center absolute -top-2 -right-2 animate-pulse">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* 1. EXCLUSIVE BOUTIQUE BANNER */}
      {selectedCategory === 'all' && (
        <section 
          id="shop-boutique-hero" 
          className="relative overflow-hidden border border-white/10 min-h-[300px] flex items-center bg-cover bg-center"
          style={{ 
            backgroundImage: `linear-gradient(to right, rgba(5, 5, 5, 0.95) 50%, rgba(5, 5, 5, 0.3) 100%), url('https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1600&q=80')` 
          }}
        >
          <div className="absolute inset-0 racing-grid opacity-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-xl px-6 md:px-12 space-y-4">
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono tracking-widest text-amber-500 uppercase font-bold">
              APEX PERFORMANCE CO. COLLAB
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
              APEX Precision Timepiece
            </h2>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed font-sans">
              We've partnered with APEX Engineering to release the Limited Edition Velocity Chronograph. Crafted in lightweight grade-5 titanium and woven raw carbon fiber. Specially calibrated for high G-force environments.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => onSelectProduct('apex-chrono')}
                className="px-5 py-2.5 bg-[#FF3E00] hover:bg-[#FF3E00]/90 text-black transition-colors text-xs font-mono font-black tracking-widest uppercase flex items-center gap-2 group italic"
              >
                Inspect Apex Timepiece
                <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. CATALOGUE PRODUCT GRID */}
      <section id="catalogue-grid" className="space-y-6">
        <h3 className="font-display text-2xl font-black italic text-white uppercase tracking-tighter border-b border-white/10 pb-2">
          {selectedCategory === 'all' ? 'All Performance Equipment' : `${selectedCategory} Equipment`}
        </h3>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-[#111114] border border-white/10 space-y-3">
            <ShoppingBag size={32} className="text-white/20 mx-auto" />
            <p className="text-xs font-mono text-white/40">NO EQUIPMENTS FOUND MATCHING QUERY</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                id={`product-card-${product.id}`}
                className="group overflow-hidden bg-[#111114] border border-white/10 hover:border-white/20 flex flex-col justify-between transition-all duration-300"
              >
                
                {/* Product image section */}
                <div 
                  onClick={() => onSelectProduct(product.id)}
                  className="relative h-48 bg-[#050505] flex items-center justify-center p-6 border-b border-white/5 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 racing-grid opacity-5 pointer-events-none" />
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    referrerPolicy="no-referrer"
                    className="w-full max-h-[140px] object-contain mix-blend-luminosity hover:mix-blend-normal transform group-hover:scale-105 transition-transform duration-500" 
                  />

                  {product.isLimited && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#FF3E00]/10 border border-[#FF3E00]/30 text-[9px] font-mono text-[#FF3E00] uppercase font-bold">
                      LIMITED STOCK ({product.stock})
                    </span>
                  )}
                  
                  <span className="absolute bottom-3 right-3 text-[9px] font-mono text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    QUICK INSPECT →
                  </span>
                </div>

                {/* Details and Add to cart */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-[#FF3E00] tracking-widest uppercase block font-bold">
                      {product.category}
                    </span>
                    <h4 
                      onClick={() => onSelectProduct(product.id)}
                      className="font-display font-black text-lg text-white hover:text-[#FF3E00] transition-colors cursor-pointer uppercase truncate"
                    >
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-white/60 line-clamp-2">
                      {product.tagline}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-2">
                    <span className="text-xl font-display font-black italic text-white">${product.price}</span>
                    <button 
                      onClick={() => onAddToCart(product)}
                      className="px-3 py-1.5 bg-white hover:bg-white/90 text-black text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                    >
                      <ShoppingBag size={12} />
                      Add to Cart
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. DYNAMIC CART SIDEBAR OVERLAY */}
      {cartOpen && (
        <div id="cart-overlay" className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          
          {/* Sliding panel */}
          <div className="relative w-full max-w-md h-full bg-[#111114] border-l border-white/10 p-6 flex flex-col justify-between z-10 shadow-2xl animate-slide-in">
            
            <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-[#FF3E00]" size={18} />
                  <h3 className="font-display font-black italic text-lg text-white uppercase tracking-wider">Your Crew Order</h3>
                </div>
                <button 
                  onClick={() => setCartOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {checkoutComplete ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-[#FF3E00]/10 border border-[#FF3E00]/30 flex items-center justify-center animate-bounce">
                    <CheckCircle2 size={32} className="text-[#FF3E00]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-black italic text-lg text-white uppercase">ORDER SECURED</h4>
                    <p className="text-xs text-white/60 max-w-xs font-sans">
                      Payment node decrypted. Velocity telemetry package queued for delivery to driver profile.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#FF3E00] tracking-widest uppercase animate-pulse font-bold">
                    CALIBRATING TRACK NODES...
                  </span>
                </div>
              ) : cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                  <ShoppingBag size={48} className="text-white/5" />
                  <div className="space-y-1">
                    <p className="text-sm font-display font-black italic text-white uppercase">Your cart is empty</p>
                    <p className="text-xs text-white/40 max-w-[240px] font-sans">
                      Add technical equipment or limited edition gear to start calibration.
                    </p>
                  </div>
                </div>
              ) : (
                /* Cart Items List scrollable */
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {cart.map((item) => (
                    <div 
                      key={item.product.id}
                      className="p-3 bg-[#050505] border border-white/5 flex items-center gap-4 group"
                    >
                      <div className="w-14 h-14 bg-[#111114] p-1.5 flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-display font-black text-xs text-white truncate uppercase">
                            {item.product.name}
                          </h4>
                          <button 
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="text-white/40 hover:text-[#FF3E00] transition-colors shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono text-[#FF3E00] font-bold">
                            ${item.product.price}
                          </span>
                          
                          {/* Quantity selector increment/decrement */}
                          <div className="flex items-center gap-2 bg-[#111114] border border-white/10 px-1 py-0.5">
                            <button 
                              onClick={() => onUpdateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                              className="text-white/40 hover:text-white transition-colors"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="text-[10px] font-mono text-white font-bold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => onUpdateCartQuantity(item.product.id, item.quantity + 1)}
                              className="text-white/40 hover:text-white transition-colors"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtotal section */}
            {!checkoutComplete && cart.length > 0 && (
              <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-white/40">
                    <span>Crew Subtotal</span>
                    <span>${cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Shipping Delivery</span>
                    <span className="text-green-400 font-bold">FREE S-CLUB</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-white/5">
                    <span>Total Cost</span>
                    <span>${cartSubtotal}</span>
                  </div>
                </div>

                <button 
                  onClick={handleTriggerCheckout}
                  className="w-full py-3 bg-[#FF3E00] hover:bg-[#FF3E00]/90 text-black transition-colors text-xs font-mono font-black italic tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  <Check size={14} strokeWidth={3} />
                  Authorize Telemetry Checkout
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
