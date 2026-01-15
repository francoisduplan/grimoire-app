"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Book, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect, useRef, useCallback } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY.current;
    
    // Seuil pour éviter les micro-mouvements
    if (Math.abs(scrollDelta) < 10) return;
    
    if (scrollDelta > 0 && currentScrollY > 80) {
      // Scroll vers le bas - cacher la nav
      setIsNavVisible(false);
    } else if (scrollDelta < 0) {
      // Scroll vers le haut - montrer la nav
      setIsNavVisible(true);
    }
    
    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset nav visibility on route change
  useEffect(() => {
    setIsNavVisible(true);
    lastScrollY.current = window.scrollY;
  }, [pathname]);

  const tabs = [
    { name: 'Accueil', href: '/', icon: Home },
    { name: 'Grimoire', href: '/grimoire', icon: Book },
    { name: 'Stats', href: '/stats', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-white/5 bg-transparent">
      
      <main className="flex-1 pb-24 px-4 pt-6">
        {children}
      </main>
      
      {/* Barre de navigation givrée et flottante */}
      <nav 
        className={cn(
          "fixed bottom-0 w-full max-w-md bg-[#030014]/80 backdrop-blur-xl border-t border-white/10 z-50 transition-transform duration-300 ease-out",
          isNavVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex justify-around items-center h-20 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full transition-all duration-300 group",
                  isActive ? "text-magic-gold" : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-full transition-all duration-300 mb-1",
                  isActive ? "bg-magic-gold/10 scale-110" : "group-hover:bg-white/5"
                )}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-cinzel tracking-widest uppercase transition-all duration-300",
                  isActive ? "opacity-100 font-bold text-magic-gold" : "opacity-60 text-neutral-500 font-medium group-hover:text-neutral-300 group-hover:opacity-100"
                )}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
