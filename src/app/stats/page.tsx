"use client";

import { useCharacter } from "@/context/CharacterContext";
import { calculateModifier } from "@/lib/dnd-rules";
import { ChevronUp, ChevronDown, Sword, Shield, Scroll, Crown, Brain, Zap, Sparkles, Check, Dumbbell, Star, BookOpen, Feather, Scale, Theater, Leaf, Footprints, Plus, Minus, X } from 'lucide-react';
import { Ability, Skill } from "@/types";
import { clsx } from "clsx";
import { useState } from "react";

export default function StatsPage() {
  const { character, levelUp, levelDown, updateAbility, toggleSkill, updateSkill } = useCharacter();

  // État pour les modales d'édition
  const [editingAbility, setEditingAbility] = useState<Ability | null>(null);
  const [abilityValue, setAbilityValue] = useState(10); // Valeur temporaire

  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const openAbilityModal = (ability: Ability, currentValue: number) => {
    setEditingAbility(ability);
    setAbilityValue(currentValue);
  };

  const openSkillModal = (skill: Skill) => {
    setEditingSkill(skill);
  };

  const saveAbility = () => {
    if (editingAbility) {
      updateAbility(editingAbility, abilityValue);
      setEditingAbility(null);
    }
  };

  const handleUpdateSkill = (proficient: boolean, expertise: boolean) => {
    if (editingSkill) {
      updateSkill(editingSkill.name, proficient, expertise);
      setEditingSkill(null);
    }
  };

  const ABILITIES_CONFIG: Record<Ability, { label: string; icon: any; color: string }> = {
    STR: { label: "Force", icon: Sword, color: "text-red-400" },
    DEX: { label: "Dextérité", icon: Shield, color: "text-emerald-400" },
    CON: { label: "Constitution", icon: HeartIcon, color: "text-orange-400" },
    INT: { label: "Intelligence", icon: Brain, color: "text-blue-400" },
    WIS: { label: "Sagesse", icon: Scroll, color: "text-violet-400" },
    CHA: { label: "Charisme", icon: Crown, color: "text-amber-400" }
  };

  // Icônes spécifiques pour les groupes de compétences (plus thématiques RPG)
  const SKILL_ICONS: Record<Ability, any> = {
    STR: Dumbbell,
    DEX: Footprints,
    CON: HeartIcon, // Pas utilisé
    INT: BookOpen,
    WIS: Feather,
    CHA: Theater
  };

  // Helper pour l'icône Heart
  function HeartIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
  }

  const getSkillModifier = (skill: Skill) => {
    const abilityScore = character.abilities[skill.ability];
    const abilityMod = calculateModifier(abilityScore);
    let total = abilityMod;
    if (skill.proficient) total += character.proficiencyBonus;
    if (skill.expertise) total += character.proficiencyBonus;
    return total;
  };

  const skillsByAbility = character.skills.reduce((acc, skill) => {
    if (!acc[skill.ability]) acc[skill.ability] = [];
    acc[skill.ability].push(skill);
    return acc;
  }, {} as Record<Ability, Skill[]>);

  const ABILITY_ORDER: Ability[] = ['INT', 'WIS', 'CHA', 'DEX', 'STR'];

  return (
    <div className="pb-8 space-y-12">
      
      {/* --- EN-TÊTE CINÉMATIQUE --- */}
      <section className="relative pt-14 pb-2 text-center">
        <div className="inline-flex flex-col items-center max-w-full px-4">
          <span className="text-xs font-bold tracking-[0.3em] text-neutral-500 uppercase mb-2">
            Statistiques
          </span>
          <h1 className="text-6xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-b from-magic-gold via-[#ffeebb] to-[#a68a56] drop-shadow-md text-center leading-none tracking-tight">
            Edmont
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent mt-2 rounded-full" />
        </div>

        {/* Sélecteur de Niveau */}
        <div className="relative group flex flex-col items-center justify-center w-28 h-28 mx-auto mt-8">
           <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_20s_linear_infinite]"></div>
           <div className="absolute inset-2 border border-white/5 rounded-full border-dashed"></div>
           
           <button onClick={levelUp} className="absolute -top-4 text-neutral-600 hover:text-magic-gold transition-colors p-2"><ChevronUp /></button>
           
           <div className="flex flex-col items-center z-10">
             <span className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Niveau</span>
             <span className="text-4xl font-cinzel text-white font-bold">{character.level}</span>
           </div>

           <button onClick={levelDown} className="absolute -bottom-4 text-neutral-600 hover:text-magic-gold transition-colors p-2"><ChevronDown /></button>
        </div>
      </section>

      {/* --- ATTRIBUTS (CONSTELLATION) --- */}
      <section className="px-4">
        <h2 className="text-center font-cinzel text-neutral-400 text-base tracking-[0.25em] mb-8 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-neutral-700"></span>
          ATTRIBUTS
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-neutral-700"></span>
        </h2>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10">
          {(Object.entries(character.abilities) as [Ability, number][]).map(([key, value]) => {
            const mod = calculateModifier(value);
            const config = ABILITIES_CONFIG[key];

            return (
              <div key={key} className="flex flex-col items-center relative group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/5 -z-10 group-odd:bg-gradient-to-r group-even:bg-gradient-to-l from-transparent via-white/5 to-transparent"></div>

                <div className="relative">
                   {/* Clickable Circle opening Modal */}
                   <button 
                     onClick={() => openAbilityModal(key as Ability, value)}
                     className="relative w-20 h-20 flex items-center justify-center bg-[#0a0a0a] border border-white/10 rounded-full shadow-lg hover:border-white/50 hover:shadow-white/10 transition-all duration-300 active:scale-95 cursor-pointer"
                   >
                      <span className="text-2xl font-cinzel font-bold text-neutral-300 group-hover:text-white transition-colors">{value}</span>
                      
                      <div className={clsx(
                        "absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border bg-[#0f0f0f] shadow-md z-10",
                        mod >= 0 ? "text-magic-gold border-magic-gold/30" : "text-red-400 border-red-900/30"
                      )}>
                        {mod >= 0 ? '+' : ''}{mod}
                      </div>
                   </button>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase group-hover:text-neutral-300 transition-colors block">
                    {config.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- COMPÉTENCES --- */}
      <section className="px-4">
        <h2 className="text-center font-cinzel text-neutral-400 text-base tracking-[0.25em] mb-8 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-neutral-700"></span>
          COMPÉTENCES
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-neutral-700"></span>
        </h2>

        <div className="space-y-6">
          {ABILITY_ORDER.map((ability) => {
             const skills = skillsByAbility[ability];
             if (!skills || skills.length === 0) return null;

             const config = ABILITIES_CONFIG[ability];

             return (
               <div key={ability} className="relative rounded-xl bg-[#0e0e0e] border border-white/5 overflow-hidden">
                 {/* Header de Groupe */}
                 <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border-b border-white/5">
                   <span className={clsx("text-xs font-bold tracking-widest uppercase", "text-magic-gold")}>
                     {config.label}
                   </span>
                 </div>

                 {/* Liste des Skills */}
                 <div className="divide-y divide-white/5">
                    {skills.map((skill, idx) => {
                      const mod = getSkillModifier(skill);
                      const isProficient = skill.proficient;
                      const isExpertise = skill.expertise;

                      return (
                        <div 
                          key={skill.name} 
                          onClick={() => openSkillModal(skill)}
                          className={clsx(
                            "flex items-center justify-between px-4 py-3 transition-colors cursor-pointer active:bg-white/5",
                            idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]",
                            (isProficient || isExpertise) && "bg-white/[0.03]"
                          )}>
                          
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                                "flex items-center justify-center w-5 transition-transform duration-200",
                                isExpertise ? "text-magic-gold" : (isProficient ? "text-white" : "text-neutral-700")
                            )}>
                               {isExpertise ? (
                                 <Star size={12} fill="currentColor" />
                               ) : (
                                 <div className={clsx("w-1.5 h-1.5 rounded-full", isProficient ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" : "bg-neutral-800")} />
                               )}
                            </div>

                            <span className={clsx(
                              "text-sm transition-colors",
                              (isProficient || isExpertise) ? "text-neutral-200 font-medium" : "text-neutral-500 font-serif"
                            )}>
                              {skill.name}
                            </span>
                          </div>

                          <span className={clsx(
                            "font-cinzel text-sm w-8 text-right font-bold",
                            (isProficient || isExpertise) ? "text-white" : "text-neutral-700"
                          )}>
                             {mod >= 0 ? '+' : ''}{mod}
                          </span>
                        </div>
                      )
                    })}
                 </div>
               </div>
             )
          })}
        </div>
      </section>


      {/* --- MODALE EDIT ABILITY --- */}
      {editingAbility && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setEditingAbility(null)} />
          
          <div className="relative w-full max-w-xs bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col items-center gap-6">
             <button 
                onClick={() => setEditingAbility(null)}
                className="absolute top-4 right-4 text-neutral-600 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

             <h3 className="text-center font-cinzel text-xl text-magic-gold tracking-widest">
               {ABILITIES_CONFIG[editingAbility].label}
             </h3>

             <div className="flex items-center gap-6">
                <button 
                  onClick={() => setAbilityValue(Math.max(1, abilityValue - 1))}
                  className="w-12 h-12 rounded-lg border border-white/10 bg-[#121212] text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center active:scale-95"
                >
                  <Minus size={24} />
                </button>

                <div className="text-5xl font-bold font-cinzel text-white tabular-nums w-20 text-center">
                  {abilityValue}
                </div>

                <button 
                  onClick={() => setAbilityValue(Math.min(30, abilityValue + 1))}
                  className="w-12 h-12 rounded-lg border border-white/10 bg-[#121212] text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center active:scale-95"
                >
                  <Plus size={24} />
                </button>
             </div>

             <div className="text-sm text-neutral-500 font-serif italic">
               Modificateur: <span className="text-white font-bold">{calculateModifier(abilityValue) >= 0 ? '+' : ''}{calculateModifier(abilityValue)}</span>
             </div>

             <button 
               onClick={saveAbility}
               className="w-full py-3 rounded-lg bg-magic-gold/10 border border-magic-gold/20 text-magic-gold hover:bg-magic-gold/20 hover:text-white font-cinzel font-bold tracking-widest uppercase transition-all"
             >
               Confirmer
             </button>
          </div>
        </div>
      )}

      {/* --- MODALE EDIT SKILL --- */}
      {editingSkill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setEditingSkill(null)} />
          
          <div className="relative w-full max-w-xs bg-[#080808] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col gap-4">
             <button 
                onClick={() => setEditingSkill(null)}
                className="absolute top-4 right-4 text-neutral-600 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

             <h3 className="text-center font-cinzel text-xl text-white tracking-widest mb-2">
               {editingSkill.name}
             </h3>

             <div className="grid grid-cols-1 gap-3">
               <button 
                 onClick={() => handleUpdateSkill(false, false)}
                 className={clsx(
                   "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                   !editingSkill.proficient && !editingSkill.expertise 
                     ? "bg-white/10 border-magic-gold/50 text-white" 
                     : "bg-[#121212] border-white/5 text-neutral-400 hover:bg-white/5"
                 )}
               >
                 <div className="w-6 h-6 rounded-full border border-neutral-600 flex items-center justify-center"></div>
                 <span className="font-serif font-bold tracking-wide">Non maîtrisé</span>
               </button>

               <button 
                 onClick={() => handleUpdateSkill(true, false)}
                 className={clsx(
                   "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                   editingSkill.proficient && !editingSkill.expertise
                     ? "bg-white/10 border-magic-gold/50 text-white" 
                     : "bg-[#121212] border-white/5 text-neutral-400 hover:bg-white/5"
                 )}
               >
                 <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                   <div className="w-2 h-2 rounded-full bg-black"></div>
                 </div>
                 <span className="font-serif font-bold tracking-wide">Maîtrise</span>
               </button>

               <button 
                 onClick={() => handleUpdateSkill(true, true)}
                 className={clsx(
                   "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                   editingSkill.expertise
                     ? "bg-magic-gold/10 border-magic-gold text-magic-gold" 
                     : "bg-[#121212] border-white/5 text-neutral-400 hover:bg-white/5"
                 )}
               >
                 <div className="w-6 h-6 flex items-center justify-center text-magic-gold drop-shadow-[0_0_5px_rgba(212,180,131,0.8)]">
                   <Star fill="currentColor" size={20} />
                 </div>
                 <span className="font-serif font-bold tracking-wide">Expertise</span>
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
