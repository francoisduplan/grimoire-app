"use client";

import { Spell } from "@/types";
import { Flame, Shield, Eye, Sparkles, Skull, Zap, Move, Clock, Box, Brain, ArrowUp, ArrowDown, Book, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { useCharacter } from "@/context/CharacterContext";

interface SpellCardProps {
  spell: Spell;
  onClick?: () => void;
  isPrepared?: boolean;
  isKnown?: boolean; // Pour le grimoire
  isActiveEffect?: boolean; // Pour les buffs actifs
  isFreeCast?: boolean; // Pour le sort gratuit
}

export function SpellCard({ spell, onClick, isPrepared = false, isKnown = false, isActiveEffect = false, isFreeCast = false }: SpellCardProps) {
  const { character } = useCharacter();
  
  // Calcul du scaling des cantrips basé sur le niveau du personnage
  const getCantripScaling = () => {
    if (spell.level !== 0 || !spell.damage || !spell.higherLevels) return 1;
    const charLevel = character.level || 1;
    if (charLevel >= 17) return 4;
    if (charLevel >= 11) return 3;
    if (charLevel >= 5) return 2;
    return 1;
  };
  const cantripMultiplier = getCantripScaling();
  
  // Obtenir les dés affichés (avec scaling cantrip si applicable)
  const getDisplayDice = () => {
    if (!spell.damage) return null;
    
    // Scaling des cantrips
    if (spell.level === 0 && spell.higherLevels && cantripMultiplier > 1) {
      const match = spell.damage.dice.match(/(\d+)D(\d+)/i);
      if (match) {
        return `${cantripMultiplier}D${match[2]}`;
      }
    }
    
    return spell.damage.displayDice || spell.damage.dice;
  };
  
  const isRituel = spell.ritual;
  const isDon = ['Don', 'Aptitude', 'Chronomancie'].includes(spell.school);

  // Configuration visuelle selon le type de dégâts OU l'école
  const getTheme = () => {
    // 1. SI GRATUIT : Thème OR Forcé
    if (isFreeCast) return {
      color: 'text-amber-400',
      bg: 'from-amber-950/40 to-black',
      border: 'border-amber-400',
      icon: Star,
      glow: 'shadow-amber-500/20'
    };

    // 2. Dons / Aptitudes / Chronomancie → Or
    if (isDon) return {
      color: 'text-amber-400',
      bg: 'from-amber-950/40 to-black',
      border: 'border-amber-500/40',
      icon: Star,
      glow: 'shadow-amber-500/10'
    };

    // 3. Par TYPE DE DÉGÂTS (priorité)
    if (spell.damage?.type === 'Feu') return { 
      color: 'text-orange-400', 
      bg: 'from-orange-950/50 to-black', 
      border: 'border-orange-500/40',
      icon: Flame,
      glow: 'shadow-orange-500/20'
    };
    if (spell.damage?.type === 'Tonnerre') return { 
      color: 'text-sky-400', 
      bg: 'from-sky-950/50 to-black', 
      border: 'border-sky-500/40',
      icon: Zap,
      glow: 'shadow-sky-500/20'
    };
    if (spell.damage?.type === 'Force') return { 
      color: 'text-fuchsia-400', 
      bg: 'from-fuchsia-950/50 to-black', 
      border: 'border-fuchsia-500/40',
      icon: Sparkles,
      glow: 'shadow-fuchsia-500/20'
    };
    if (spell.damage?.type === 'Froid') return { 
      color: 'text-cyan-300', 
      bg: 'from-cyan-950/50 to-black', 
      border: 'border-cyan-400/40',
      icon: Sparkles,
      glow: 'shadow-cyan-400/20'
    };
    if (spell.damage?.type === 'Variable') return { 
      color: 'text-violet-400', 
      bg: 'from-violet-950/50 to-black', 
      border: 'border-violet-500/40',
      icon: Sparkles,
      glow: 'shadow-violet-500/20'
    };

    // 4. Par ÉCOLE (sorts utilitaires)
    if (spell.school === 'Abjuration') return { 
      color: 'text-blue-400', 
      bg: 'from-blue-950/50 to-black', 
      border: 'border-blue-500/40',
      icon: Shield,
      glow: 'shadow-blue-500/20'
    };
    if (spell.school === 'Divination') return {
      color: 'text-cyan-400',
      bg: 'from-cyan-950/50 to-black',
      border: 'border-cyan-500/40',
      icon: Eye,
      glow: 'shadow-cyan-500/20'
    };
    if (spell.school === 'Illusion') return { 
      color: 'text-purple-400', 
      bg: 'from-purple-950/50 to-black', 
      border: 'border-purple-500/40',
      icon: Eye,
      glow: 'shadow-purple-500/20'
    };
    if (spell.school === 'Nécromancie') return { 
      color: 'text-emerald-400', 
      bg: 'from-emerald-950/50 to-black', 
      border: 'border-emerald-500/40',
      icon: Skull,
      glow: 'shadow-emerald-500/20'
    };
    if (spell.school === 'Conjuration') return { 
      color: 'text-teal-400', 
      bg: 'from-teal-950/50 to-black', 
      border: 'border-teal-500/40',
      icon: Sparkles,
      glow: 'shadow-teal-500/20'
    };
    if (spell.school === 'Enchantement') return { 
      color: 'text-pink-400', 
      bg: 'from-pink-950/50 to-black', 
      border: 'border-pink-500/40',
      icon: Brain,
      glow: 'shadow-pink-500/20'
    };
    if (spell.school === 'Transmutation') return { 
      color: 'text-yellow-400', 
      bg: 'from-yellow-950/50 to-black', 
      border: 'border-yellow-500/40',
      icon: Sparkles,
      glow: 'shadow-yellow-500/20'
    };
    if (spell.school === 'Évocation') return { 
      color: 'text-red-400', 
      bg: 'from-red-950/50 to-black', 
      border: 'border-red-500/40',
      icon: Flame,
      glow: 'shadow-red-500/20'
    };

    // Défaut → Violet
    return { 
      color: 'text-violet-400', 
      bg: 'from-violet-950/50 to-black', 
      border: 'border-violet-500/40',
      icon: Sparkles,
      glow: 'shadow-violet-500/20'
    };
  };

  const theme = getTheme();
  // Si c'est gratuit, on garde l'icône originale sauf si on veut tout en étoile ?
  // La demande dit "carte dorée". Je vais garder l'icône originale mais la colorer en or.
  const Icon = isFreeCast ? (spell.damage?.type === 'Feu' ? Flame : spell.school === 'Abjuration' ? Shield : theme.icon) : theme.icon;

  // Calcul des dégâts min-max pour l'affichage "8~48"
  const getDamageRange = () => {
    if (!spell.damage) return null;
    
    // Utiliser displayDice si disponible, sinon dice
    let diceStr = (spell.damage.displayDice || spell.damage.dice).toLowerCase();
    
    // Pour les cantrips avec scaling, utiliser les dés modifiés
    if (spell.level === 0 && spell.higherLevels && cantripMultiplier > 1) {
      const match = spell.damage.dice.match(/(\d+)D(\d+)/i);
      if (match) {
        diceStr = `${cantripMultiplier}d${match[2]}`;
      }
    }
    
    // Cas spécial Magic Missile: Nx(1D4+1) = N × (1+1) à N × (4+1)
    const magicMissileMatch = diceStr.match(/(\d+)[x×]\(1d4\+1\)/);
    if (magicMissileMatch) {
      const projectiles = parseInt(magicMissileMatch[1]);
      const min = projectiles * 2;  // N × (1+1)
      const max = projectiles * 5;  // N × (4+1)
      return `${min}~${max}`;
    }
    
    // Cas multi-attaques comme Rayon ardent: "NxXDY" ou displayDice "3×2D6"
    const multiAttackMatch = diceStr.match(/(\d+)[x×](\d+)d(\d+)/i);
    if (multiAttackMatch) {
      const attacks = parseInt(multiAttackMatch[1]);
      const numDice = parseInt(multiAttackMatch[2]);
      const dieSize = parseInt(multiAttackMatch[3]);
      const totalDice = attacks * numDice;
      const min = totalDice;           // Tous les 1
      const max = totalDice * dieSize; // Tous au max
      return `${min}~${max}`;
    }
    
    // Standard: "XDY" ou "XDY+Z"
    const match = diceStr.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (match) {
      const numDice = parseInt(match[1]);
      const dieSize = parseInt(match[2]);
      const modifier = match[3] ? parseInt(match[3]) : 0;
      const min = numDice + modifier;
      const max = numDice * dieSize + modifier;
      return `${min}~${max}`;
    }
    
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
              <span className={clsx("font-bold font-mono text-sm", cantripMultiplier > 1 ? "text-amber-400" : theme.color)}>{getDisplayDice()}</span>
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
