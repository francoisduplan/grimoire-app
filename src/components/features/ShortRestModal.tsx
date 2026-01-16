"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Dices, Sparkles, Plus, Minus, Heart, Zap, Check } from "lucide-react";
import { clsx } from "clsx";
import { useCharacter } from "@/context/CharacterContext";

interface ShortRestModalProps {
  onClose: () => void;
}

export function ShortRestModal({ onClose }: ShortRestModalProps) {
  const { character, useHitDice, recoverSlots, useArcaneRecovery, heal } = useCharacter();
  
  // États locaux
  const [hitDiceToUse, setHitDiceToUse] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<Record<number, number>>({}); // { level: count }
  const [healResult, setHealResult] = useState<number | null>(null);
  const [step, setStep] = useState<'options' | 'result'>('options');

  // Calculs
  const conMod = Math.floor((character.abilities.CON - 10) / 2);
  const hitDiceAvailable = character.level - character.hitDice.used;
  const hitDieDie = character.hitDice.die;
  
  // Restauration arcanique : moitié du niveau arrondi au supérieur
  const arcaneRecoveryLevels = Math.ceil(character.level / 2);
  const arcaneRecoveryAvailable = !character.arcaneRecoveryUsed;
  
  // Calcul des niveaux de sorts sélectionnés
  const totalSelectedLevels = Object.entries(selectedSlots).reduce(
    (sum, [level, count]) => sum + (parseInt(level) * count), 0
  );
  const remainingLevels = arcaneRecoveryLevels - totalSelectedLevels;

  // Calcul de l'estimation des PV (médiane)
  // Médiane d'un dé = (1 + faces) / 2
  const medianRoll = (1 + hitDieDie) / 2;
  const estimatedHeal = Math.floor(hitDiceToUse * (medianRoll + conMod));

  // Vérifier si on peut ajouter un slot d'un niveau donné
  const canAddSlot = (level: number): boolean => {
    if (!arcaneRecoveryAvailable) return false;
    if (level > remainingLevels) return false;
    
    // Vérifier qu'il y a des slots utilisés à récupérer
    const slot = character.slots.find(s => s.level === level);
    if (!slot || slot.used === 0) return false;
    
    const currentSelected = selectedSlots[level] || 0;
    if (currentSelected >= slot.used) return false;
    
    return true;
  };

  // Ajouter/retirer un slot
  const toggleSlot = (level: number, delta: number) => {
    setSelectedSlots(prev => {
      const current = prev[level] || 0;
      const newValue = Math.max(0, current + delta);
      
      if (newValue === 0) {
        const { [level]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [level]: newValue };
    });
  };

  // Exécuter le repos court
  const handleRest = () => {
    let totalHeal = 0;
    
    // 1. Utiliser les dés de vie
    if (hitDiceToUse > 0) {
      // Lancer les dés et soigner
      for (let i = 0; i < hitDiceToUse; i++) {
        const roll = Math.floor(Math.random() * hitDieDie) + 1;
        totalHeal += Math.max(1, roll + conMod);
      }
      
      // Mettre à jour via le contexte (on utilise heal directement car useHitDice fait son propre heal)
      // On va plutôt simuler manuellement ici pour avoir le résultat
    }
    
    // En fait, utilisons useHitDice du contexte
    if (hitDiceToUse > 0) {
      // useHitDice retourne le total soigné
      const healed = useHitDice(hitDiceToUse);
      totalHeal = healed;
    }
    
    // 2. Restauration arcanique
    if (Object.keys(selectedSlots).length > 0) {
      const slotsToRecover = Object.entries(selectedSlots).map(([level, count]) => ({
        level: parseInt(level),
        count
      }));
      recoverSlots(slotsToRecover);
      useArcaneRecovery();
    }
    
    setHealResult(totalHeal);
    setStep('result');
  };

  // Rendu des slots disponibles pour restauration
  const renderSlotSelector = () => {
    // Filtrer les slots qui ont au moins 1 utilisé
    const usedSlots = character.slots.filter(s => s.used > 0);
    
    if (usedSlots.length === 0) {
      return (
        <p className="text-sm text-neutral-500 italic text-center py-4">
          Tous vos emplacements sont disponibles.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {usedSlots.map(slot => {
          const selected = selectedSlots[slot.level] || 0;
          const canAdd = canAddSlot(slot.level);
          const canRemove = selected > 0;
          
          return (
            <div 
              key={slot.level}
              className="flex items-center justify-between p-3 rounded-xl bg-[#0a0a0a] border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-900/30 border border-violet-500/30 flex items-center justify-center">
                  <span className="font-cinzel font-bold text-violet-300">{slot.level}</span>
                </div>
                <div>
                  <span className="text-sm text-white font-medium">Niveau {slot.level}</span>
                  <p className="text-[10px] text-neutral-500">{slot.used} utilisé{slot.used > 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSlot(slot.level, -1)}
                  disabled={!canRemove}
                  className={clsx(
                    "w-8 h-8 rounded-lg border flex items-center justify-center transition-all",
                    canRemove 
                      ? "border-white/10 bg-[#121212] text-white hover:bg-white/10" 
                      : "border-white/5 bg-[#0a0a0a] text-neutral-700 cursor-not-allowed"
                  )}
                >
                  <Minus size={14} />
                </button>
                
                <span className={clsx(
                  "w-8 text-center font-bold font-cinzel text-lg",
                  selected > 0 ? "text-violet-400" : "text-neutral-600"
                )}>
                  {selected}
                </span>
                
                <button
                  onClick={() => toggleSlot(slot.level, 1)}
                  disabled={!canAdd}
                  className={clsx(
                    "w-8 h-8 rounded-lg border flex items-center justify-center transition-all",
                    canAdd 
                      ? "border-white/10 bg-[#121212] text-white hover:bg-white/10" 
                      : "border-white/5 bg-[#0a0a0a] text-neutral-700 cursor-not-allowed"
                  )}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
        
        {/* Indicateur de niveaux restants */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-xs text-neutral-500">Niveaux restants :</span>
          <span className={clsx(
            "font-bold font-cinzel",
            remainingLevels > 0 ? "text-violet-400" : "text-neutral-600"
          )}>
            {remainingLevels}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-[#080808] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-b from-amber-950/30 to-transparent p-6 border-b border-white/5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-center font-cinzel text-2xl text-amber-100 tracking-widest">
            Repos Court
          </h2>
          <p className="text-center text-neutral-500 text-sm mt-1 font-serif italic">
            1 heure de repos
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 space-y-8"
            >
              {/* Section Dés de Vie */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-900/20 text-red-400">
                    <Dices size={18} />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-lg text-white tracking-wide">Dés de Vie</h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                      {hitDiceAvailable} disponible{hitDiceAvailable > 1 ? 's' : ''} sur {character.level}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/5 space-y-4">
                  {/* Sélecteur */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setHitDiceToUse(Math.max(0, hitDiceToUse - 1))}
                      disabled={hitDiceToUse === 0}
                      className={clsx(
                        "w-12 h-12 rounded-xl border flex items-center justify-center transition-all",
                        hitDiceToUse > 0 
                          ? "border-white/10 bg-[#121212] text-white hover:bg-white/10 active:scale-95" 
                          : "border-white/5 bg-[#0a0a0a] text-neutral-700 cursor-not-allowed"
                      )}
                    >
                      <Minus size={20} />
                    </button>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-5xl font-cinzel font-bold text-white">{hitDiceToUse}</span>
                      <span className="text-xs text-neutral-500 mt-1">D{hitDieDie}</span>
                    </div>
                    
                    <button
                      onClick={() => setHitDiceToUse(Math.min(hitDiceAvailable, hitDiceToUse + 1))}
                      disabled={hitDiceToUse >= hitDiceAvailable}
                      className={clsx(
                        "w-12 h-12 rounded-xl border flex items-center justify-center transition-all",
                        hitDiceToUse < hitDiceAvailable 
                          ? "border-white/10 bg-[#121212] text-white hover:bg-white/10 active:scale-95" 
                          : "border-white/5 bg-[#0a0a0a] text-neutral-700 cursor-not-allowed"
                      )}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  
                  {/* Estimation */}
                  {hitDiceToUse > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 pt-2 border-t border-white/5"
                    >
                      <Heart size={14} className="text-red-400" />
                      <span className="text-sm text-neutral-400">Estimation :</span>
                      <span className="font-bold text-red-400">~{estimatedHeal} PV</span>
                      <span className="text-xs text-neutral-600">
                        ({hitDiceToUse}D{hitDieDie} + {conMod >= 0 ? '+' : ''}{conMod * hitDiceToUse})
                      </span>
                    </motion.div>
                  )}
                </div>
              </section>

              {/* Section Restauration Arcanique */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className={clsx(
                    "p-2 rounded-lg",
                    arcaneRecoveryAvailable ? "bg-violet-900/20 text-violet-400" : "bg-neutral-900/20 text-neutral-600"
                  )}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className={clsx(
                      "font-cinzel text-lg tracking-wide",
                      arcaneRecoveryAvailable ? "text-white" : "text-neutral-600"
                    )}>
                      Restauration Arcanique
                    </h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                      {arcaneRecoveryAvailable ? `${arcaneRecoveryLevels} niveaux à répartir` : 'Déjà utilisée'}
                    </p>
                  </div>
                </div>

                {arcaneRecoveryAvailable ? (
                  <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/5">
                    {renderSlotSelector()}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#0a0a0a]/50 border border-white/5 text-center">
                    <p className="text-sm text-neutral-600 italic">
                      Disponible après un repos long.
                    </p>
                  </div>
                )}
              </section>

              {/* Bouton Confirmer */}
              <button
                onClick={handleRest}
                disabled={hitDiceToUse === 0 && Object.keys(selectedSlots).length === 0}
                className={clsx(
                  "w-full py-4 rounded-xl font-cinzel font-bold tracking-widest uppercase text-sm transition-all relative overflow-hidden group",
                  (hitDiceToUse > 0 || Object.keys(selectedSlots).length > 0)
                    ? "bg-gradient-to-r from-amber-700 to-amber-900 border border-amber-500/30 text-amber-100 hover:brightness-110 active:scale-[0.98]"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed"
                )}
              >
                <span className="relative z-10">Se Reposer</span>
                {(hitDiceToUse > 0 || Object.keys(selectedSlots).length > 0) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
              </button>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <Check size={40} className="text-white" />
              </div>
              
              <div className="text-center">
                <h3 className="font-cinzel text-xl text-white mb-2">Repos Terminé</h3>
                
                {healResult !== null && healResult > 0 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex items-center justify-center gap-2 text-red-400"
                  >
                    <Heart size={18} fill="currentColor" />
                    <span className="text-2xl font-bold">+{healResult} PV</span>
                  </motion.div>
                )}
                
                {Object.keys(selectedSlots).length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 flex items-center justify-center gap-2 text-violet-400"
                  >
                    <Zap size={16} />
                    <span className="text-sm">
                      {Object.entries(selectedSlots).map(([level, count]) => 
                        `${count}x Niv.${level}`
                      ).join(', ')} récupéré{totalSelectedLevels > 1 ? 's' : ''}
                    </span>
                  </motion.div>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl border border-white/10 bg-[#121212] text-white font-cinzel tracking-widest uppercase text-sm hover:bg-white/10 transition-all"
              >
                Fermer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
