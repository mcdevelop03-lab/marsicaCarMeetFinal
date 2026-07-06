/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Check, 
  Sparkles,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import { shopProducts } from '../data';
import { Product } from '../types';

interface ProductDetailViewProps {
  productId: string;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (productId: string) => void;
}

export default function ProductDetailView({ 
  productId, 
  onBack, 
  onAddToCart,
  onSelectProduct
}: ProductDetailViewProps) {
  // Find product
  const product = shopProducts.find(p => p.id === productId) || shopProducts[0];
  const [activeImage, setActiveImage] = useState(product.gallery[0] || product.image);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2000);
  };

  // Filter related products
  const relatedProducts = shopProducts.filter(p => p.id !== product.id).slice(0, 3);

  return (
    <div id="product-detail-container" className="space-y-12 pb-16 animate-fade-in">
      
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#050505] hover:bg-white/5 border border-white/10 text-xs font-mono font-bold tracking-widest text-white uppercase transition-colors flex items-center gap-2 group"
        >
          <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" />
          BACK TO GALLERY SHOP
        </button>
        <span className="text-xs font-mono text-[#FF3E00] font-bold uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} />
          Authentic APEX Gear Partner
        </span>
      </div>

      {/* Main product showcase section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* Left Column: Image Gallery Viewer */}
        <div className="space-y-4">
          <div className="relative overflow-hidden border border-white/10 bg-[#050505] p-6 md:p-10 flex items-center justify-center min-h-[380px]">
            <div className="absolute inset-0 racing-grid opacity-10 pointer-events-none" />
            <img 
              src={activeImage} 
              alt={product.name} 
              referrerPolicy="no-referrer"
              className="max-h-[300px] w-auto object-contain transform hover:scale-105 transition-transform duration-700" 
            />

            {product.isLimited && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#FF3E00]/10 border border-[#FF3E00]/30 text-[10px] font-mono text-[#FF3E00] uppercase tracking-widest font-black">
                LIMITED SPECIMEN (ONLY {product.stock} REMAINING)
              </span>
            )}
          </div>

          {/* Gallery Thumbnails row */}
          {product.gallery.length > 1 && (
            <div className="flex gap-2 justify-center">
              {product.gallery.map((thumb, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(thumb)}
                  className={`w-20 h-20 bg-[#111114] p-2 flex items-center justify-center border overflow-hidden transition-all ${activeImage === thumb ? 'border-[#FF3E00] scale-102' : 'border-white/10 hover:border-white/25'}`}
                >
                  <img src={thumb} alt={`Thumbnail ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Specs details & Order CTA */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="px-2.5 py-1 bg-[#111114] border border-white/10 text-[10px] font-mono tracking-widest text-white/60 uppercase font-bold">
              {product.category}
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter leading-none pt-1">
              {product.name}
            </h1>
            <p className="text-sm font-mono text-[#FF3E00] tracking-wide uppercase font-bold">
              {product.tagline}
            </p>
          </div>

          {/* Price Tag */}
          <div className="flex items-baseline gap-3 border-y border-white/10 py-4">
            <span className="text-3xl font-display font-black italic text-white">${product.price}</span>
            <span className="text-sm text-white/40 line-through font-mono">$1,250</span>
            <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[10px] uppercase font-bold">
              32% COUPE SAVINGS
            </span>
          </div>

          {/* Description */}
          <p className="text-xs md:text-sm text-white/60 leading-relaxed font-sans">
            {product.description}
          </p>

          {/* Adding to cart interface */}
          <div className="space-y-3 pt-2">
            <button 
              onClick={handleAddToCart}
              className={`w-full py-3.5 text-xs font-mono font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${addedSuccess ? 'bg-green-600 text-white font-black' : 'bg-[#FF3E00] hover:bg-[#FF3E00]/90 text-black font-black italic'}`}
            >
              {addedSuccess ? (
                <>
                  <Check size={16} strokeWidth={3} />
                  GEAR ADDED TO CREW INVENTORY
                </>
              ) : (
                <>
                  <ShoppingBag size={14} />
                  SECURE COLLAB ORDER
                </>
              )}
            </button>
            <p className="text-[10px] font-mono text-white/40 text-center uppercase tracking-wider">
              * SECURE SSL OUTLAW CHECKOUT • SHIPPED SECURELY FROM HIGH-OCTANE STORES
            </p>
          </div>

          {/* Quick trust flags */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[10px] font-mono text-white/40">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#FF3E00]" />
              <span>1YR GUARANTEE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck size={14} className="text-[#FF3E00]" />
              <span>S-MEMBER SHIPS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw size={14} className="text-[#FF3E00]" />
              <span>EASY EXCHANGE</span>
            </div>
          </div>
        </div>

      </section>

      {/* 3. DETAILED SPECS GRID BOX */}
      <section className="p-6 md:p-8 bg-[#111114] border border-white/10 space-y-6">
        <h3 className="font-display text-lg font-black italic text-white uppercase tracking-tighter border-b border-white/10 pb-2">
          Technical specifications & materials
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.specs.map((spec, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 bg-[#050505] border border-white/5">
              <Check size={14} strokeWidth={3} className="text-[#FF3E00] shrink-0 mt-0.5 animate-pulse" />
              <p className="text-xs font-mono text-white/80 leading-relaxed">
                {spec}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. RELATED GEARS COUPE CARDS */}
      <section className="space-y-6">
        <h3 className="font-display text-lg font-black italic text-white uppercase tracking-tighter border-b border-white/10 pb-2">
          Complimentary Equipment
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedProducts.map((p) => (
            <div 
              key={p.id}
              onClick={() => {
                onSelectProduct(p.id);
                setActiveImage(p.gallery[0] || p.image);
              }}
              className="group p-4 bg-[#111114] hover:bg-[#050505] border border-white/10 hover:border-[#FF3E00]/40 transition-all flex items-center gap-4 cursor-pointer"
            >
              <div className="w-16 h-16 bg-[#050505] border border-white/10 p-2 flex items-center justify-center shrink-0 overflow-hidden">
                <img 
                  src={p.image} 
                  alt={p.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <span className="text-[9px] font-mono text-white/40 uppercase block">
                  {p.category}
                </span>
                <h4 className="font-display text-xs font-black text-white truncate uppercase group-hover:text-[#FF3E00] transition-colors">
                  {p.name}
                </h4>
                <div className="flex justify-between items-center pt-1 font-mono text-[11px]">
                  <span className="text-[#FF3E00] font-bold">${p.price}</span>
                  <span className="text-white/40 group-hover:text-white transition-colors">Inspect →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
