"use client";

import { Spell } from "@/types";
import { X, Clock, Ruler, Box, Hourglass, Flame, Shield, Skull, Sparkles, Zap, Brain, Move, BookOpen, Hand, Trash2, Lock, Dices, RefreshCw, Wand2, Star, Link } from 'lucide-react';
import { useCharacter } from "@/context/CharacterContext";
import { clsx } from "clsx";
import { SPELLS_DATA } from "@/data/spells";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateModifier } from "@/lib/dnd-rules";

interface SpellDetailProps {
  spell: Spell;
  onClose: () => void;
}

// --- LOGIQUE DE DÉS ---
type AttackResult = {
  attackRoll: number;      // Résultat du D20
  attackTotal: number;     // D20 + bonus
  isCrit: boolean;         // 20 naturel
  isFumble: boolean;       // 1 naturel
  damageRolls: number[];   // Dés de dégâts
  damageTotal: number;     // Total dégâts
};

type RollResult = {
  total: number;
  rolls: number[];      // Les résultats bruts [3, 4, 1]
  faces: number;        // Type de dé (d8, d6...)
  modifier: number;     // Bonus fixe (+3)
  isMultiHit: boolean;  // Pour magic missile (3x...)
  attacks?: AttackResult[]; // Pour les sorts avec jet d'attaque
};

const parseDice = (diceStr: string): { count: number; die: number; modifier: number } => {
  const normalizedStr = diceStr.toLowerCase().replace(/\s/g, '');
  const [base, modifierStr] = normalizedStr.split('+');
  const modifier = modifierStr ? parseInt(modifierStr) : 0;
  const [countStr, dieStr] = base.split('d');
  const count = parseInt(countStr);
  const die = parseInt(dieStr);
  return { count, die, modifier };
};

const rollDamage = (diceStr: string): { rolls: number[]; total: number; faces: number; modifier: number } => {
  const { count, die, modifier } = parseDice(diceStr);
  const rolls: number[] = [];
  let total = 0;
  
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * die) + 1;
    total += roll;
    rolls.push(roll);
  }
  total += modifier;
  
  return { rolls, total, faces: die, modifier };
};

const parseAndRoll = (diceStr: string, attackCount?: number, attackBonus?: number): RollResult => {
  // Normaliser en minuscules pour le parsing
  const normalizedStr = diceStr.toLowerCase();
  
  // Cas spécial Magic Missile: "Nx(1d4+1)" -> N jets de 1D4, chacun avec +1
  const magicMissileMatch = normalizedStr.match(/(\d+)x\(1d4\+1\)/);
  if (magicMissileMatch) {
    const projectileCount = parseInt(magicMissileMatch[1]);
    const rolls = [];
    let total = 0;
    for(let i=0; i<projectileCount; i++) {
       const val = Math.floor(Math.random() * 4) + 1; // 1D4 (résultat 1-4)
       rolls.push(val); // On affiche juste le dé
       total += val + 1; // +1 par projectile ajouté au total
    }
    // modifier: N car il y a +1 par projectile
    return { total, rolls, faces: 4, modifier: projectileCount, isMultiHit: true };
  }

  // Si c'est un sort avec jets d'attaque multiples
  if (attackCount && attackCount > 0 && attackBonus !== undefined) {
    const attacks: AttackResult[] = [];
    let grandTotal = 0;
    const allRolls: number[] = [];
    const { die, modifier } = parseDice(diceStr);
    
    for (let i = 0; i < attackCount; i++) {
      const attackRoll = Math.floor(Math.random() * 20) + 1;
      const isCrit = attackRoll === 20;
      const isFumble = attackRoll === 1;
      const attackTotal = attackRoll + attackBonus;
      
      // Lancer les dégâts (même si l'attaque rate, on les montre)
      const damage = rollDamage(diceStr);
      // Double les dégâts sur un crit
      const finalDamage = isCrit ? damage.total * 2 : damage.total;
      
      attacks.push({
        attackRoll,
        attackTotal,
        isCrit,
        isFumble,
        damageRolls: damage.rolls,
        damageTotal: finalDamage
      });
      
      grandTotal += finalDamage;
      allRolls.push(...damage.rolls);
    }
    
    return { 
      total: grandTotal, 
      rolls: allRolls, 
      faces: die, 
      modifier, 
      isMultiHit: attackCount > 1,
      attacks 
    };
  }

  // Standard "1D10", "2D6", "1D8+3"
  const damage = rollDamage(diceStr);
  return { ...damage, isMultiHit: false };
};

// --- COMPOSANT DÉ ANIMÉ ---
const AnimatedDie = ({ value, faces, index, themeColor, isMax, isLinked }: { 
  value: number, 
  faces: number, 
  index: number, 
  themeColor: string, 
  isMax?: boolean,
  isLinked?: boolean
}) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ 
        scale: isLinked ? [1, 1.05, 1] : 1, 
        rotate: 0, 
        opacity: 1,
        boxShadow: isMax 
          ? ["0 0 8px 2px rgba(234,179,8,0.25)", "0 0 12px 4px rgba(234,179,8,0.4)", "0 0 8px 2px rgba(234,179,8,0.25)"]
          : isLinked
            ? ["0 0 10px 2px rgba(139,92,246,0.5)", "0 0 20px 6px rgba(139,92,246,0.8)", "0 0 10px 2px rgba(139,92,246,0.5)"]
            : "0 0 0px 0px rgba(0,0,0,0)"
      }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20, 
        delay: index * 0.1,
        scale: isLinked ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {},
        boxShadow: (isMax || isLinked) ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }
      }}
      className="relative w-20 h-20 group rounded-2xl"
    >
      {/* Le Dé (Conteneur visuel) */}
      <div className={clsx(
        "relative w-full h-full flex flex-col items-center justify-center rounded-2xl border-2 backdrop-blur-sm overflow-hidden transition-colors duration-500 z-10",
        isMax 
          ? "bg-yellow-950/80 text-yellow-100 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.5)]" 
          : isLinked
            ? "bg-violet-950/80 text-violet-100 border-violet-400 shadow-[inset_0_0_20px_rgba(139,92,246,0.3)]"
            : clsx(
                "shadow-lg",
                themeColor === 'text-orange-500' ? "border-orange-500/50 bg-orange-950/40 text-orange-200" :
                themeColor === 'text-cyan-400' ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-200" :
                themeColor === 'text-emerald-400' ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-200" :
                themeColor === 'text-fuchsia-400' ? "border-fuchsia-500/50 bg-fuchsia-950/40 text-fuchsia-200" :
                "border-indigo-500/50 bg-indigo-950/40 text-indigo-200"
              )
      )}>
        {/* Shine Effect pour Max */}
        {isMax && (
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 via-transparent to-yellow-200/20"></div>
        )}
        
        {/* Shine Effect pour Linked */}
        {isLinked && !isMax && (
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/30 via-transparent to-violet-200/20 animate-pulse"></div>
        )}

        {/* Glow interne au survol */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity"></div>
        
        {/* Valeur */}
        <span className={clsx(
          "text-4xl font-bold font-serif leading-none mt-1", 
          isMax && "drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]",
          isLinked && !isMax && "drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]"
        )}>{value}</span>
        
        {/* Label */}
        <span className="text-[10px] opacity-50 font-mono leading-none mt-1">D{faces}</span>
      </div>
    </motion.div>
  );
};

// --- COMPOSANT WRAPPER POUR DÉS (SANS LIGNES, AVEC RÉSONANCE) ---
const DiceWithLinks = ({ rolls, faces, themeColor, showLinks }: { 
  rolls: number[], 
  faces: number, 
  themeColor: string,
  showLinks: boolean 
}) => {
  // Trouver les indices des dés liés (même valeur apparaît 2+ fois, par PAIRES)
  const linkedIndices = new Set<number>();
  
  if (showLinks) {
    const valueIndices: Record<number, number[]> = {};
    rolls.forEach((val, idx) => {
      if (!valueIndices[val]) valueIndices[val] = [];
      valueIndices[val].push(idx);
    });
    
    Object.values(valueIndices).forEach(indices => {
      // Pour chaque valeur, on prend les paires (0,1), (2,3), etc.
      // Si on a 3 dés (0,1,2), on prend seulement 0 et 1.
      for (let i = 0; i < indices.length - 1; i += 2) {
        linkedIndices.add(indices[i]);
        linkedIndices.add(indices[i + 1]);
      }
    });
  }
  
  return (
    <div className="flex flex-wrap justify-center gap-4 overflow-visible py-4">
      {rolls.map((val, idx) => {
        const isMax = val === faces;
        const isLinked = linkedIndices.has(idx);
        return (
          <div key={idx} className="relative z-10 overflow-visible">
            <AnimatedDie 
              value={val} 
              faces={faces} 
              index={idx} 
              themeColor={themeColor} 
              isMax={isMax}
              isLinked={isLinked}
            />
          </div>
        );
      })}
    </div>
  );
};

export function SpellDetail({ spell, onClose }: SpellDetailProps) {
  const { prepareSpell, unprepareSpell, castSpell, character, addEffect, removeEffect, setFreeCastSpell, consumeFreeCast } = useCharacter();
  
  // États locaux
  const [rollState, setRollState] = useState<'idle' | 'rolling' | 'attack' | 'damage' | 'result'>('idle');
  const [result, setResult] = useState<RollResult | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  
  // État pour upcast (surcharge)
  const [selectedLevel, setSelectedLevel] = useState(spell.level);
  const canUpcast = spell.level > 0 && spell.higherLevels;
  const upcastLevels = selectedLevel - spell.level;
  
  // Calculer les emplacements disponibles pour l'upcast
  const availableUpcastLevels = character.slots
    .filter(s => s.level >= spell.level && s.used < s.max)
    .map(s => s.level);
  
  // États pour attaques multiples
  const [currentAttackIndex, setCurrentAttackIndex] = useState(0);
  const [currentAttackRoll, setCurrentAttackRoll] = useState<{ roll: number; total: number; isCrit: boolean; isFumble: boolean } | null>(null);
  const [attackResults, setAttackResults] = useState<Array<{ attackRoll: number; attackTotal: number; isCrit: boolean; isFumble: boolean; damageRolls: number[]; damageTotal: number; skipped: boolean; isBounce?: boolean }>>([]);
  
  // État pour rebond (Orbe chromatique)
  const [hasBounce, setHasBounce] = useState(false);
  const [bounceCount, setBounceCount] = useState(0);
  
  // Calculs d'attaque
  const attackBonus = character.proficiencyBonus + Math.floor((character.abilities.INT - 10) / 2);
  
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

  // Calcul du nombre d'attaques avec upcast (Rayon ardent: +1 rayon par niveau)
  const getAttackCount = () => {
    const baseCount = spell.attackRoll?.count || 0;
    if (spell.id === 'scorching-ray' && upcastLevels > 0) {
      return baseCount + upcastLevels;
    }
    return baseCount;
  };
  const attackCount = getAttackCount();
  const hasAttackRoll = attackCount > 0;
  const canBounce = spell.canBounce || false;
  
  // Calcul des dés de dégâts avec upcast ET scaling cantrip
  const getUpcastDice = () => {
    if (!spell.damage) return '';
    const baseDice = spell.damage.dice;
    
    // Scaling des cantrips (niveau 0)
    if (spell.level === 0 && spell.higherLevels && cantripMultiplier > 1) {
      const match = baseDice.match(/(\d+)D(\d+)/i);
      if (match) {
        return `${cantripMultiplier}D${match[2]}`;
      }
    }
    
    // Magic Missile: +1 projectile par niveau (3x devient 4x, 5x, etc.)
    if (spell.id === 'magic-missile' && upcastLevels > 0) {
      const projectiles = 3 + upcastLevels;
      return `${projectiles}x(1D4+1)`;
    }
    
    // Vague tonnante, Orbe chromatique: +1D8 par niveau
    if ((spell.id === 'thunderwave' || spell.id === 'chromatic-orb') && upcastLevels > 0) {
      const match = baseDice.match(/(\d+)D(\d+)/i);
      if (match) {
        const newCount = parseInt(match[1]) + upcastLevels;
        return `${newCount}D${match[2]}`;
      }
    }
    
    // Rayon ardent: les dés restent 2D6 mais plus de rayons (géré dans attackCount)
    return baseDice;
  };
  const upcastDice = getUpcastDice();
  
  // Affichage des dés pour l'interface (plus lisible)
  const getUpcastDisplayDice = () => {
    // Scaling des cantrips
    if (spell.level === 0 && spell.higherLevels && cantripMultiplier > 1) {
      const match = spell.damage?.dice.match(/(\d+)D(\d+)/i);
      if (match) {
        return `${cantripMultiplier}D${match[2]}`;
      }
    }
    
    // Magic Missile
    if (spell.id === 'magic-missile' && upcastLevels > 0) {
      const projectiles = 3 + upcastLevels;
      return `${projectiles}×(1D4+1)`;
    }
    
    // Rayon ardent: afficher le nouveau nombre de rayons
    if (spell.id === 'scorching-ray' && upcastLevels > 0) {
      const rays = 3 + upcastLevels;
      return `${rays}×2D6`;
    }
    
    // Autres sorts: afficher les dés upcastés
    return upcastDice.toUpperCase();
  };
  
  // Vérifier si le cantrip a été amélioré par le niveau
  const isCantripScaled = spell.level === 0 && spell.higherLevels && cantripMultiplier > 1;

  // Hooks & Logic
  const isPrepared = character.preparedSpells.includes(spell.id);
  const isAlwaysPrepared = spell.level === 0 || ['Don', 'Aptitude', 'Chronomancie'].includes(spell.school);
  const effectivePrepared = isPrepared || isAlwaysPrepared;

  // Free Cast Logic
  const freeCastState = character.dailyFreeCast;
  const isThisFreeCast = freeCastState.available && freeCastState.spellId === spell.id;
  const canSelectAsFreeCast = freeCastState.available && freeCastState.spellId === null && spell.level > 0;

  // Animation d'activation "Gratuit"
  useEffect(() => {
    if (isThisFreeCast && justUnlocked) {
      const timer = setTimeout(() => setJustUnlocked(false), 2500); // Durée de l'effet
      return () => clearTimeout(timer);
    }
  }, [isThisFreeCast, justUnlocked]);

  // Bloquer le scroll du body quand la modal est ouverte (fix mobile)
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${window.scrollY}px`;
    
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = originalStyle;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, []);

  const spellSlot = character.slots.find(s => s.level === spell.level);
  const hasSlotsAvailable = spell.level === 0 || (spellSlot && spellSlot.used < spellSlot.max) || isThisFreeCast;
  
  // Active Effect Logic
  const isActiveEffect = character.activeEffects.some(e => e.id === spell.id);
  const hasBuffEffect = spell.effect && ['Buff', 'Défense'].includes(spell.effect.type);

  // Limites - Cap fixe de 12 sorts (hors cantrips et dons)
  const maxPrepared = 12;
  const currentPreparedCount = character.preparedSpells.filter(id => {
     const s = SPELLS_DATA.find(d => d.id === id);
     return s && s.level > 0 && !['Don', 'Aptitude', 'Chronomancie'].includes(s.school);
  }).length;
  const countsTowardsLimit = spell.level > 0 && !['Don', 'Aptitude', 'Chronomancie'].includes(spell.school);
  const isFull = countsTowardsLimit && currentPreparedCount >= maxPrepared;

  // --- THEME COLORS ---
  const getTheme = () => {
    // 1. Priorité au statut GRATUIT pour tout surcharger en Or
    if (isThisFreeCast) return {
      accent: 'text-amber-400 border-amber-400/50 shadow-amber-400/40',
      glow: 'bg-amber-400',
      glowRgb: '251, 191, 36',
      glowShadow: '0 0 10px rgba(251, 191, 36, 0.1)',
      glowShadowHover: '0 0 15px rgba(251, 191, 36, 0.18)',
      btnGradient: 'from-amber-600 to-yellow-900',
      btnShadow: 'shadow-amber-900/40',
      btnBorder: 'border-amber-400',
      textGradient: 'from-amber-200 via-amber-400 to-yellow-500'
    };

    // 2. Buffs actifs → Cyan
    if (isActiveEffect) return {
      accent: 'text-cyan-400 border-cyan-400/50 shadow-cyan-400/40',
      glow: 'bg-cyan-400',
      glowRgb: '34, 211, 238',
      glowShadow: '0 0 10px rgba(34, 211, 238, 0.1)',
      glowShadowHover: '0 0 15px rgba(34, 211, 238, 0.18)',
      btnGradient: 'from-cyan-600 to-blue-900',
      btnShadow: 'shadow-cyan-900/40',
      btnBorder: 'border-cyan-400',
      textGradient: 'from-cyan-200 via-cyan-400 to-blue-500'
    };

    // 3. Dons / Aptitudes / Chronomancie → Or
    if (['Aptitude', 'Don', 'Chronomancie'].includes(spell.school)) return {
      accent: 'text-amber-400 border-amber-400/30 shadow-amber-400/20',
      glow: 'bg-amber-400',
      glowRgb: '251, 191, 36',
      glowShadow: '0 0 10px rgba(251, 191, 36, 0.1)',
      glowShadowHover: '0 0 15px rgba(251, 191, 36, 0.18)',
      btnGradient: 'from-amber-600 to-yellow-900',
      btnShadow: 'shadow-amber-900/40',
      btnBorder: 'border-amber-500/40',
      textGradient: 'from-amber-200 via-amber-400 to-yellow-500'
    };

    // 4. Par TYPE DE DÉGÂTS (priorité)
    if (spell.damage?.type === 'Feu') return {
      accent: 'text-orange-400 border-orange-400/30 shadow-orange-400/20',
      glow: 'bg-orange-400',
      glowRgb: '251, 146, 60',
      glowShadow: '0 0 10px rgba(251, 146, 60, 0.1)',
      glowShadowHover: '0 0 15px rgba(251, 146, 60, 0.18)',
      btnGradient: 'from-orange-600 to-red-900',
      btnShadow: 'shadow-orange-900/40',
      btnBorder: 'border-orange-500/40',
      textGradient: 'from-orange-200 via-orange-400 to-red-500'
    };
    if (spell.damage?.type === 'Tonnerre') return {
      accent: 'text-sky-400 border-sky-400/30 shadow-sky-400/20',
      glow: 'bg-sky-400',
      glowRgb: '56, 189, 248',
      glowShadow: '0 0 10px rgba(56, 189, 248, 0.1)',
      glowShadowHover: '0 0 15px rgba(56, 189, 248, 0.18)',
      btnGradient: 'from-sky-600 to-blue-900',
      btnShadow: 'shadow-sky-900/40',
      btnBorder: 'border-sky-500/40',
      textGradient: 'from-sky-200 via-sky-400 to-blue-500'
    };
    if (spell.damage?.type === 'Force') return {
      accent: 'text-fuchsia-400 border-fuchsia-400/30 shadow-fuchsia-400/20',
      glow: 'bg-fuchsia-400',
      glowRgb: '232, 121, 249',
      glowShadow: '0 0 10px rgba(232, 121, 249, 0.1)',
      glowShadowHover: '0 0 15px rgba(232, 121, 249, 0.18)',
      btnGradient: 'from-fuchsia-600 to-purple-900',
      btnShadow: 'shadow-fuchsia-900/40',
      btnBorder: 'border-fuchsia-500/40',
      textGradient: 'from-fuchsia-200 via-fuchsia-400 to-purple-500'
    };
    if (spell.damage?.type === 'Froid') return {
      accent: 'text-cyan-300 border-cyan-300/30 shadow-cyan-300/20',
      glow: 'bg-cyan-300',
      glowRgb: '103, 232, 249',
      glowShadow: '0 0 10px rgba(103, 232, 249, 0.1)',
      glowShadowHover: '0 0 15px rgba(103, 232, 249, 0.18)',
      btnGradient: 'from-cyan-600 to-blue-900',
      btnShadow: 'shadow-cyan-900/40',
      btnBorder: 'border-cyan-400/40',
      textGradient: 'from-cyan-100 via-cyan-300 to-blue-400'
    };
    if (spell.damage?.type === 'Variable') return {
      accent: 'text-violet-400 border-violet-400/30 shadow-violet-400/20',
      glow: 'bg-violet-400',
      glowRgb: '167, 139, 250',
      glowShadow: '0 0 10px rgba(167, 139, 250, 0.1)',
      glowShadowHover: '0 0 15px rgba(167, 139, 250, 0.18)',
      btnGradient: 'from-violet-600 to-indigo-900',
      btnShadow: 'shadow-violet-900/40',
      btnBorder: 'border-violet-500/40',
      textGradient: 'from-violet-200 via-violet-400 to-indigo-500'
    };

    // 5. Par ÉCOLE (sorts utilitaires)
    if (spell.school === 'Abjuration') return {
      accent: 'text-blue-400 border-blue-400/30 shadow-blue-400/20',
      glow: 'bg-blue-400',
      glowRgb: '96, 165, 250',
      glowShadow: '0 0 10px rgba(96, 165, 250, 0.1)',
      glowShadowHover: '0 0 15px rgba(96, 165, 250, 0.18)',
      btnGradient: 'from-blue-600 to-blue-900',
      btnShadow: 'shadow-blue-900/40',
      btnBorder: 'border-blue-500/40',
      textGradient: 'from-blue-200 via-blue-400 to-blue-600'
    };
    if (spell.school === 'Divination') return {
      accent: 'text-cyan-400 border-cyan-400/30 shadow-cyan-400/20',
      glow: 'bg-cyan-400',
      glowRgb: '34, 211, 238',
      glowShadow: '0 0 10px rgba(34, 211, 238, 0.1)',
      glowShadowHover: '0 0 15px rgba(34, 211, 238, 0.18)',
      btnGradient: 'from-cyan-600 to-teal-900',
      btnShadow: 'shadow-cyan-900/40',
      btnBorder: 'border-cyan-500/40',
      textGradient: 'from-cyan-200 via-cyan-400 to-teal-500'
    };
    if (spell.school === 'Illusion') return {
      accent: 'text-purple-400 border-purple-400/30 shadow-purple-400/20',
      glow: 'bg-purple-400',
      glowRgb: '192, 132, 252',
      glowShadow: '0 0 10px rgba(192, 132, 252, 0.1)',
      glowShadowHover: '0 0 15px rgba(192, 132, 252, 0.18)',
      btnGradient: 'from-purple-600 to-purple-900',
      btnShadow: 'shadow-purple-900/40',
      btnBorder: 'border-purple-500/40',
      textGradient: 'from-purple-200 via-purple-400 to-purple-600'
    };
    if (spell.school === 'Nécromancie') return {
      accent: 'text-emerald-400 border-emerald-400/30 shadow-emerald-400/20',
      glow: 'bg-emerald-400',
      glowRgb: '52, 211, 153',
      glowShadow: '0 0 10px rgba(52, 211, 153, 0.1)',
      glowShadowHover: '0 0 15px rgba(52, 211, 153, 0.18)',
      btnGradient: 'from-emerald-600 to-green-900',
      btnShadow: 'shadow-emerald-900/40',
      btnBorder: 'border-emerald-500/40',
      textGradient: 'from-emerald-200 via-emerald-400 to-green-500'
    };
    if (spell.school === 'Conjuration') return {
      accent: 'text-teal-400 border-teal-400/30 shadow-teal-400/20',
      glow: 'bg-teal-400',
      glowRgb: '45, 212, 191',
      glowShadow: '0 0 10px rgba(45, 212, 191, 0.1)',
      glowShadowHover: '0 0 15px rgba(45, 212, 191, 0.18)',
      btnGradient: 'from-teal-600 to-teal-900',
      btnShadow: 'shadow-teal-900/40',
      btnBorder: 'border-teal-500/40',
      textGradient: 'from-teal-200 via-teal-400 to-teal-600'
    };
    if (spell.school === 'Enchantement') return {
      accent: 'text-pink-400 border-pink-400/30 shadow-pink-400/20',
      glow: 'bg-pink-400',
      glowRgb: '244, 114, 182',
      glowShadow: '0 0 10px rgba(244, 114, 182, 0.1)',
      glowShadowHover: '0 0 15px rgba(244, 114, 182, 0.18)',
      btnGradient: 'from-pink-600 to-pink-900',
      btnShadow: 'shadow-pink-900/40',
      btnBorder: 'border-pink-500/40',
      textGradient: 'from-pink-200 via-pink-400 to-pink-600'
    };
    if (spell.school === 'Transmutation') return {
      accent: 'text-yellow-400 border-yellow-400/30 shadow-yellow-400/20',
      glow: 'bg-yellow-400',
      glowRgb: '250, 204, 21',
      glowShadow: '0 0 10px rgba(250, 204, 21, 0.1)',
      glowShadowHover: '0 0 15px rgba(250, 204, 21, 0.18)',
      btnGradient: 'from-yellow-600 to-amber-900',
      btnShadow: 'shadow-yellow-900/40',
      btnBorder: 'border-yellow-500/40',
      textGradient: 'from-yellow-200 via-yellow-400 to-amber-500'
    };
    if (spell.school === 'Évocation') return {
      accent: 'text-red-400 border-red-400/30 shadow-red-400/20',
      glow: 'bg-red-400',
      glowRgb: '248, 113, 113',
      glowShadow: '0 0 10px rgba(248, 113, 113, 0.1)',
      glowShadowHover: '0 0 15px rgba(248, 113, 113, 0.18)',
      btnGradient: 'from-red-600 to-red-900',
      btnShadow: 'shadow-red-900/40',
      btnBorder: 'border-red-500/40',
      textGradient: 'from-red-200 via-red-400 to-red-600'
    };

    // Défaut → Violet
    return {
      accent: 'text-violet-400 border-violet-400/30 shadow-violet-400/20',
      glow: 'bg-violet-400',
      glowRgb: '167, 139, 250',
      glowShadow: '0 0 10px rgba(167, 139, 250, 0.1)',
      glowShadowHover: '0 0 15px rgba(167, 139, 250, 0.18)',
      btnGradient: 'from-violet-600 to-indigo-900',
      btnShadow: 'shadow-violet-900/40',
      btnBorder: 'border-violet-500/40',
      textGradient: 'from-violet-200 via-violet-400 to-indigo-500'
    };
  };
  const theme = getTheme();

  // --- ACTIONS ---
  const handlePrepareToggle = () => {
    if (isPrepared) unprepareSpell(spell.id);
    else if (!isFull) prepareSpell(spell.id);
  };

  const handleSetFree = () => {
    setFreeCastSpell(spell.id);
    setJustUnlocked(true); // Déclenche l'animation
  };

  const handleCast = () => {
    // Vérifier qu'on a un emplacement au niveau sélectionné
    const selectedSlot = character.slots.find(s => s.level === selectedLevel);
    const hasSelectedSlot = selectedSlot && selectedSlot.used < selectedSlot.max;
    
    // Cas 1 : Sort à effet durable (Buff/AC) -> Toggle
    if (hasBuffEffect) {
      if (isActiveEffect) {
        removeEffect(spell.id);
      } else {
        // Consommation : Slot classique OU Free Cast
        if (spell.level > 0) {
           if (isThisFreeCast) {
             consumeFreeCast();
           } else {
             if (!hasSelectedSlot) return;
             castSpell(selectedLevel); // Utilise le niveau sélectionné
           }
        }
        
        // Ajout de l'effet
        let valueStr = spell.effect?.value || "0";
        let value = parseInt(valueStr.replace('+', '')) || 0;

        if (spell.id === 'mage-armor') value = 3; 
        
        addEffect({
          id: spell.id,
          name: spell.name,
          type: spell.effect?.label.includes("Armure") || spell.effect?.label.includes("CA") ? 'AC' : 'Other',
          value: value
        });
        
        onClose();
      }
      return;
    }

    // Cas 2 : Sort de Dégâts -> Animation
    if (spell.damage) {
      if (!hasSelectedSlot && spell.level > 0 && !isThisFreeCast) return;
      
      if (spell.level > 0) {
        if (isThisFreeCast) consumeFreeCast();
        else castSpell(selectedLevel); // Utilise le niveau sélectionné
      }

      // Reset les états d'attaque
      setCurrentAttackIndex(0);
      setCurrentAttackRoll(null);
      setAttackResults([]);
      setResult(null);

      // Si le sort a un jet d'attaque, on commence par l'attaque
      if (hasAttackRoll) {
        setRollState('rolling');
        setTimeout(() => {
          const roll = Math.floor(Math.random() * 20) + 1;
          const total = roll + attackBonus;
          setCurrentAttackRoll({
            roll,
            total,
            isCrit: roll === 20,
            isFumble: roll === 1
          });
          setRollState('attack');
        }, 600);
      } else {
        // Sort sans jet d'attaque (Magic Missile, etc.)
        setRollState('rolling');
        setTimeout(() => {
          const rollData = parseAndRoll(upcastDice);
          setResult(rollData);
          setRollState('result');
        }, 600);
      }

    } else {
      // Utilitaire
      if (spell.level > 0 && hasSlotsAvailable) {
        if (isThisFreeCast) consumeFreeCast();
        else castSpell(spell.level);
        onClose();
      } else if (spell.level === 0) {
        onClose();
      }
    }
  };

  // Doubler les dés pour un critique (2D6 -> 4D6)
  const doubleDice = (diceStr: string): string => {
    return diceStr.replace(/(\d+)D(\d+)/gi, (_, count, faces) => {
      return `${parseInt(count) * 2}D${faces}`;
    });
  };

  // Lancer les dégâts pour l'attaque courante
  const handleRollDamage = () => {
    if (!currentAttackRoll) return;
    
    const isBounceRoll = bounceCount > 0;
    
    // Si critique, doubler le nombre de dés (utilise upcastDice pour les dégâts modifiés)
    const diceToRoll = currentAttackRoll.isCrit 
      ? doubleDice(upcastDice) 
      : upcastDice;
    
    setRollState('rolling');
    setTimeout(() => {
      const damage = rollDamage(diceToRoll);
      
      // Détecter si paire pour rebond (sur les dés originaux, pas doublés)
      const hasMatchingDice = canBounce && damage.rolls.some((val, _, arr) => arr.filter(v => v === val).length >= 2);
      setHasBounce(hasMatchingDice);
      
      const newResult: typeof attackResults[0] = {
        attackRoll: currentAttackRoll.roll,
        attackTotal: currentAttackRoll.total,
        isCrit: currentAttackRoll.isCrit,
        isFumble: currentAttackRoll.isFumble,
        damageRolls: damage.rolls,
        damageTotal: damage.total,
        skipped: false,
        isBounce: isBounceRoll
      };
      
      setAttackResults(prev => [...prev, newResult]);
      setRollState('damage');
      setResult({ total: damage.total, rolls: damage.rolls, faces: damage.faces, modifier: damage.modifier, isMultiHit: false });
    }, 400);
  };

  // Passer l'attaque (raté ou choix)
  const handleSkipDamage = () => {
    if (!currentAttackRoll) return;
    
    const newResult: typeof attackResults[0] = {
      attackRoll: currentAttackRoll.roll,
      attackTotal: currentAttackRoll.total,
      isCrit: currentAttackRoll.isCrit,
      isFumble: currentAttackRoll.isFumble,
      damageRolls: [],
      damageTotal: 0,
      skipped: true
    };
    
    setAttackResults(prev => [...prev, newResult]);
    handleNextAttack();
  };

  // Passer à l'attaque suivante ou terminer
  const handleNextAttack = () => {
    setHasBounce(false);
    const nextIndex = currentAttackIndex + 1;
    
    if (nextIndex < attackCount) {
      setCurrentAttackIndex(nextIndex);
      setRollState('rolling');
      setTimeout(() => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + attackBonus;
        setCurrentAttackRoll({
          roll,
          total,
          isCrit: roll === 20,
          isFumble: roll === 1
        });
        setRollState('attack');
      }, 400);
    } else {
      // Toutes les attaques sont terminées, afficher le résultat final
      const totalDamage = attackResults.reduce((sum, r) => sum + r.damageTotal, 0) + (result?.total || 0);
      setResult(prev => prev ? { ...prev, total: totalDamage, attacks: undefined } : null);
      setRollState('result');
    }
  };

  // Gérer le rebond (Orbe chromatique)
  const handleBounce = () => {
    setBounceCount(prev => prev + 1);
    setHasBounce(false);
    setRollState('rolling');
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + attackBonus;
      setCurrentAttackRoll({
        roll,
        total,
        isCrit: roll === 20,
        isFumble: roll === 1
      });
      setRollState('attack');
    }, 400);
  };

  // Relancer tout depuis le début
  const handleReroll = () => {
    setCurrentAttackIndex(0);
    setCurrentAttackRoll(null);
    setAttackResults([]);
    setResult(null);
    setHasBounce(false);
    setBounceCount(0);
    
    if (hasAttackRoll) {
      setRollState('rolling');
      setTimeout(() => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + attackBonus;
        setCurrentAttackRoll({
          roll,
          total,
          isCrit: roll === 20,
          isFumble: roll === 1
        });
        setRollState('attack');
      }, 400);
    } else {
      setRollState('rolling');
      setTimeout(() => {
        const rollData = parseAndRoll(upcastDice);
        setResult(rollData);
        setRollState('result');
      }, 400);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ overscrollBehavior: 'contain' }}
    >
      <motion.div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md touch-none" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
        <motion.div 
        className={clsx(
          "relative w-full max-w-md bg-[#080808] rounded-xl shadow-2xl border transition-colors duration-700 flex flex-col max-h-[85vh] z-10 my-auto overflow-hidden",
          isThisFreeCast 
            ? "border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]" 
            : justUnlocked 
              ? "border-amber-400 bg-amber-950/20" 
              : "border-white/10"
        )}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          y: 0,
          boxShadow: isThisFreeCast 
            ? ["0 0 20px rgba(251,191,36,0.2)", "0 0 40px rgba(251,191,36,0.4)", "0 0 20px rgba(251,191,36,0.2)"]
            : "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 300,
          boxShadow: isThisFreeCast ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }
        }}
      >
        
        {/* Glow Ambient & Flash Activation */}
        <div className={clsx("absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 opacity-20 blur-[60px] pointer-events-none rounded-full transition-colors duration-700", theme.glow)} />
        
        {justUnlocked && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1 }}
            className="absolute inset-0 bg-gradient-to-b from-amber-400/20 via-transparent to-transparent pointer-events-none z-0"
          />
        )}

        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-neutral-500 hover:text-white transition-colors">
          <X size={24} strokeWidth={1.5} />
        </button>

        {/* --- HEADER --- */}
        <div className="relative pt-10 pb-6 px-6 text-center z-10">
           <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-md">
              <span className={clsx("text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-500", theme.accent.split(' ')[0])}>
                {spell.school}
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
              <span className="text-xs text-neutral-400 font-serif italic">Rang {spell.level}</span>
           </div>
           
           <h2 className={clsx(
             "text-4xl sm:text-5xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-b drop-shadow-sm mb-6 transition-all duration-500",
             theme.textGradient
           )}>
             {spell.name}
           </h2>

           <div className="flex justify-center items-center gap-6 text-xs text-neutral-400 border-y border-white/5 py-3">
              <div className="flex flex-col items-center gap-1">
                <Clock size={14} className={theme.accent.split(' ')[0]} />
                <span>{spell.castingTime.replace(' action', '')}</span>
              </div>
              <div className="w-px h-6 bg-white/5"></div>
              <div className="flex flex-col items-center gap-1">
                <Move size={14} className={theme.accent.split(' ')[0]} />
                <span>{spell.range.split(' ')[0]}</span>
              </div>
              <div className="w-px h-6 bg-white/5"></div>
              <div className="flex flex-col items-center gap-1">
                <Hourglass size={14} className={theme.accent.split(' ')[0]} />
                <span>{spell.duration.split(',')[0]}</span>
              </div>
           </div>
        </div>

        {/* --- BODY --- */}
        <div 
          className={clsx(
            "flex-1 px-8 pb-8 relative",
            rollState === 'rolling' ? "overflow-hidden" : "overflow-y-auto"
          )}
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}
        >
          
          <AnimatePresence mode="wait">
            {/* ETAT 1: Stats par défaut (Si pas de jet en cours) */}
            {rollState === 'idle' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-6 overflow-visible"
              >
                {spell.damage && (
                  <div className="relative group rounded-xl">
                    <div className={clsx(
                      "relative z-10 flex items-center justify-between p-5 rounded-xl border bg-[#0a0a0a]/80 backdrop-blur-md overflow-hidden",
                      "border-white/5 group-hover:border-white/10"
                    )}>
                      <div
                        className="absolute inset-0 rounded-xl pointer-events-none opacity-30 transition-opacity duration-700 group-hover:opacity-60 z-0"
                        style={{
                          background: `radial-gradient(circle at center, rgba(${theme.glowRgb}, 0.28), transparent 65%)`
                        }}
                      />
                       <div className="flex flex-col gap-1 pl-3 relative z-10">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Dégâts</span>
                          <div className="flex items-center gap-3">
                             {spell.damage.type === 'Feu' && <Flame size={20} className={theme.accent.split(' ')[0]} />}
                             {!['Feu'].includes(spell.damage.type) && <Zap size={20} className={theme.accent.split(' ')[0]} />}
                             <span className="text-lg font-serif italic text-neutral-200 capitalize">{spell.damage.type}</span>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-1 pr-4 relative z-10">
                         {upcastLevels > 0 && (
                           <span className="text-[10px] bg-violet-500/30 text-violet-300 px-2 py-0.5 rounded font-cinzel uppercase tracking-wider">
                             Niveau {selectedLevel}
                           </span>
                         )}
                         {isCantripScaled && (
                           <span className="text-[10px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-cinzel uppercase tracking-wider">
                             Niv. {character.level || 1}
                           </span>
                         )}
                         <span className={clsx(
                           "text-3xl font-bold font-serif tabular-nums drop-shadow-lg transition-colors duration-500", 
                           isThisFreeCast ? "text-amber-400" : isCantripScaled ? "text-amber-400" : upcastLevels > 0 ? "text-violet-400" : theme.accent.split(' ')[0]
                         )}>
                           {isCantripScaled || upcastLevels > 0 ? getUpcastDisplayDice() : (spell.damage.displayDice || spell.damage.dice)}
                         </span>
                       </div>
                    </div>
                  </div>
                )}
                
                {spell.effect && !spell.damage && (
                  <div className="p-5 rounded-xl bg-[#0a0a0a]/50 border border-white/5 flex items-center justify-between relative overflow-hidden">
                     {/* Détection Armure de Mage pour affichage dynamique */}
                     {(() => {
                        const isMageArmor = spell.id === 'mage-armor'; // ID plus sûr que le nom
                        const dexMod = calculateModifier(character.abilities.DEX);
                        
                        // Calcul de la valeur affichée
                        let displayValue = spell.effect.value;
                        let isDynamic = false;

                        if (isMageArmor) {
                           displayValue = `${13 + dexMod}`;
                           isDynamic = true;
                        }

                        return (
                          <>
                             <div className="flex items-center gap-3 relative z-10">
                               <Shield size={20} className={clsx(isDynamic ? "text-cyan-400" : theme.accent.split(' ')[0])} />
                               <span className="text-lg font-serif text-neutral-300">{spell.effect.label}</span>
                             </div>
                             
                             <div className="flex items-center gap-2 relative z-10">
                                {isDynamic && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300 uppercase tracking-wider font-bold">
                                    <Wand2 size={10} /> Auto
                                  </div>
                                )}
                                <span className={clsx(
                                  "text-3xl font-bold font-serif", 
                                  isDynamic ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : theme.accent.split(' ')[0]
                                )}>
                                  {displayValue}
                                </span>
                             </div>

                             {/* Fond spécial si dynamique */}
                             {isDynamic && (
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-900/10 to-transparent opacity-50"></div>
                             )}
                          </>
                        );
                     })()}
                  </div>
                )}

                <div className="prose prose-invert prose-p:text-neutral-300 prose-p:font-serif prose-p:leading-relaxed prose-p:text-sm text-justify">
                  <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-magic-gold first-letter:mr-3 first-letter:float-left first-letter:font-cinzel first-letter:leading-[0.8] first-letter:mt-1">
                    {spell.description}
                  </p>
                </div>

                {spell.higherLevels && (
                   <div className="pt-4 border-t border-white/5">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-2">
                       <Sparkles size={12} /> Surcharge
                     </h3>
                     <p className="text-xs text-neutral-400 font-serif italic pl-4 border-l border-neutral-800">
                       {spell.higherLevels}
                     </p>
                   </div>
                 )}
              </motion.div>
            )}

            {/* ETAT 2: Animation de Roulement (Canalisation) */}
            {rollState === 'rolling' && (
              <motion.div
                key="rolling"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              >
                 <div className="relative">
                    {/* Pulsing Orb Core */}
                    <div className={clsx("w-24 h-24 rounded-full blur-2xl animate-pulse", theme.glow)}></div>
                    <div className={clsx("absolute inset-0 border-2 border-dashed rounded-full animate-spin-slow opacity-30", theme.accent.split(' ')[0])}></div>
                 </div>
                 <p className="mt-8 font-cinzel text-neutral-500 tracking-[0.3em] uppercase text-xs animate-pulse">
                   Invocation...
                 </p>
              </motion.div>
            )}

            {/* ETAT 3: Jet d'attaque */}
            {rollState === 'attack' && currentAttackRoll && (
              <motion.div
                key="attack"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center justify-center min-h-[300px] w-full px-4"
              >
                {/* Indicateur d'attaque ou rebond */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "mb-4 text-xs uppercase tracking-widest font-cinzel",
                    bounceCount > 0 ? "text-amber-400" : "text-neutral-500"
                  )}
                >
                  {bounceCount > 0 
                    ? `Rebond ${bounceCount} !`
                    : attackCount > 1 
                      ? `Attaque ${currentAttackIndex + 1} / ${attackCount}`
                      : "Jet d'Attaque"
                  }
                </motion.div>

                {/* Résultat du D20 */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className={clsx(
                    "w-28 h-28 rounded-2xl flex items-center justify-center font-cinzel text-5xl font-bold border-4 mb-4",
                    currentAttackRoll.isCrit ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.5)]" :
                    currentAttackRoll.isFumble ? "bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.5)]" :
                    "bg-blue-500/10 border-blue-500/50 text-blue-300"
                  )}
                >
                  {currentAttackRoll.roll}
                </motion.div>
                <span className="text-sm text-neutral-600 mb-6">D20</span>

                {/* Calcul du total */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl font-bold text-neutral-400">{currentAttackRoll.roll}</span>
                  <span className="text-neutral-600">+</span>
                  <span className="text-xl text-neutral-500">{attackBonus}</span>
                  <span className="text-neutral-600">=</span>
                  <span className={clsx(
                    "text-3xl font-cinzel font-bold",
                    currentAttackRoll.isCrit ? "text-amber-400" :
                    currentAttackRoll.isFumble ? "text-red-400" :
                    "text-white"
                  )}>
                    {currentAttackRoll.total}
                  </span>
                </div>

                {/* Badge critique/fumble */}
                {currentAttackRoll.isCrit && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="mb-6 px-4 py-2 bg-amber-500/20 border border-amber-400 rounded-full text-amber-300 font-cinzel font-bold uppercase tracking-widest text-sm"
                  >
                    Critique ! Dés doublés
                  </motion.div>
                )}
                {currentAttackRoll.isFumble && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-6 px-4 py-2 bg-red-500/20 border border-red-500 rounded-full text-red-300 font-cinzel font-bold uppercase tracking-widest text-sm"
                  >
                    Échec Critique
                  </motion.div>
                )}

                {/* Boutons d'action */}
                <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
                  <motion.button 
                    onClick={handleRollDamage}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      "relative overflow-hidden py-4 rounded-lg font-cinzel uppercase tracking-[0.2em] text-sm transition-all",
                      "border backdrop-blur-sm",
                      currentAttackRoll.isCrit 
                        ? "border-amber-500/50 text-amber-200 bg-amber-500/10" 
                        : "border-white/20 text-white bg-white/5"
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <Dices size={18} />
                      Lancer les Dégâts
                    </span>
                    <div className={clsx(
                      "absolute inset-0 opacity-0 hover:opacity-100 transition-opacity",
                      currentAttackRoll.isCrit 
                        ? "bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20"
                        : "bg-gradient-to-r from-white/10 via-white/5 to-white/10"
                    )} />
                  </motion.button>
                  <button 
                    onClick={handleSkipDamage}
                    className="py-3 text-neutral-500 hover:text-neutral-300 font-cinzel uppercase tracking-[0.15em] text-xs transition-colors"
                  >
                    Raté / Passer
                  </button>
                </div>
              </motion.div>
            )}

            {/* ETAT 4: Dégâts */}
            {rollState === 'damage' && result && (
              <motion.div
                key="damage"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center justify-center min-h-[300px] w-full px-4"
              >
                {/* Indicateur d'attaque ou rebond */}
                <div className={clsx(
                  "mb-4 text-xs uppercase tracking-widest font-cinzel",
                  bounceCount > 0 ? "text-amber-400" : "text-neutral-500"
                )}>
                  {bounceCount > 0 
                    ? `Rebond ${bounceCount} !`
                    : attackCount > 1 
                      ? `Attaque ${currentAttackIndex + 1} / ${attackCount}`
                      : ""
                  }
                </div>

                {/* Dés de dégâts avec lignes de liaison */}
                <div className="mb-6">
                  <DiceWithLinks 
                    rolls={result.rolls}
                    faces={result.faces}
                    themeColor={theme.accent.split(' ')[0]}
                    showLinks={canBounce}
                  />
                </div>

                {/* Total dégâts */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-center relative mb-8"
                >
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-50 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, rgba(${theme.glowRgb}, 0.6), rgba(${theme.glowRgb}, 0) 70%)`,
                      filter: "blur(30px)",
                    }}
                  />
                  <span className="text-xs font-cinzel text-neutral-500 uppercase tracking-widest block mb-1">
                    Dégâts{attackResults.length > 0 && attackResults[attackResults.length - 1]?.isCrit ? " (crit)" : ""}
                  </span>
                  <span className={clsx("text-7xl font-cinzel font-bold drop-shadow-2xl", theme.accent.split(' ')[0])}>
                    {result.total}
                  </span>
                </motion.div>

                {/* Boutons : Rebond si paire, sinon suivant/terminer */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {hasBounce ? (
                    <>
                      <motion.button 
                        onClick={handleBounce}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative overflow-hidden py-4 rounded-lg font-cinzel uppercase tracking-[0.2em] text-sm border border-amber-500/50 text-amber-200 bg-amber-500/10 backdrop-blur-sm"
                      >
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-400/20 to-amber-500/0"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <Sparkles size={18} />
                          Rebond ! Nouvelle cible
                        </span>
                      </motion.button>
                      <button 
                        onClick={handleNextAttack}
                        className="py-3 text-neutral-500 hover:text-neutral-300 font-cinzel uppercase tracking-[0.15em] text-xs transition-colors"
                      >
                        Terminer
                      </button>
                    </>
                  ) : (
                    <motion.button 
                      onClick={handleNextAttack}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden py-4 rounded-lg font-cinzel uppercase tracking-[0.2em] text-sm border border-white/20 text-white bg-white/5 backdrop-blur-sm"
                    >
                      <span className="relative z-10">
                        {currentAttackIndex + 1 < attackCount ? "Attaque Suivante" : "Voir le Total"}
                      </span>
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-white/10 via-white/5 to-white/10" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ETAT 5: Résultat Final */}
            {rollState === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[300px] w-full px-4"
              >
                {/* Récap des attaques si multiples */}
                {attackResults.length > 0 && (
                  <div className="w-full space-y-2 mb-6">
                    {attackResults.map((atk, idx) => {
                      // Compter les rebonds avant cet index
                      const bouncesBefore = attackResults.slice(0, idx).filter(a => a.isBounce).length;
                      const isThisBounce = atk.isBounce;
                      const attackNumber = idx + 1 - bouncesBefore;
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={clsx(
                            "flex items-center justify-between p-3 rounded-lg border text-sm relative overflow-hidden",
                            atk.skipped ? "bg-neutral-900/50 border-neutral-800 text-neutral-600" :
                            isThisBounce ? "bg-amber-950/20 border-amber-500/30" :
                            atk.isCrit ? "bg-amber-950/30 border-amber-500/50" :
                            "bg-white/5 border-white/10"
                          )}
                        >
                          {/* Badge Critique brillant */}
                          {atk.isCrit && !atk.skipped && (
                            <motion.div
                              className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-[9px] font-bold text-amber-950 uppercase tracking-wider rounded-bl-lg"
                              animate={{ 
                                boxShadow: ["0 0 5px rgba(251,191,36,0.5)", "0 0 15px rgba(251,191,36,0.8)", "0 0 5px rgba(251,191,36,0.5)"]
                              }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              Critique
                            </motion.div>
                          )}
                          
                          <span className={clsx(
                            "font-cinzel text-xs uppercase tracking-widest",
                            isThisBounce && "text-amber-400"
                          )}>
                            {isThisBounce ? `Rebond ${bouncesBefore + 1}` : `Attaque ${attackNumber}`}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={clsx(
                              "text-xs",
                              atk.isCrit ? "text-amber-400" : atk.isFumble ? "text-red-400" : "text-blue-300"
                            )}>
                              D20: {atk.attackRoll} → {atk.attackTotal}
                            </span>
                            {!atk.skipped ? (
                              <span className={clsx("font-bold", atk.isCrit ? "text-amber-300" : theme.accent.split(' ')[0])}>
                                {atk.damageTotal} dégâts
                              </span>
                            ) : (
                              <span className="text-neutral-600 italic">Raté</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Affichage des dés pour sorts sans attaque */}
                {attackResults.length === 0 && result && (
                  <div className="mb-8 px-4 flex flex-col items-center gap-4">
                    <DiceWithLinks 
                      rolls={result.rolls}
                      faces={result.faces}
                      themeColor={theme.accent.split(' ')[0]}
                      showLinks={canBounce}
                    />
                    {result.modifier > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800/60 border border-neutral-600/40"
                      >
                        <span className="text-neutral-500 text-xs font-cinzel uppercase tracking-wider">Bonus</span>
                        <span className="text-neutral-300 font-bold text-lg font-cinzel">+{result.modifier}</span>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Total Final */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: attackResults.length * 0.1 + 0.2, type: "spring" }}
                  className="text-center relative"
                >
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-60 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, rgba(${theme.glowRgb}, 0.7), rgba(${theme.glowRgb}, 0) 72%)`,
                      filter: "blur(38px)",
                      transform: "translateZ(0)",
                    }}
                  />
                  <span className="text-xs font-cinzel text-neutral-500 uppercase tracking-widest block mb-1">
                    Total Dégâts
                  </span>
                  <span className={clsx("text-8xl font-cinzel font-bold drop-shadow-2xl", theme.accent.split(' ')[0])}>
                    {attackResults.length > 0 
                      ? attackResults.reduce((sum, a) => sum + a.damageTotal, 0)
                      : result?.total || 0
                    }
                  </span>
                </motion.div>

                {/* Actions */}
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                  className="mt-12 flex gap-6"
                >
                  <button 
                    onClick={handleReroll}
                    className="group flex items-center gap-2 text-neutral-500 hover:text-neutral-200 transition-colors"
                  >
                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span className="font-cinzel uppercase tracking-[0.15em] text-xs">Relancer</span>
                  </button>
                  <button 
                    onClick={() => setRollState('idle')}
                    className="text-neutral-500 hover:text-neutral-200 font-cinzel uppercase tracking-[0.15em] text-xs transition-colors"
                  >
                    Retour
                  </button>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* --- FOOTER (Visible seulement si 'idle') --- */}
        {rollState === 'idle' && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="p-4 bg-[#080808] rounded-b-xl border-t border-white/10 flex flex-col gap-3"
          >
            {/* Sélecteur d'Upcast */}
            {canUpcast && effectivePrepared && availableUpcastLevels.length > 1 && (
              <div className="pb-3 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-neutral-500 font-cinzel uppercase tracking-[0.2em]">Surcharge</span>
                  {selectedLevel > spell.level && (
                    <span className="text-[10px] text-violet-400 font-cinzel">+{upcastLevels} niveau{upcastLevels > 1 ? 'x' : ''}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {availableUpcastLevels.map(level => {
                    const slot = character.slots.find(s => s.level === level);
                    const remaining = slot ? slot.max - slot.used : 0;
                    const isSelected = selectedLevel === level;
                    const isUpcast = level > spell.level;
                    
                    return (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={clsx(
                          "flex-1 py-3 rounded-lg font-cinzel transition-all flex flex-col items-center justify-center gap-0.5",
                          isSelected 
                            ? isUpcast
                              ? "bg-violet-500/20 border-2 border-violet-400 text-violet-300"
                              : "bg-white/10 border-2 border-white/30 text-white"
                            : "bg-white/5 border border-white/10 text-neutral-500 hover:bg-white/10 hover:text-neutral-300"
                        )}
                      >
                        <span className="text-xs text-neutral-500">Niv.</span>
                        <span className="font-bold text-xl leading-none">{level}</span>
                        <span className="text-[10px] opacity-50">{remaining} dispo</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {effectivePrepared ? (
              <>
                {/* Mode GRATUIT DISPONIBLE : [Gratuit] [Oublier] puis [Invoquer] */}
                {!isThisFreeCast && canSelectAsFreeCast && !isActiveEffect && (
                  <>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleSetFree}
                        className="flex-1 py-3 rounded-lg bg-amber-900/20 border border-amber-500/30 text-amber-400 font-cinzel font-bold text-[10px] tracking-wider uppercase hover:bg-amber-900/40 hover:text-amber-200 transition-all flex items-center justify-center gap-2 group/free"
                      >
                        <Star size={14} className="group-hover/free:scale-110 transition-transform" />
                        <span>Gratuit</span>
                      </button>
                      
                      {!isAlwaysPrepared && (
                        <button 
                          onClick={handlePrepareToggle} 
                          className="flex-1 py-3 rounded-lg border border-white/5 bg-[#121212] hover:bg-red-950/20 hover:text-red-400 text-neutral-500 font-cinzel font-bold text-[10px] tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} />
                          <span>Oublier</span>
                        </button>
                      )}
                    </div>

                    {(hasSlotsAvailable || spell.level === 0) ? (
                       <button
                        onClick={handleCast}
                        className={clsx(
                          "w-full py-4 rounded-lg font-cinzel font-bold tracking-[0.15em] uppercase text-sm text-white transition-all duration-300 shadow-lg border relative overflow-hidden group",
                          clsx(theme.btnGradient, theme.btnShadow, theme.btnBorder)
                        )}
                      >
                        <div className="relative z-10 flex items-center justify-center gap-2">
                          {spell.damage ? <Dices size={18} /> : <Sparkles size={18} />}
                          <span>{spell.damage ? "Invoquer & Lancer" : (hasBuffEffect ? "Activer" : "Incantation")}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      </button>
                    ) : (
                      <div className="w-full py-4 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-600 font-cinzel font-bold text-center uppercase text-sm flex items-center justify-center gap-2">
                        <Lock size={16} /> Épuisé
                      </div>
                    )}
                  </>
                )}

                {/* Mode STANDARD (pas de gratuit dispo) : [Invoquer] + [Oublier] sur une ligne */}
                {!isThisFreeCast && !canSelectAsFreeCast && !isActiveEffect && (
                  <div className="flex gap-3">
                    {(hasSlotsAvailable || spell.level === 0) ? (
                       <button
                        onClick={handleCast}
                        className={clsx(
                          "flex-1 py-4 rounded-lg font-cinzel font-bold tracking-[0.15em] uppercase text-sm text-white transition-all duration-300 shadow-lg border relative overflow-hidden group",
                          clsx(theme.btnGradient, theme.btnShadow, theme.btnBorder)
                        )}
                      >
                        <div className="relative z-10 flex items-center justify-center gap-2">
                          {spell.damage ? <Dices size={18} /> : <Sparkles size={18} />}
                          <span>{spell.damage ? "Invoquer & Lancer" : (hasBuffEffect ? "Activer" : "Incantation")}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      </button>
                    ) : (
                      <div className="flex-1 py-4 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-600 font-cinzel font-bold text-center uppercase text-sm flex items-center justify-center gap-2">
                        <Lock size={16} /> Épuisé
                      </div>
                    )}

                    {!isAlwaysPrepared && (
                      <button 
                        onClick={handlePrepareToggle} 
                        className="w-14 rounded-lg border border-white/5 bg-[#121212] hover:bg-red-950/20 hover:text-red-400 text-neutral-500 flex items-center justify-center transition-all flex-shrink-0"
                        title="Oublier"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                )}

                {/* Mode EFFET ACTIF : Bouton Désactiver seul */}
                {!isThisFreeCast && isActiveEffect && (
                  <button
                    onClick={handleCast}
                    className="w-full py-4 rounded-lg font-cinzel font-bold tracking-[0.15em] uppercase text-sm text-white transition-all duration-300 shadow-lg border relative overflow-hidden group bg-cyan-900/80 border-cyan-400 shadow-cyan-500/20 hover:bg-red-900/50 hover:border-red-500/50"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_cyan]"></div>
                      <span className="group-hover:hidden">Actif</span>
                      <span className="hidden group-hover:block text-red-200">Désactiver</span>
                    </div>
                  </button>
                )}

                {/* Mode GRATUIT SÉLECTIONNÉ : [Oublier] + [Incanter Gratuitement] sur une ligne */}
                {isThisFreeCast && (
                  <div className="flex gap-3">
                    {!isAlwaysPrepared && (
                      <button 
                        onClick={handlePrepareToggle} 
                        className="w-14 rounded-lg border border-white/5 bg-[#121212] hover:bg-red-950/20 hover:text-red-400 text-neutral-500 flex items-center justify-center transition-all flex-shrink-0"
                        title="Oublier"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    
                    <button
                      onClick={handleCast}
                      className="flex-1 py-4 rounded-lg font-cinzel font-bold tracking-[0.15em] uppercase text-sm text-white transition-all duration-300 shadow-lg border relative overflow-hidden group bg-gradient-to-r from-amber-700 to-yellow-600 border-amber-400 shadow-amber-500/20"
                    >
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        {spell.damage ? <Dices size={18} /> : <Sparkles size={18} />}
                        <span>Incanter Gratuitement</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button 
                onClick={handlePrepareToggle}
                disabled={isFull}
                className={clsx(
                  "w-full py-4 rounded-lg font-cinzel font-bold tracking-widest uppercase text-sm text-white transition-all duration-300 shadow-lg border flex items-center justify-center gap-2",
                  isFull ? "bg-red-950/20 border-red-900/50 text-red-500 cursor-not-allowed" : clsx("bg-gradient-to-b hover:brightness-110", theme.btnGradient, theme.btnBorder)
                )}
              >
                {isFull ? <><Lock size={16} /><span>Esprit Saturé</span></> : <><BookOpen size={16} /><span>Préparer</span></>}
              </button>
            )}
          </motion.div>
        )}

      </motion.div>
    </motion.div>
  );
}
