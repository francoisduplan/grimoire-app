import { SpellSlot } from "@/types";

export const getProficiencyBonus = (level: number): number => {
  return Math.ceil(level / 4) + 1;
};

// Table du Magicien (Wizard) 5e
const WIZARD_SLOTS_TABLE: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

export const getMaxSpellSlots = (level: number): SpellSlot[] => {
  const slotsConfig = WIZARD_SLOTS_TABLE[level] || [];
  return slotsConfig.map((count, index) => ({
    level: index + 1,
    max: count,
    used: 0
  }));
};

export const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export const getSaveDC = (intScore: number, proficiency: number): number => {
  return 8 + proficiency + calculateModifier(intScore);
};

export const getAttackBonus = (intScore: number, proficiency: number): number => {
  return proficiency + calculateModifier(intScore);
};
