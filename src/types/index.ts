export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export type Skill = {
  name: string;
  ability: Ability;
  proficient: boolean;
  expertise: boolean;
};

export type SpellSchool = 'Abjuration' | 'Conjuration' | 'Divination' | 'Enchantement' | 'Évocation' | 'Illusion' | 'Nécromancie' | 'Transmutation' | 'Chronomancie' | 'Aptitude' | 'Don';

export type SpellComponent = 'V' | 'S' | 'M';

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: SpellSchool;
  castingTime: string;
  range: string;
  components: SpellComponent[];
  materials?: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string; // HTML or Markdown supported
  higherLevels?: string;
  damage?: {
    dice: string; // e.g., "8d6"
    type: string; // e.g., "Feu"
  };
  effect?: {
    value: string; // e.g., "+5"
    label: string; // e.g., "Classe d'Armure"
    type: string; // e.g., "Buff" (used for styling)
  };
  classes: string[];
}

export interface SpellSlot {
  level: number;
  max: number;
  used: number;
}

export interface ActiveEffect {
  id: string; // spell id
  name: string;
  type: string; // "AC", "Other"
  value: number; // Parsed value
}

export interface CharacterStats {
  level: number;
  proficiencyBonus: number;
  hp: {
    current: number;
    max: number;
    temp: number;
  };
  abilities: Record<Ability, number>;
  skills: Skill[];
  preparedSpells: string[]; // List of Spell IDs
  knownSpells: string[]; // List of Spell IDs (Grimoire)
  slots: SpellSlot[];
  activeEffects: ActiveEffect[];
  dailyFreeCast: {
    available: boolean;
    spellId: string | null;
  };
  hitDice: {
    used: number;      // Nombre de dés utilisés
    die: number;       // Type de dé (6 pour magicien)
  };
  arcaneRecoveryUsed: boolean; // Restauration arcanique utilisée aujourd'hui
}
