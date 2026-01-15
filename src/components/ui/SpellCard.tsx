"use client";

import { Spell } from "@/types";
import { Flame, Shield, Eye, Sparkles, Skull, Zap, Move, Clock, Box, Brain, ArrowUp, ArrowDown, Book, Star } from 'lucide-react';
import { clsx } from 'clsx';

interface SpellCardProps {
  spell: Spell;
  onClick?: () => void;
  isPrepared?: boolean;
  isKnown?: boolean; // Pour le grimoire
  isActiveEffect?: boolean; // Pour les buffs actifs
  isFreeCast?: boolean; // Pour le sort gratuit
}

export function SpellCard({ spell, onClick, isPrepared = false, isKnown = false, isActiveEffect = false, isFreeCast = false }: SpellCardProps) {
  
  const isRituel = spell.ritual;
  const isDon = ['Don', 'Aptitude', 'Chronomancie'].includes(spell.school);

  // Configuration visuelle selon l'école ou le type de dégâts
  const getTheme = () => {
    // 1. SI GRATUIT : Thème OR Forcé
    if (isFreeCast) return {
      color: 'text-amber-400',
      bg: 'from-amber-950/40 to-black',
      border: 'border-amber-400',
      icon: Star,
      glow: 'shadow-amber-500/20'
    };

    if (isDon) return {
      color: 'text-amber-400',
      bg: 'from-amber-950/40 to-black',
      border: 'border-amber-500/40',
      icon: Star,
      glow: 'shadow-amber-500/10'
    };
    if (spell.damage?.type === 'Feu') return { 
      color: 'text-orange-500', 
      bg: 'from-orange-900/40 to-black', 
      border: 'border-orange-900/50',
      icon: Flame,
      glow: 'shadow-orange-900/20'
    };
    if (spell.school === 'Abjuration') return { 
      color: 'text-blue-400', 
      bg: 'from-blue-900/40 to-black', 
      border: 'border-blue-900/50',
      icon: Shield,
      glow: 'shadow-blue-900/20'
    };
    if (spell.school === 'Nécromancie') return { 
      color: 'text-green-500', 
      bg: 'from-green-900/40 to-black', 
      border: 'border-green-900/50',
      icon: Skull,
      glow: 'shadow-green-900/20'
    };
     if (spell.damage?.type === 'Force') return { 
      color: 'text-fuchsia-400', 
      bg: 'from-fuchsia-900/40 to-black', 
      border: 'border-fuchsia-900/50',
      icon: Sparkles,
      glow: 'shadow-fuchsia-900/20'
    };
    if (spell.school === 'Divination') return {
      color: 'text-cyan-400',
      bg: 'from-cyan-900/40 to-black',
      border: 'border-cyan-900/50',
      icon: Eye,
      glow: 'shadow-cyan-900/20'
    };
    return { 
      color: 'text-violet-400', 
      bg: 'from-violet-900/40 to-black', 
      border: 'border-violet-900/50',
      icon: Zap,
      glow: 'shadow-violet-900/20'
    };
  };

  const theme = getTheme();
  // Si c'est gratuit, on garde l'icône originale sauf si on veut tout en étoile ?
  // La demande dit "carte dorée". Je vais garder l'icône originale mais la colorer en or.
  const Icon = isFreeCast ? (spell.damage?.type === 'Feu' ? Flame : spell.school === 'Abjuration' ? Shield : theme.icon) : theme.icon;

  // Calcul des dégâts min-max pour l'affichage "8~48"
  const getDamageRange = () => {
    if (!spell.damage) return null;
    // Support des notations "d" et "D"
    const diceStr = spell.damage.dice.toLowerCase();
    const parts = diceStr.split('d');
    if (parts.length === 2) {
      const numDice = parseInt(parts[0]);
      const dieSize = parseInt(parts[1]);
      if (!isNaN(numDice) && !isNaN(dieSize)) {
        return `${numDice}~${numDice * dieSize}`;
      }
    }
    // Cas spécial pour 3x(1D4+1) ou 3x 2D6 etc
    if (diceStr.includes('3x')) return "6~15"; 
    return null;
  };

  const damageRange = getDamageRange();

  // Logique d'affichage Grisé vs Allumé
  // Si on est dans le grimoire (isKnown=true), on inverse : les sorts préparés sont grisés (car "pris"), les autres sont allumés.
  // Sinon (Accueil), les sorts préparés sont allumés.
  const isActive = isKnown ? !isPrepared : (isPrepared || isDon);

  return (
    <div 
      onClick={onClick}
      className={clsx(
        "relative w-full rounded-xl border transition-all duration-300 group cursor-pointer overflow-hidden",
        "bg-gradient-to-br backdrop-blur-sm",
        theme.bg,
        isActive 
          ? (isFreeCast 
              ? "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] ring-1 ring-amber-400 animate-pulse-slow" // Glow battant
              : `border-opacity-100 ${theme.border} ring-1 ring-white/5`
            )
          : "border-white/5 opacity-50 grayscale-[0.8] hover:grayscale-0 hover:opacity-100",
        isDon ? "rounded-tr-3xl" : "", // Forme un peu différente pour les dons
        "hover:shadow-lg hover:scale-[1.01]"
      )}
    >
      {/* Texture noise overlay (optional CSS trick, keeping it simple here with gradients) */}
      
      <div className="p-5 relative z-10">
        
        {/* Indicateur Sort Gratuit (Maîtrise des Sorts) */}
        {isFreeCast && (
          <div className="absolute inset-0 border-2 border-amber-400/50 rounded-xl pointer-events-none z-20 shadow-[inset_0_0_15px_rgba(251,191,36,0.3)]">
             <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-amber-950 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-b-md border-x border-b border-amber-500/50 shadow-lg tracking-widest uppercase">
               GRATUIT
             </div>
          </div>
        )}

        {/* Indicateur d'Effet Actif */}
        {isActiveEffect && (
          <div className="absolute inset-0 border-2 border-cyan-400/50 rounded-xl animate-pulse pointer-events-none z-20 shadow-[inset_0_0_20px_rgba(34,211,238,0.2)]"></div>
        )}

        {/* Header: Name & Icon */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className={clsx("text-xl font-bold font-serif tracking-wide", isActive ? (isFreeCast ? "text-amber-200 drop-shadow-md" : "text-magic-gold") : "text-gray-400")}>
              {spell.name}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500 mt-1">
              <span className={theme.color}>{spell.school}</span>
              {!isDon && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <span>{spell.level === 0 ? "Tour de magie" : `Niveau ${spell.level}`}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Glowing Icon Container */}
          <div className="relative">
             <div className={clsx(
              "w-10 h-10 rounded-lg flex items-center justify-center border bg-black/40 shadow-[0_0_15px_rgba(0,0,0,0.5)]",
              theme.border,
              theme.color
            )}>
              <Icon size={20} strokeWidth={2.5} className="drop-shadow-[0_0_8px_currentColor]" />
            </div>
            
            {/* Indicateur Rituel */}
            {isRituel && (
              <div className="absolute -bottom-2 -right-2 bg-[#0a0a0a] border border-white/20 p-1 rounded-full text-neutral-400" title="Rituel">
                <Book size={10} />
              </div>
            )}
          </div>
        </div>

        {/* Damage OR Effect Section - The "Hero" content */}
        {spell.damage ? (
          <div className="my-4 py-2 border-y border-white/5 flex items-center gap-4">
            <div className="flex-1">
              {damageRange && (
                <div className={clsx("text-2xl font-bold font-serif leading-none", isActive ? "text-gray-100" : "text-gray-400")}>
                  {damageRange} <span className="text-sm text-gray-500 font-sans font-normal">dégâts</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
              <span className={clsx("font-bold font-mono text-sm", theme.color)}>{spell.damage.dice}</span>
              <span className="text-xs text-gray-400 uppercase">{spell.damage.type}</span>
            </div>
          </div>
        ) : spell.effect ? (
           <div className="my-4 py-2 border-y border-white/5 flex items-center gap-4">
            <div className="flex-1">
              <div className={clsx("text-2xl font-bold font-serif leading-none", isActive ? "text-gray-100" : "text-gray-400")}>
                  {spell.effect.value} <span className="text-sm text-gray-500 font-sans font-normal">{spell.effect.label}</span>
              </div>
            </div>
             <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
              {spell.effect.type === 'Debuff' ? <ArrowDown size={14} className={theme.color} /> : <ArrowUp size={14} className={theme.color} />}
              <span className={clsx("font-bold font-mono text-sm", theme.color)}>{spell.effect.type}</span>
            </div>
           </div>
        ) : null}

        {/* Narrative / Description Short */}
        {!spell.damage && !spell.effect && (
          <p className="my-4 text-sm text-gray-500 italic line-clamp-2 font-serif">
            {spell.description}
          </p>
        )}

        {/* Footer Mechanics Icons (Caché pour les dons parfois) */}
        {!isDon && (
          <div className="flex items-center justify-between mt-2 pt-2 text-xs text-gray-500">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5" title="Portée">
                <Move size={12} />
                <span>{spell.range}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Durée">
                <Clock size={12} />
                <span>{spell.duration.replace("Concentration, jusqu'à ", "").replace("Jusqu'à ", "")}</span>
              </div>
              {spell.concentration && (
                <div className="flex items-center gap-1.5 text-blue-400" title="Concentration">
                  <Brain size={12} />
                  <span>Conc.</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300">
              <Box size={10} />
              <span className="uppercase font-bold text-[10px] tracking-wide">{spell.castingTime}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
