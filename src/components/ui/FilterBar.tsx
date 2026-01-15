"use client";

import { clsx } from 'clsx';

export type SortOption = 'level' | 'name' | 'damage' | 'buff' | 'feat';

interface FilterBarProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function FilterBar({ currentSort, onSortChange }: FilterBarProps) {
  const options: { id: SortOption; label: string }[] = [
    { id: 'level', label: 'Niveau' },
    { id: 'name', label: 'A-Z' },
    { id: 'damage', label: 'Dégâts' },
    { id: 'buff', label: 'Effets' },
    { id: 'feat', label: 'Dons' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 px-4 scrollbar-hide snap-x">
      {options.map((option) => {
        const isActive = currentSort === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSortChange(option.id)}
            className={clsx(
              "snap-start shrink-0 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 border backdrop-blur-sm",
              isActive 
                ? "bg-magic-gold/20 border-magic-gold text-magic-gold shadow-[0_0_15px_rgba(212,180,131,0.2)]" 
                : "bg-white/5 border-white/10 text-neutral-500 hover:bg-white/10 hover:text-neutral-300 hover:border-white/20"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
