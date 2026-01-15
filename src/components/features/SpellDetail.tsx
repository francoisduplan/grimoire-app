"use client";

import { Spell } from "@/types";
import { X, Clock, Ruler, Box, Hourglass, Flame, Shield, Skull, Sparkles, Zap, Brain, Move, BookOpen, Hand, Trash2, Lock, Dices, RefreshCw, Wand2, Star } from 'lucide-react';
import { useCharacter } from "@/context/CharacterContext";
import { clsx } from "clsx";
import { SPELLS_DATA } from "@/data/spells";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateModifier } from "@/lib/dnd-rules";

interface SpellDetailProps {
  spell: Spell;
  onClose: () => void;
}

// --- LOGIQUE DE DÉS ---
type RollResult = {
  total: number;
  rolls: number[];      // Les résultats bruts [3, 4, 1]
  faces: number;        // Type de dé (d8, d6...)
  modifier: number;     // Bonus fixe (+3)
  isMultiHit: boolean;  // Pour magic missile (3x...)
};

const parseAndRoll = (diceStr: string): RollResult => {
  // Normaliser en minuscules pour le parsing
  const normalizedStr = diceStr.toLowerCase();
  
  // Cas spécial Magic Missile: "3x(1d4+1)" -> On considère ça comme 3 jets séparés mais on veut voir les dés
  if (normalizedStr.includes('3x')) {
    const rolls = [];
    let total = 0;
    for(let i=0; i<3; i++) {
       const val = Math.floor(Math.random() * 4) + 1; // 1D4
       rolls.push(val + 1); // +1 intégré dans le résultat affiché pour MM
       total += val + 1;
    }
    return { total, rolls, faces: 4, modifier: 1, isMultiHit: true };
  }

  // Standard "1D10", "2D6", "1D8+3"
  // Nettoyage
  const cleanStr = normalizedStr.replace(/\s/g, '');
  const [base, modifierStr] = cleanStr.split('+');
  const modifier = modifierStr ? parseInt(modifierStr) : 0;
  const [countStr, dieStr] = base.split('d');
  const count = parseInt(countStr);
  const die = parseInt(dieStr);

  let total = 0;
  const rolls = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * die) + 1;
    total += roll;
    rolls.push(roll);
  }
  total += modifier;

  return { total, rolls, faces: die, modifier, isMultiHit: false };
};

// --- COMPOSANT DÉ ANIMÉ ---
const AnimatedDie = ({ value, faces, index, themeColor, isMatch }: { value: number, faces: number, index: number, themeColor: string, isMatch?: boolean }) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ 
        scale: 1, 
        rotate: 0, 
        opacity: 1,
        boxShadow: isMatch 
          ? ["0 0 8px 2px rgba(234,179,8,0.25)", "0 0 12px 4px rgba(234,179,8,0.4)", "0 0 8px 2px rgba(234,179,8,0.25)"]
          : "0 0 0px 0px rgba(0,0,0,0)"
      }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20, 
        delay: index * 0.1,
        boxShadow: isMatch ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }
      }}
      className="relative w-20 h-20 group rounded-2xl" // Wrapper de positionnement
    >

      {/* Le Dé (Conteneur visuel) */}
      <div className={clsx(
        "relative w-full h-full flex flex-col items-center justify-center rounded-2xl border-2 backdrop-blur-sm overflow-hidden transition-colors duration-500 z-10",
        // Styles
        isMatch 
          ? "bg-yellow-950/80 text-yellow-100 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.5)]" 
          : clsx(
              "shadow-lg",
              themeColor === 'text-orange-500' ? "border-orange-500/50 bg-orange-950/40 text-orange-200" :
              themeColor === 'text-cyan-400' ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-200" :
              themeColor === 'text-emerald-400' ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-200" :
              themeColor === 'text-fuchsia-400' ? "border-fuchsia-500/50 bg-fuchsia-950/40 text-fuchsia-200" :
              "border-indigo-500/50 bg-indigo-950/40 text-indigo-200"
            )
      )}>
        {/* Shine Effect interne pour Match */}
        {isMatch && (
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 via-transparent to-yellow-200/20"></div>
        )}

        {/* Glow interne au survol */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity"></div>
        
        {/* Valeur */}
        <span className={clsx("text-4xl font-bold font-serif leading-none mt-1", isMatch && "drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]")}>{value}</span>
        
        {/* Label */}
        <span className="text-[10px] opacity-50 font-mono leading-none mt-1">D{faces}</span>
      </div>
    </motion.div>
  );
};

export function SpellDetail({ spell, onClose }: SpellDetailProps) {
  const { prepareSpell, unprepareSpell, castSpell, character, addEffect, removeEffect, setFreeCastSpell, consumeFreeCast } = useCharacter();
  
  // États locaux
  const [rollState, setRollState] = useState<'idle' | 'rolling' | 'result'>('idle');
  const [result, setResult] = useState<RollResult | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);

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

    // 2. Ensuite les buffs actifs
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

    // 3. Enfin le thème par défaut du sort
    if (spell.damage?.type === 'Feu') return {
      accent: 'text-orange-500 border-orange-500/30 shadow-orange-500/20',
      glow: 'bg-orange-500',
      glowRgb: '249, 115, 22',
      glowShadow: '0 0 10px rgba(249, 115, 22, 0.1)',
      glowShadowHover: '0 0 15px rgba(249, 115, 22, 0.18)',
      btnGradient: 'from-orange-600 to-red-900',
      btnShadow: 'shadow-orange-900/40',
      btnBorder: 'border-orange-500/40',
      textGradient: 'from-orange-200 via-orange-400 to-red-500'
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
    if (spell.school === 'Abjuration') return {
      accent: 'text-cyan-400 border-cyan-400/30 shadow-cyan-400/20',
      glow: 'bg-cyan-400',
      glowRgb: '34, 211, 238',
      glowShadow: '0 0 10px rgba(34, 211, 238, 0.1)',
      glowShadowHover: '0 0 15px rgba(34, 211, 238, 0.18)',
      btnGradient: 'from-cyan-600 to-blue-900',
      btnShadow: 'shadow-cyan-900/40',
      btnBorder: 'border-cyan-500/40',
      textGradient: 'from-cyan-200 via-cyan-400 to-blue-500'
    };
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
             if (!hasSlotsAvailable) return;
             castSpell(spell.level);
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
      if (!hasSlotsAvailable && spell.level > 0) return;
      
      if (spell.level > 0) {
        if (isThisFreeCast) consumeFreeCast();
        else castSpell(spell.level);
      }

      setRollState('rolling');
      setResult(null);

      setTimeout(() => {
        const rollData = parseAndRoll(spell.damage!.dice);
        setResult(rollData);
        setRollState('result');
      }, 600); 

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

  const handleReroll = () => {
     setRollState('rolling');
     setResult(null);
     setTimeout(() => {
        const rollData = parseAndRoll(spell.damage!.dice);
        setResult(rollData);
        setRollState('result');
      }, 400); // Plus rapide au reroll
  };

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
        <motion.div 
        className={clsx(
          "relative w-full max-w-md bg-[#080808] rounded-xl shadow-2xl border transition-colors duration-700 flex flex-col max-h-[90vh] z-10",
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
        <div className={clsx(
          "flex-1 px-8 pb-8 relative min-h-[300px]",
          rollState === 'rolling' ? "overflow-hidden" : rollState === 'result' ? "overflow-visible" : "overflow-y-auto scrollbar-hide"
        )}>
          
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
                       <div className={clsx("text-4xl font-bold font-serif tabular-nums drop-shadow-lg pr-4 transition-colors duration-500 relative z-10", theme.accent.split(' ')[0])}>
                         {spell.damage.dice}
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

            {/* ETAT 3: Résultat */}
            {rollState === 'result' && result && (
              <motion.div
                key="result"
                className="flex flex-col items-center justify-center min-h-[300px]"
              >
                 {/* 1. Affichage des Dés Individuels */}
                 <div className="flex flex-wrap justify-center gap-6 mb-8 px-4">
                    {result.rolls.map((val, idx) => {
                      // Détection de paires/triplets
                      const isMatch = result.rolls.filter(v => v === val).length >= 2;
                      
                      return (
                        <AnimatedDie 
                          key={idx} 
                          value={val} 
                          faces={result.faces} 
                          index={idx} 
                          themeColor={theme.accent.split(' ')[0]} 
                          isMatch={isMatch}
                        />
                      );
                    })}
                    {result.modifier > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                        className="flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 text-neutral-400 font-serif text-2xl"
                      >
                        +{result.modifier}
                      </motion.div>
                    )}
                 </div>

                 {/* 2. Total */}
                 <motion.div
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ delay: 0.2 + (result.rolls.length * 0.1), type: "spring" }}
                   className="text-center relative"
                 >
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-60 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, rgba(${theme.glowRgb}, 0.7), rgba(${theme.glowRgb}, 0) 72%)`,
                        filter: "blur(38px)",
                        transform: "translateZ(0)",
                        willChange: "transform, opacity"
                      }}
                    />
                    <span className="text-xs font-cinzel text-neutral-500 uppercase tracking-widest block mb-1">Total Dégâts</span>
                    <span className={clsx("text-8xl font-cinzel font-bold drop-shadow-2xl", theme.accent.split(' ')[0])}>
                      {result.total}
                    </span>
                 </motion.div>

                 {/* 3. Actions */}
                 <motion.div 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                   className="mt-12 flex gap-4"
                 >
                    <button 
                       onClick={handleReroll}
                       className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      <RefreshCw size={14} /> Relancer
                    </button>
                    <button 
                       onClick={() => setRollState('idle')}
                       className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs uppercase tracking-widest transition-colors"
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
            className="p-4 bg-[#080808]/95 backdrop-blur border-t border-white/10 flex flex-col gap-3"
          >
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
