"use client";

import { useState } from 'react';
import { SPELLS_DATA } from '@/data/spells';
import { SpellDetail } from '@/components/features/SpellDetail';
import { SpellCard } from '@/components/ui/SpellCard';
import { Spell } from '@/types';
import { Search, Layers, Swords, Shield, Eye } from 'lucide-react';
import { useCharacter } from "@/context/CharacterContext";
import { AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

type SpellFilter = 'all' | 'attack' | 'defense' | 'utility';

export default function GrimoirePage() {
  const [search, setSearch] = useState('');
  const [spellFilter, setSpellFilter] = useState<SpellFilter>('all');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const { character } = useCharacter();

  // Configuration des filtres
  const FILTER_CONFIG = [
    { id: 'all' as SpellFilter, label: 'Tous', icon: Layers, color: 'text-neutral-400' },
    { id: 'attack' as SpellFilter, label: 'Attaque', icon: Swords, color: 'text-red-400' },
    { id: 'defense' as SpellFilter, label: 'Défense', icon: Shield, color: 'text-blue-400' },
    { id: 'utility' as SpellFilter, label: 'Utilité', icon: Eye, color: 'text-violet-400' },
  ];

  // Fonction pour catégoriser un sort
  const getSpellCategory = (spell: Spell): 'attack' | 'defense' | 'utility' => {
    if (spell.damage) return 'attack';
    if (spell.effect?.type === 'Buff' || spell.effect?.type === 'Défense') return 'defense';
    return 'utility';
  };

  const knownSpells = SPELLS_DATA.filter(s => character.knownSpells.includes(s.id));
  
  // Filtrage combiné (Recherche + Catégorie)
  let processedSpells = knownSpells.filter(spell => {
    // 1. Recherche texte
    const matchesSearch = spell.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Filtre par Catégorie
    if (spellFilter === 'all') return true;
    return getSpellCategory(spell) === spellFilter;
  });

  // Tri par niveau puis par nom
  processedSpells.sort((a, b) => {
    // 1. Dons/Aptitudes en premier (niveau -1 virtuellement)
    const isFeatA = ['Don', 'Aptitude', 'Chronomancie'].includes(a.school);
    const isFeatB = ['Don', 'Aptitude', 'Chronomancie'].includes(b.school);
    if (isFeatA && !isFeatB) return -1;
    if (!isFeatA && isFeatB) return 1;

    // 2. Ensuite par Niveau
    if (a.level !== b.level) {
      return a.level - b.level;
    }

    // 3. Enfin par Nom
    return a.name.localeCompare(b.name);
  });

  // Grouper les sorts par niveau
  const getSpellLevel = (spell: Spell): string => {
    if (['Don', 'Aptitude', 'Chronomancie'].includes(spell.school)) return 'dons';
    if (spell.level === 0) return 'cantrips';
    return `niveau-${spell.level}`;
  };

  const spellsByLevel = processedSpells.reduce((acc, spell) => {
    const level = getSpellLevel(spell);
    if (!acc[level]) acc[level] = [];
    acc[level].push(spell);
    return acc;
  }, {} as Record<string, Spell[]>);

  // Ordre d'affichage des niveaux
  const levelOrder = ['dons', 'cantrips', 'niveau-1', 'niveau-2', 'niveau-3', 'niveau-4', 'niveau-5', 'niveau-6', 'niveau-7', 'niveau-8', 'niveau-9'];
  const orderedLevels = levelOrder.filter(level => spellsByLevel[level]?.length > 0);

  // Labels pour les séparateurs
  const getLevelLabel = (level: string): string => {
    if (level === 'dons') return 'Dons & Aptitudes';
    if (level === 'cantrips') return 'Cantrips';
    return `Niveau ${level.split('-')[1]}`;
  };

  // Calcul limite (pour info header) - Cap fixe de 12
  const maxPrepared = 12;
  const currentPreparedCount = character.preparedSpells.filter(id => {
     const s = SPELLS_DATA.find(d => d.id === id);
     return s && s.level > 0 && !['Don', 'Aptitude', 'Chronomancie'].includes(s.school);
  }).length;

  return (
    <div className="pb-8">
      <header className="relative pt-14 pb-2 text-center mb-6">
        <div className="inline-flex flex-col items-center max-w-full px-4">
          <span className="text-xs font-bold tracking-[0.3em] text-neutral-500 uppercase mb-2">
            Préparés : <span className={currentPreparedCount > maxPrepared ? "text-red-400" : "text-white"}>{currentPreparedCount}</span> / {maxPrepared}
          </span>
          <h1 className="text-6xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-b from-magic-gold via-[#ffeebb] to-[#a68a56] drop-shadow-md text-center leading-none tracking-tight">
            Grimoire
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent mt-2 rounded-full" />
        </div>
      </header>

      {/* Barre de Recherche */}
      <div className="relative mx-4 mb-4 group">
        {/* Fond avec effet de profondeur */}
        <div className="absolute inset-0 bg-gradient-to-r from-magic-gold/5 via-transparent to-magic-gold/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm border border-magic-gold/10 rounded-2xl shadow-[inset_0_1px_0_rgba(212,180,131,0.1)] group-focus-within:border-magic-gold/30 group-focus-within:shadow-[0_0_20px_rgba(212,180,131,0.1)] transition-all duration-300" />
        
        {/* Icône */}
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
          <Search className="text-magic-gold/40 group-focus-within:text-magic-gold transition-colors duration-300" size={18} />
        </div>
        
        {/* Input */}
        <input 
          type="text" 
          placeholder="Rechercher dans le grimoire..." 
          className="relative z-10 w-full bg-transparent py-3.5 pl-12 pr-4 text-gray-200 placeholder:text-neutral-600 placeholder:font-serif placeholder:italic focus:outline-none font-serif text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        {/* Décoration coins */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-magic-gold/20 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-magic-gold/20 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-magic-gold/20 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-magic-gold/20 rounded-br-2xl pointer-events-none" />
      </div>

      {/* Barre de Filtres */}
      <div className="flex items-center gap-1 mb-6 px-4 py-2 overflow-x-auto scrollbar-hide">
        {FILTER_CONFIG.map(filter => {
          const FilterIcon = filter.icon;
          const isActive = spellFilter === filter.id;
          const count = filter.id === 'all' 
            ? knownSpells.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).length
            : knownSpells.filter(s => 
                s.name.toLowerCase().includes(search.toLowerCase()) && 
                getSpellCategory(s) === filter.id
              ).length;
          
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

      {/* Liste des Sorts par Niveau */}
      <div className="space-y-8 px-4">
        {orderedLevels.map(level => {
          const spells = spellsByLevel[level];
          
          return (
            <div key={level} className="relative">
              {/* Séparateur de Niveau */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-gradient-to-r from-transparent via-magic-gold/30 to-transparent flex-1"></div>
                <span className="font-cinzel text-xs text-magic-gold/80 uppercase tracking-[0.2em] px-3 border border-magic-gold/20 rounded-full py-1.5 bg-[#0a0a0a]">
                  {getLevelLabel(level)}
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-magic-gold/30 to-transparent flex-1"></div>
              </div>

              {/* Sorts de ce niveau */}
              <div className="space-y-3">
                {spells.map(spell => {
                  const isAlwaysPrepared = spell.level === 0 || ['Don', 'Aptitude', 'Chronomancie'].includes(spell.school);
                  const isPrepared = isAlwaysPrepared || character.preparedSpells.includes(spell.id);
                  
                  return (
                    <SpellCard 
                      key={spell.id}
                      spell={spell}
                      isPrepared={isPrepared}
                      isKnown={true}
                      onClick={() => setSelectedSpell(spell)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {processedSpells.length === 0 && (
        <div className="text-center text-neutral-600 py-12 italic font-serif">
          {search || spellFilter !== 'all' 
            ? "Aucun sort ne correspond à vos critères."
            : "Votre grimoire est vide..."
          }
        </div>
      )}

      <AnimatePresence>
        {selectedSpell && (
          <SpellDetail spell={selectedSpell} onClose={() => setSelectedSpell(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
