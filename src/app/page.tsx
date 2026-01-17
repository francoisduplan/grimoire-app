"use client";

import { useCharacter } from "@/context/CharacterContext";
import { Zap, Heart, Shield, Flame, Moon, Sparkles, Crown, X, Minus, Plus, Droplets, Leaf, Tent, Sunrise, Clover, Hourglass, History, Target, Wand2, Skull, Swords, Eye, Layers } from 'lucide-react';
import { SpellCard } from "@/components/ui/SpellCard";
import { SPELLS_DATA } from '@/data/spells';
import { SpellDetail } from '@/components/features/SpellDetail';
import { ShortRestModal } from '@/components/features/ShortRestModal';
import { useState } from "react";
import { Spell } from "@/types";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { character, castSpell, recoverSlot, longRest, takeDamage, heal } = useCharacter();
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  
  const [showHpModal, setShowHpModal] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  const [showShortRestModal, setShowShortRestModal] = useState(false);
  const [hpInput, setHpInput] = useState("1");

  // États locaux pour les aptitudes spéciales
  const [luckyPoints, setLuckyPoints] = useState(2);
  const [chronoUses, setChronoUses] = useState(2);

  // Jets de sauvegarde contre la mort
  const [deathSaves, setDeathSaves] = useState({ successes: 0, failures: 0 });

  const toggleDeathSuccess = (index: number) => {
    setDeathSaves(prev => ({
      ...prev,
      successes: index < prev.successes ? index : index + 1
    }));
  };

  const toggleDeathFailure = (index: number) => {
    setDeathSaves(prev => ({
      ...prev,
      failures: index < prev.failures ? index : index + 1
    }));
  };

  // Calculs magiques
  const intMod = Math.floor((character.abilities.INT - 10) / 2);
  const spellAttackBonus = character.proficiencyBonus + intMod;

  // Filtre des sorts
  type SpellFilter = 'all' | 'attack' | 'defense' | 'utility';
  const [spellFilter, setSpellFilter] = useState<SpellFilter>('all');

  // Fonction pour catégoriser un sort
  const getSpellCategory = (spell: Spell): 'attack' | 'defense' | 'utility' => {
    if (spell.damage) return 'attack';
    if (spell.effect?.type === 'Buff' || spell.effect?.type === 'Défense') return 'defense';
    return 'utility';
  };

  // Fonction pour filtrer les sorts
  const filterSpells = (spells: Spell[]): Spell[] => {
    if (spellFilter === 'all') return spells;
    return spells.filter(spell => getSpellCategory(spell) === spellFilter);
  };

  // Configuration des filtres
  const FILTER_CONFIG = [
    { id: 'all' as SpellFilter, label: 'Tous', icon: Layers, color: 'text-neutral-400' },
    { id: 'attack' as SpellFilter, label: 'Attaque', icon: Swords, color: 'text-red-400' },
    { id: 'defense' as SpellFilter, label: 'Défense', icon: Shield, color: 'text-blue-400' },
    { id: 'utility' as SpellFilter, label: 'Utilité', icon: Eye, color: 'text-violet-400' },
  ];

  const toggleSlot = (level: number, isAvailable: boolean) => {
    if (isAvailable) {
      castSpell(level);
    } else {
      recoverSlot(level);
    }
  };

  const handleShortRest = () => {
    // 1. Soin : 1d6 + CON
    const conMod = Math.floor((character.abilities.CON - 10) / 2);
    const healRoll = Math.floor(Math.random() * 6) + 1;
    const healAmount = Math.max(0, healRoll + conMod); // Minimum 0
    heal(healAmount);

    // 2. Récupération d'un slot (Arcane Recovery simulée / simplifié)
    // On cherche le slot de plus haut niveau qui a été utilisé et on en rend 1.
    // On parcourt les slots du plus haut (index fin) au plus bas.
    const reversedSlots = [...character.slots].reverse();
    const slotToRecover = reversedSlots.find(slot => slot.used > 0);
    
    if (slotToRecover) {
      recoverSlot(slotToRecover.level);
    }

    setShowRestModal(false);
  };

  const handleLongRest = () => {
    longRest();
    setLuckyPoints(2); // Recharge Chance
    setChronoUses(2); // Recharge Chronomancie
    setDeathSaves({ successes: 0, failures: 0 }); // Reset jets de mort
    setShowRestModal(false);
  };

  const handleDamage = () => {
    const amount = parseInt(hpInput);
    if (!isNaN(amount) && amount > 0) {
      takeDamage(amount);
      setShowHpModal(false);
      setHpInput("1");
    }
  };

  const handleHeal = () => {
    const amount = parseInt(hpInput);
    if (!isNaN(amount) && amount > 0) {
      heal(amount);
      setShowHpModal(false);
      setHpInput("1");
    }
  };

  const getSpellDC = () => 8 + character.proficiencyBonus + Math.floor((character.abilities.INT - 10) / 2);

  const renderRunes = (level: number, max: number, used: number) => {
    return (
      <div key={level} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0 group">
        <div className="w-12 text-right">
          <span className="text-xs font-serif text-neutral-500 font-bold tracking-widest uppercase">Rang</span>
          <p className="text-xl font-cinzel text-magic-gold leading-none">{level}</p>
        </div>

        <div className="flex-1 flex flex-wrap gap-2">
          {Array.from({ length: max }).map((_, i) => {
             const isAvailable = i < (max - used);
             
             return (
              <motion.button
                key={i}
                onClick={() => toggleSlot(level, isAvailable)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  "relative w-10 h-12 clip-path-rune flex items-center justify-center focus:outline-none transition-all duration-300",
                  isAvailable ? "cursor-pointer drop-shadow-[0_0_5px_rgba(139,92,246,0.3)] hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]" : "cursor-pointer grayscale opacity-40 hover:opacity-60"
                )}
              >
                <motion.div
                  initial={false}
                  animate={{
                    opacity: isAvailable ? 1 : 0,
                    scale: isAvailable ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-gradient-to-b from-indigo-400 via-violet-600 to-indigo-950 shadow-inner clip-path-rune"
                >
                   {isAvailable && (
                     <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/40 clip-path-rune"></div>
                   )}
                </motion.div>

                <motion.div
                   initial={false}
                   animate={{
                     opacity: isAvailable ? 0 : 1,
                     scale: isAvailable ? 0.8 : 1,
                   }}
                   className="absolute inset-0 bg-[#1a1a1a] border border-white/5 clip-path-rune"
                />
                
                <AnimatePresence>
                  {!isAvailable && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-indigo-400 rounded-full blur-md"
                    />
                  )}
                </AnimatePresence>

              </motion.button>
             )
          })}
        </div>
      </div>
    );
  };

  // --- LOGIQUE DE TRI ET SÉPARATION ---
  
  // 1. Récupérer tous les sorts "connus" (pour trouver les cantrips/dons même non préparés explicitement dans la liste preparedSpells si on voulait, 
  // mais ici on va supposer que character.knownSpells contient tout ce qui est accessible).
  // Pour l'accueil, on veut afficher :
  // - Groupe A : Cantrips (Niv 0) + Dons/Aptitudes (School = Don/Aptitude/Chronomancie) => TOUJOURS VISIBLES si connus
  // - Groupe B : Sorts Niv 1+ => VISIBLES SEULEMENT SI DANS preparedSpells

  const allKnownSpellsData = character.knownSpells
    .map(id => SPELLS_DATA.find(s => s.id === id))
    .filter((s): s is Spell => !!s);

  // Groupe A : Cantrips & Pouvoirs de classe (Toujours là)
  // On exclut les Dons (restent dans le grimoire uniquement)
  // On filtre 'lucky' et 'chronal-shift' car ils ont leur propre affichage interactif
  const powersAndCantrips = allKnownSpellsData
    .filter(s => 
      (s.level === 0 || ['Aptitude', 'Chronomancie'].includes(s.school)) && 
      s.school !== 'Don' &&
      !['lucky', 'chronal-shift'].includes(s.id)
    )
    .sort((a, b) => {
        // Tri : D'abord les Aptitudes, puis les Cantrips
        const isFeatA = ['Aptitude', 'Chronomancie'].includes(a.school);
        const isFeatB = ['Aptitude', 'Chronomancie'].includes(b.school);
        if (isFeatA && !isFeatB) return -1;
        if (!isFeatA && isFeatB) return 1;
        return a.name.localeCompare(b.name);
    });

  // Groupe B : Sorts Préparés (Niv 1+)
  const preparedSpellsList = character.preparedSpells
    .map(id => SPELLS_DATA.find(s => s.id === id))
    .filter((s): s is Spell => !!s && s.level > 0 && !['Don', 'Aptitude', 'Chronomancie'].includes(s.school))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)); // Tri par niveau puis nom

  return (
    <div className="pb-8 space-y-10">
      
      {/* --- EN-TÊTE CINÉMATIQUE (RESTAURÉ) --- */}
      <section className="relative pt-14 pb-2 text-center">
        <div className="absolute top-2 right-4 z-20">
          <button 
            onClick={() => setShowRestModal(true)}
            className="group relative p-3 rounded-full overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 bg-[#151520] border border-white/10 shadow-2xl"
            title="Se Reposer"
          >
            <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 blur-xl transition-colors"></div>
            <div className="relative z-10 text-indigo-200 group-hover:text-white transition-colors">
              <Tent size={20} />
            </div>
          </button>
        </div>

        <div className="inline-flex flex-col items-center max-w-full px-4">
          <span className="text-xs font-bold tracking-[0.3em] text-neutral-500 uppercase mb-2">
            Niveau {character.level} • Chronomancien
          </span>
          <h1 className="text-6xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-b from-magic-gold via-[#ffeebb] to-[#a68a56] drop-shadow-md text-center leading-none tracking-tight">
            Edmont
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent mt-2 rounded-full" />
        </div>
      </section>

      {/* --- BARRE DE STATUTS (VITALS) (RESTAURÉE) --- */}
      <section className="relative mx-4">
        {/* Fond avec lueur statique */}
        <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md border border-magic-gold/20 rounded-2xl shadow-[0_0_30px_rgba(212,180,131,0.05)] transition-all duration-500" />
        
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/5 py-4">
          
          {/* Points de Vie (INTERACTIF) */}
          <div className="flex flex-col items-center gap-1 transition-all duration-300 rounded-l-2xl py-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-red-900/0 transition-colors duration-300"></div>
            
            <div className="relative z-10 w-full flex items-center justify-between px-2">
              <button 
                onClick={() => takeDamage(1)}
                className="p-1 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-900/20 active:scale-95 transition-all"
              >
                <Minus size={16} />
              </button>

              <div className="flex flex-col items-center cursor-pointer" onClick={() => setShowHpModal(true)}>
                 <div className="text-red-500 transition-colors duration-300 mb-1">
                   <Heart size={18} fill="currentColor" className="drop-shadow-lg" />
                 </div>
                 <div className="relative h-9 w-full flex justify-center items-center overflow-visible">
                   <AnimatePresence mode="popLayout" initial={false}>
                     <motion.span
                       key={character.hp.current}
                       initial={{ opacity: 0, y: 15, scale: 0.5, filter: "blur(5px)" }}
                       animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                       exit={{ opacity: 0, y: -15, scale: 0.5, filter: "blur(5px)" }}
                       transition={{ type: "spring", stiffness: 400, damping: 25 }}
                       className="text-3xl font-cinzel font-bold text-white block"
                     >
                       {character.hp.current}
                     </motion.span>
                   </AnimatePresence>
                 </div>
                 <span className="text-[9px] uppercase tracking-widest text-red-400 font-bold transition-colors">PV</span>
              </div>

              <button 
                onClick={() => heal(1)}
                className="p-1 rounded-full text-neutral-500 hover:text-emerald-400 hover:bg-emerald-900/20 active:scale-95 transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Classe d'Armure */}
          <div className="flex flex-col items-center gap-1 py-1 relative">
             <div className="text-blue-500 transition-colors duration-300 mb-1">
              <Shield size={18} fill="currentColor" className="drop-shadow-lg" />
            </div>
            
            {/* Calcul AC Dynamique */}
            {(() => {
               const baseAC = 10 + Math.floor((character.abilities.DEX - 10)/2);
               const bonusAC = character.activeEffects
                 .filter(e => e.type === 'AC')
                 .reduce((sum, e) => sum + e.value, 0);
               const totalAC = baseAC + bonusAC;
               const hasBonus = bonusAC > 0;

               return (
                 <div className="relative flex items-center justify-center">
                   <span className={clsx(
                     "text-3xl font-cinzel font-bold transition-all duration-500",
                     hasBonus ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] scale-110" : "text-white"
                   )}>
                     {totalAC}
                   </span>
                   {hasBonus && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }} 
                       animate={{ opacity: 1, y: 0 }}
                       className="absolute -top-3 -right-4 text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-1.5 rounded-full border border-cyan-500/30"
                     >
                       +{bonusAC}
                     </motion.div>
                   )}
                 </div>
               );
            })()}
            
            <span className="text-[9px] uppercase tracking-widest text-blue-400 font-bold transition-colors">CA</span>
          </div>

          {/* Degré de Difficulté */}
          <div className="flex flex-col items-center gap-1 py-1 relative">
             <div className="text-amber-500 transition-colors duration-300 mb-1">
              <Crown size={18} fill="currentColor" className="drop-shadow-lg" />
            </div>
            <span className="text-3xl font-cinzel font-bold text-white transition-colors">
              {getSpellDC()}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-amber-400 font-bold transition-colors">DD Sort</span>
          </div>

        </div>

        {/* Séparateur subtil */}
        <div className="relative z-10 mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Deuxième ligne : Attaque, Mod Incantation, Jets de Mort */}
        <div className="relative z-10 grid grid-cols-3 divide-x divide-white/5 py-4">
          
          {/* Bonus d'Attaque Sort */}
          <div className="flex flex-col items-center gap-1 py-1 relative">
            <div className="text-fuchsia-400 transition-colors duration-300 mb-1">
              <Target size={18} className="drop-shadow-lg" />
            </div>
            <span className="text-3xl font-cinzel font-bold text-white transition-colors">
              +{spellAttackBonus}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-fuchsia-400 font-bold transition-colors">Attaque</span>
          </div>

          {/* Modificateur d'Incantation */}
          <div className="flex flex-col items-center gap-1 py-1 relative">
            <div className="text-violet-400 transition-colors duration-300 mb-1">
              <Wand2 size={18} className="drop-shadow-lg" />
            </div>
            <span className="text-3xl font-cinzel font-bold text-white transition-colors">
              +{intMod}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-violet-400 font-bold transition-colors">Incantation</span>
          </div>

          {/* Jets de Sauvegarde contre la Mort */}
          <div className="flex flex-col items-center gap-1 py-1 relative">
            <div className="text-neutral-400 transition-colors duration-300 mb-1">
              <Skull size={18} className="drop-shadow-lg" />
            </div>
            
            <div className="flex flex-col gap-1.5 items-center">
              {/* Succès */}
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <button
                    key={`success-${i}`}
                    onClick={() => toggleDeathSuccess(i)}
                    className={clsx(
                      "w-4 h-4 rounded-full border-2 transition-all duration-200",
                      i < deathSaves.successes
                        ? "bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                        : "bg-transparent border-emerald-900/50 hover:border-emerald-500/50"
                    )}
                  />
                ))}
              </div>
              {/* Échecs */}
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <button
                    key={`failure-${i}`}
                    onClick={() => toggleDeathFailure(i)}
                    className={clsx(
                      "w-4 h-4 rounded-full border-2 transition-all duration-200",
                      i < deathSaves.failures
                        ? "bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                        : "bg-transparent border-red-900/50 hover:border-red-500/50"
                    )}
                  />
                ))}
              </div>
            </div>

            <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold transition-colors">Jets Mort</span>
          </div>

        </div>
      </section>

      {/* --- EMPLACEMENTS DE SORTS --- */}
      <section className="px-4">
        <div className="flex items-center gap-3 mb-6 px-2">
          <h2 className="font-cinzel text-lg text-magic-gold tracking-widest border-b border-magic-gold/20 pb-1 w-full">
            Emplacements de Sorts
          </h2>
        </div>
        
        <div className="space-y-1">
          {character.slots.length > 0 ? (
             character.slots.map(slot => renderRunes(slot.level, slot.max, slot.used))
          ) : (
            <p className="text-sm text-center text-neutral-600 italic py-4">Votre esprit est vide...</p>
          )}
        </div>
      </section>

      {/* --- POUVOIRS SPÉCIAUX --- */}
      <section className="px-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <h2 className="font-cinzel text-lg text-magic-gold tracking-widest border-b border-magic-gold/20 pb-1 w-full">
            Dons & Pouvoirs
          </h2>
        </div>

        <div className="relative">
          {/* Fond unifié style barre de stats */}
          <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl" />
        
        <div className="relative z-10 grid grid-cols-2 divide-x divide-white/5">
          
          {/* CHANCE */}
          <div className="flex flex-col items-center py-5 px-4">
            <div className="flex items-center gap-2 mb-3">
              <Clover size={14} className="text-emerald-400" />
              <span className="font-cinzel text-[10px] text-emerald-400/80 tracking-[0.2em] uppercase">
                Chance
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[0, 1].map(i => (
                <button
                  key={i}
                  onClick={() => setLuckyPoints(prev => i < prev ? prev - 1 : prev + 1)}
                  className="relative group/luck"
                >
                  {/* Glow externe subtil */}
                  {i < luckyPoints && (
                    <div className="absolute inset-0 bg-emerald-500/15 rounded-full blur-md scale-125" />
                  )}
                  
                  {/* Gemme */}
                  <div className={clsx(
                    "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    i < luckyPoints 
                      ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_0_10px_rgba(52,211,153,0.3)] scale-100" 
                      : "bg-[#1a1a1a] border border-emerald-900/30 scale-90 opacity-40"
                  )}>
                    {/* Reflet interne */}
                    {i < luckyPoints && (
                      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                    )}
                    
                    {/* Icône centrale */}
                    <Clover 
                      size={18} 
                      className={clsx(
                        "relative z-10 transition-all",
                        i < luckyPoints ? "text-white drop-shadow-lg" : "text-emerald-900/50"
                      )} 
                      fill={i < luckyPoints ? "currentColor" : "none"}
                    />
                  </div>
                </button>
              ))}
            </div>
            
            <span className="text-[10px] text-neutral-600 mt-2 font-mono">{luckyPoints}/2</span>
          </div>

          {/* CHRONOMANCIE */}
          <div className="flex flex-col items-center py-5 px-4">
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-violet-400" />
              <span className="font-cinzel text-[10px] text-violet-400/80 tracking-[0.2em] uppercase">
                Chronos
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[0, 1].map(i => (
                <button
                  key={i}
                  onClick={() => setChronoUses(prev => i < prev ? prev - 1 : prev + 1)}
                  className="relative group/chrono"
                >
                  {/* Glow externe subtil avec rotation */}
                  {i < chronoUses && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent, rgba(139,92,246,0.2), transparent)',
                        filter: 'blur(6px)',
                        scale: 1.3
                      }}
                    />
                  )}
                  
                  {/* Sablier stylisé */}
                  <div className={clsx(
                    "relative w-10 h-10 flex items-center justify-center transition-all duration-300",
                    i < chronoUses 
                      ? "scale-100" 
                      : "scale-90 opacity-40"
                  )}>
                    {/* Forme hexagonale */}
                    <div className={clsx(
                      "absolute inset-0 transition-all duration-300",
                      i < chronoUses 
                        ? "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 shadow-[0_0_8px_rgba(139,92,246,0.3)]" 
                        : "bg-[#1a1a1a] border border-violet-900/30"
                    )} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                      {/* Reflet interne */}
                      {i < chronoUses && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                      )}
                    </div>
                    
                    {/* Icône centrale */}
                    <History 
                      size={16} 
                      className={clsx(
                        "relative z-10 transition-all",
                        i < chronoUses ? "text-white drop-shadow-lg" : "text-violet-900/50"
                      )} 
                    />
                  </div>
                </button>
              ))}
            </div>
            
            <span className="text-[10px] text-neutral-600 mt-2 font-mono">{chronoUses}/2</span>
          </div>

        </div>
        </div>
      </section>

      {/* --- GROUPE 1 : CANTRIPS (TOUJOURS DISPO) --- */}
      <section className="px-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <h2 className="font-cinzel text-lg text-magic-gold tracking-widest border-b border-magic-gold/20 pb-1 w-full">
            Cantrips
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {powersAndCantrips.map(spell => (
             <SpellCard 
               key={spell.id} 
               spell={spell} 
               isPrepared={true} // Toujours considérés comme prêts/actifs
               isActiveEffect={character.activeEffects.some(e => e.id === spell.id)}
               onClick={() => setSelectedSpell(spell)}
             />
          ))}
        </div>
      </section>

      {/* --- GROUPE 2 : SORTS PRÉPARÉS (NIV 1+) --- */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-2 px-2">
          <h2 className="font-cinzel text-lg text-white tracking-widest border-b border-white/10 pb-1 w-full">
            Sorts Préparés <span className="text-xs text-neutral-500 ml-2 font-serif normal-case italic">({filterSpells(preparedSpellsList).length})</span>
          </h2>
        </div>

        {/* Barre de Filtres */}
        <div className="flex items-center gap-1 mb-6 px-1 py-2 overflow-x-auto scrollbar-hide">
          {FILTER_CONFIG.map(filter => {
            const FilterIcon = filter.icon;
            const isActive = spellFilter === filter.id;
            const count = filter.id === 'all' 
              ? preparedSpellsList.length 
              : preparedSpellsList.filter(s => getSpellCategory(s) === filter.id).length;
            
            return (
              <button
                key={filter.id}
                onClick={() => setSpellFilter(filter.id)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap",
                  isActive 
                    ? "bg-white/10 border border-white/20 text-white shadow-lg" 
                    : "bg-transparent border border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                )}
              >
                <FilterIcon size={12} className={clsx(isActive && filter.color)} />
                <span>{filter.label}</span>
                <span className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-white/10 text-white" : "bg-white/5 text-neutral-600"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Liste groupée par niveau */}
        <div className="space-y-8">
          {Array.from(new Set(filterSpells(preparedSpellsList).map(s => s.level))).sort((a, b) => a - b).map(level => {
             const spellsOfLevel = filterSpells(preparedSpellsList).filter(s => s.level === level);
             
             if (spellsOfLevel.length === 0) return null;
             
             return (
               <div key={level} className="relative">
                 {/* Séparateur de Niveau */}
                 <div className="flex items-center gap-4 mb-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                    <span className="font-cinzel text-xs text-neutral-400 uppercase tracking-[0.2em] px-2 border border-white/10 rounded-full py-1 bg-[#0a0a0a]">
                      Niveau {level}
                    </span>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                 </div>

                 <div className="grid grid-cols-1 gap-3">
                   {spellsOfLevel.map(spell => (
                      <SpellCard 
                        key={spell.id} 
                        spell={spell} 
                        isPrepared={true}
                        isActiveEffect={character.activeEffects.some(e => e.id === spell.id)}
                        isFreeCast={character.dailyFreeCast.available && character.dailyFreeCast.spellId === spell.id}
                        onClick={() => setSelectedSpell(spell)}
                      />
                   ))}
                 </div>
               </div>
             );
          })}

          {filterSpells(preparedSpellsList).length === 0 && (
            <div className="text-center text-neutral-600 py-4 italic text-sm">
              {spellFilter === 'all' 
                ? "Aucun sort majeur préparé. Consultez votre grimoire."
                : "Aucun sort de ce type préparé."
              }
            </div>
          )}
        </div>
      </section>

      {/* --- MODALE REPOS --- */}
      <AnimatePresence>
        {showRestModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setShowRestModal(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
              
              <h3 className="text-center font-cinzel text-2xl text-white tracking-widest mb-2">Repos</h3>
              <p className="text-center text-neutral-500 text-sm mb-8 font-serif italic">Prenez un instant pour reprendre vos esprits.</p>

              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setShowRestModal(false);
                    setShowShortRestModal(true);
                  }}
                  className="w-full group relative p-4 rounded-xl border border-white/5 bg-[#121212] hover:bg-white/5 transition-all overflow-hidden text-left"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 rounded-lg bg-amber-900/20 text-amber-500 group-hover:bg-amber-900/30 transition-colors">
                      <Tent size={24} />
                    </div>
                    <div>
                      <h4 className="font-cinzel text-lg text-amber-100 group-hover:text-white transition-colors">Repos Court</h4>
                      <p className="text-xs text-neutral-500 mt-1">1 heure • Dés de vie + Restauration</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={handleLongRest}
                  className="w-full group relative p-4 rounded-xl border border-white/5 bg-[#121212] hover:bg-white/5 transition-all overflow-hidden text-left"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 rounded-lg bg-indigo-900/20 text-indigo-400 group-hover:bg-indigo-900/30 transition-colors">
                      <Moon size={24} />
                    </div>
                    <div>
                      <h4 className="font-cinzel text-lg text-indigo-100 group-hover:text-white transition-colors">Repos Long</h4>
                      <p className="text-xs text-neutral-500 mt-1">8 heures • Récupération totale</p>
                    </div>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setShowRestModal(false)}
                className="w-full mt-6 py-3 text-neutral-500 hover:text-white transition-colors text-xs tracking-widest uppercase font-bold"
              >
                Annuler
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODALE DÉTAIL SORT --- */}
      <AnimatePresence>
        {selectedSpell && (
          <SpellDetail spell={selectedSpell} onClose={() => setSelectedSpell(null)} />
        )}
      </AnimatePresence>

      {/* --- MODALE GESTION PV (PREMIUM) --- */}
      {showHpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowHpModal(false)} />
          
          <div className="relative w-full max-w-sm bg-[#080808] border border-white/10 rounded-2xl p-0 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
            <div className="relative bg-gradient-to-b from-[#151515] to-[#080808] p-6 pb-4 border-b border-white/5">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-magic-gold/50 blur-[2px] rounded-full"></div>
               <button 
                onClick={() => setShowHpModal(false)}
                className="absolute top-4 right-4 text-neutral-600 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-center font-cinzel text-2xl text-magic-gold tracking-widest drop-shadow-sm">Vitalité</h3>
            </div>

            <div className="p-8 pt-6 space-y-8">
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-bold font-cinzel text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{character.hp.current}</span>
                  <span className="text-xl text-neutral-500 font-cinzel">/ {character.hp.max}</span>
                </div>
                <div className="w-full h-1 bg-neutral-900 rounded-full mt-4 overflow-hidden border border-white/5">
                   <div 
                     className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-900 transition-all duration-500" 
                     style={{ width: `${(character.hp.current / character.hp.max) * 100}%` }}
                   />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setHpInput(Math.max(1, parseInt(hpInput) - 1).toString())}
                  className="w-12 h-12 rounded-lg border border-white/10 bg-[#121212] text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center active:scale-95"
                >
                  <Minus size={20} />
                </button>
                <div className="flex-1 relative group">
                  <div className="absolute inset-0 bg-magic-gold/5 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <input 
                    type="number" 
                    value={hpInput}
                    onChange={(e) => setHpInput(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-3 text-center text-3xl font-bold font-serif text-white focus:outline-none focus:border-magic-gold/50 transition-colors relative z-10"
                  />
                </div>
                <button 
                  onClick={() => setHpInput((parseInt(hpInput) + 1).toString())}
                  className="w-12 h-12 rounded-lg border border-white/10 bg-[#121212] text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleDamage}
                  className="group relative py-4 rounded-xl overflow-hidden border border-red-900/30 transition-all active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-red-950 to-black opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-20"></div>
                  <div className="relative flex flex-col items-center gap-1 z-10">
                    <span className="font-cinzel font-bold text-red-200 tracking-widest text-lg group-hover:text-white transition-colors drop-shadow-md">DÉGÂTS</span>
                    <div className="h-px w-8 bg-red-500/50 group-hover:w-12 transition-all duration-500"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                </button>

                <button 
                  onClick={handleHeal}
                  className="group relative py-4 rounded-xl overflow-hidden border border-emerald-900/30 transition-all active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 to-black opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-20"></div>
                  <div className="relative flex flex-col items-center gap-1 z-10">
                    <span className="font-cinzel font-bold text-emerald-200 tracking-widest text-lg group-hover:text-white transition-colors drop-shadow-md">SOIGNER</span>
                    <div className="h-px w-8 bg-emerald-500/50 group-hover:w-12 transition-all duration-500"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.5)]"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* --- MODALE REPOS COURT --- */}
      <AnimatePresence>
        {showShortRestModal && (
          <ShortRestModal onClose={() => setShowShortRestModal(false)} />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .clip-path-rune {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
      `}</style>
    </div>
  );
}
