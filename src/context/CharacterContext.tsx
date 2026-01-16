"use client";

import React, { createContext, useContext, useState } from 'react';
import { CharacterStats, ActiveEffect, Ability } from '@/types';
import { getMaxSpellSlots, getProficiencyBonus } from '@/lib/dnd-rules';

interface CharacterContextType {
  character: CharacterStats;
  castSpell: (level: number) => void;
  recoverSlot: (level: number) => void;
  recoverSlots: (slotsToRecover: { level: number; count: number }[]) => void;
  prepareSpell: (spellId: string) => void;
  unprepareSpell: (spellId: string) => void;
  learnSpell: (spellId: string) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  longRest: () => void;
  levelUp: () => void;
  levelDown: () => void;
  updateAbility: (ability: Ability, value: number) => void;
  toggleSkill: (skillName: string) => void;
  updateSkill: (skillName: string, proficient: boolean, expertise: boolean) => void;
  addEffect: (effect: ActiveEffect) => void;
  removeEffect: (effectId: string) => void;
  setFreeCastSpell: (spellId: string) => void;
  consumeFreeCast: () => void;
  useHitDice: (count: number) => number;
  useArcaneRecovery: () => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

const INITIAL_CHARACTER: CharacterStats = {
  level: 4,
  proficiencyBonus: 2,
  hp: {
    current: 26, // Ajusté pour niveau 4 (approx d6 + CON)
    max: 26,
    temp: 0,
  },
  abilities: {
    STR: 10,
    DEX: 14,
    CON: 14,
    INT: 18,
    WIS: 12,
    CHA: 10,
  },
  skills: [
    { name: 'Acrobaties', ability: 'DEX', proficient: false, expertise: false },
    { name: 'Arcanes', ability: 'INT', proficient: true, expertise: false },
    { name: 'Athlétisme', ability: 'STR', proficient: false, expertise: false },
    { name: 'Discrétion', ability: 'DEX', proficient: true, expertise: false },
    { name: 'Dressage', ability: 'WIS', proficient: false, expertise: false },
    { name: 'Escamotage', ability: 'DEX', proficient: true, expertise: false },
    { name: 'Histoire', ability: 'INT', proficient: true, expertise: false },
    { name: 'Intimidation', ability: 'CHA', proficient: false, expertise: false },
    { name: 'Investigation', ability: 'INT', proficient: true, expertise: true },
    { name: 'Médecine', ability: 'WIS', proficient: false, expertise: false },
    { name: 'Nature', ability: 'INT', proficient: true, expertise: false },
    { name: 'Perception', ability: 'WIS', proficient: false, expertise: false },
    { name: 'Perspicacité', ability: 'WIS', proficient: true, expertise: false },
    { name: 'Persuasion', ability: 'CHA', proficient: false, expertise: false },
    { name: 'Religion', ability: 'INT', proficient: true, expertise: false },
    { name: 'Représentation', ability: 'CHA', proficient: false, expertise: false },
    { name: 'Survie', ability: 'WIS', proficient: false, expertise: false },
    { name: 'Tromperie', ability: 'CHA', proficient: false, expertise: false },
  ],
  preparedSpells: ['fire-bolt', 'mage-hand', 'minor-illusion', 'shield', 'mage-armor', 'magic-missile', 'chronal-shift'],
  knownSpells: [
    'fire-bolt', 'mage-hand', 'minor-illusion', 'message', 'true-strike',
    'thunderwave', 'chromatic-orb', 'comprehend-languages', 'detect-magic', 'feather-fall', 'identify', 'grease', 'shield', 'mage-armor', 'magic-missile',
    'mirror-image', 'scorching-ray',
    'chronal-shift', 'lucky', 'spell-sniper'
  ],
  slots: getMaxSpellSlots(4),
  activeEffects: [],
  dailyFreeCast: { available: true, spellId: null },
  hitDice: { used: 0, die: 6 }, // Magicien = d6
  arcaneRecoveryUsed: false,
};

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [character, setCharacter] = useState<CharacterStats>(INITIAL_CHARACTER);

  const updateDerivedStats = (newLevel: number, currentSlots: typeof character.slots) => {
    const newMaxSlots = getMaxSpellSlots(newLevel);
    
    // Merge used slots with new max slots
    const updatedSlots = newMaxSlots.map((newSlot, idx) => {
        const oldSlot = currentSlots[idx];
        return {
          ...newSlot,
          used: oldSlot ? Math.min(oldSlot.used, newSlot.max) : 0 
        };
    });

    return {
      proficiencyBonus: getProficiencyBonus(newLevel),
      slots: updatedSlots
    };
  };

  const castSpell = (level: number) => {
    setCharacter(prev => {
      const newSlots = prev.slots.map(slot => {
        if (slot.level === level) {
          if (slot.used < slot.max) {
            return { ...slot, used: slot.used + 1 };
          }
        }
        return slot;
      });
      return { ...prev, slots: newSlots };
    });
  };

  const recoverSlot = (level: number) => {
    setCharacter(prev => {
      const newSlots = prev.slots.map(slot => {
        if (slot.level === level) {
          if (slot.used > 0) {
            return { ...slot, used: slot.used - 1 };
          }
        }
        return slot;
      });
      return { ...prev, slots: newSlots };
    });
  };

  const recoverSlots = (slotsToRecover: { level: number; count: number }[]) => {
    setCharacter(prev => {
      const newSlots = prev.slots.map(slot => {
        const recovery = slotsToRecover.find(r => r.level === slot.level);
        if (recovery) {
          const newUsed = Math.max(0, slot.used - recovery.count);
          return { ...slot, used: newUsed };
        }
        return slot;
      });
      return { ...prev, slots: newSlots };
    });
  };

  const useHitDice = (count: number): number => {
    let totalHeal = 0;
    const conMod = Math.floor((character.abilities.CON - 10) / 2);
    
    setCharacter(prev => {
      const available = prev.level - prev.hitDice.used;
      const actualCount = Math.min(count, available);
      
      // Lancer les dés
      for (let i = 0; i < actualCount; i++) {
        const roll = Math.floor(Math.random() * prev.hitDice.die) + 1;
        totalHeal += Math.max(1, roll + conMod); // Minimum 1 PV par dé
      }
      
      const newHp = Math.min(prev.hp.max, prev.hp.current + totalHeal);
      
      return {
        ...prev,
        hitDice: { ...prev.hitDice, used: prev.hitDice.used + actualCount },
        hp: { ...prev.hp, current: newHp }
      };
    });
    
    return totalHeal;
  };

  const useArcaneRecovery = () => {
    setCharacter(prev => ({ ...prev, arcaneRecoveryUsed: true }));
  };

  const prepareSpell = (spellId: string) => {
    setCharacter(prev => {
      if (prev.preparedSpells.includes(spellId)) return prev;
      
      // Cap fixe de 12 sorts préparables (hors cantrips et dons)
      const maxPrepared = 12;
      
      // Ne pas bloquer pour les cantrips/dons - ils ne comptent pas vers la limite
      // La vérification du cap se fait uniquement côté UI dans SpellDetail
      
      return { ...prev, preparedSpells: [...prev.preparedSpells, spellId] };
    });
  };

  const unprepareSpell = (spellId: string) => {
    setCharacter(prev => ({
      ...prev,
      preparedSpells: prev.preparedSpells.filter(id => id !== spellId)
    }));
  };

  const learnSpell = (spellId: string) => {
    setCharacter(prev => {
      if (prev.knownSpells.includes(spellId)) return prev;
      return { ...prev, knownSpells: [...prev.knownSpells, spellId] };
    });
  };

  const takeDamage = (amount: number) => {
    setCharacter(prev => ({
      ...prev,
      hp: { ...prev.hp, current: Math.max(0, prev.hp.current - amount) }
    }));
  };

  const heal = (amount: number) => {
    setCharacter(prev => ({
      ...prev,
      hp: { ...prev.hp, current: Math.min(prev.hp.max, prev.hp.current + amount) }
    }));
  };


  const levelUp = () => {
    setCharacter(prev => {
      const newLevel = Math.min(20, prev.level + 1);
      const derived = updateDerivedStats(newLevel, prev.slots);
      return { 
        ...prev, 
        level: newLevel,
        ...derived
      };
    });
  };

  const levelDown = () => {
    setCharacter(prev => {
      const newLevel = Math.max(1, prev.level - 1);
      const derived = updateDerivedStats(newLevel, prev.slots);
      return { 
        ...prev, 
        level: newLevel,
        ...derived
      };
    });
  };

  const updateAbility = (ability: Ability, value: number) => {
    setCharacter(prev => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [ability]: Math.max(1, Math.min(30, value))
      }
    }));
  };

  const toggleSkill = (skillName: string) => {
    setCharacter(prev => {
      const newSkills = prev.skills.map(skill => {
        if (skill.name === skillName) {
          if (skill.expertise) {
            // Expertise -> None
            return { ...skill, proficient: false, expertise: false };
          } else if (skill.proficient) {
            // Proficient -> Expertise
            return { ...skill, proficient: true, expertise: true };
          } else {
            // None -> Proficient
            return { ...skill, proficient: true, expertise: false };
          }
        }
        return skill;
      });
      return { ...prev, skills: newSkills };
    });
  };

  const updateSkill = (skillName: string, proficient: boolean, expertise: boolean) => {
    setCharacter(prev => {
      const newSkills = prev.skills.map(skill => {
        if (skill.name === skillName) {
          return { ...skill, proficient, expertise };
        }
        return skill;
      });
      return { ...prev, skills: newSkills };
    });
  };

  const addEffect = (effect: ActiveEffect) => {
    setCharacter(prev => ({
      ...prev,
      activeEffects: [...prev.activeEffects, effect]
    }));
  };

  const removeEffect = (effectId: string) => {
    setCharacter(prev => ({
      ...prev,
      activeEffects: prev.activeEffects.filter(e => e.id !== effectId)
    }));
  };

  const setFreeCastSpell = (spellId: string) => {
    setCharacter(prev => ({
      ...prev,
      dailyFreeCast: { ...prev.dailyFreeCast, spellId }
    }));
  };

  const consumeFreeCast = () => {
    setCharacter(prev => ({
      ...prev,
      dailyFreeCast: { ...prev.dailyFreeCast, available: false }
    }));
  };

  const longRest = () => {
    setCharacter(prev => {
      // Récupère la moitié des dés de vie (minimum 1)
      const hitDiceRecovered = Math.max(1, Math.floor(prev.level / 2));
      const newHitDiceUsed = Math.max(0, prev.hitDice.used - hitDiceRecovered);
      
      return {
        ...prev,
        hp: { ...prev.hp, current: prev.hp.max },
        slots: prev.slots.map(slot => ({ ...slot, used: 0 })),
        dailyFreeCast: { available: true, spellId: null },
        hitDice: { ...prev.hitDice, used: newHitDiceUsed },
        arcaneRecoveryUsed: false
      };
    });
  };

  return (
    <CharacterContext.Provider value={{
      character,
      castSpell,
      recoverSlot,
      recoverSlots,
      prepareSpell,
      unprepareSpell,
      learnSpell,
      takeDamage,
      heal,
      longRest,
      levelUp,
      levelDown,
      updateAbility,
      toggleSkill,
      updateSkill,
      addEffect,
      removeEffect,
      setFreeCastSpell,
      consumeFreeCast,
      useHitDice,
      useArcaneRecovery
    }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}
