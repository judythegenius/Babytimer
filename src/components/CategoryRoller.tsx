import React from 'react';
import { ActivityType } from '../types';
import { triggerHaptic } from '../utils';
import { motion } from 'motion/react';

export type RollerCategory = 'feed' | 'sleep' | 'diaper' | 'cry';

interface CategoryRollerProps {
  activeCategory: RollerCategory;
  onSelectCategory: (cat: RollerCategory) => void;
}

export const CategoryRoller: React.FC<CategoryRollerProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  const categories: Array<{
    id: RollerCategory;
    label: string;
    icon: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
  }> = [
    {
      id: 'feed',
      label: '먹',
      icon: '/icons/feed.png',
      activeBg: 'bg-[#FF6B6B]',
      activeText: 'text-white',
      activeBorder: 'border-[#FF6B6B]',
    },
    {
      id: 'sleep',
      label: '잠',
      icon: '/icons/sleep.png',
      activeBg: 'bg-[#A78BFA]',
      activeText: 'text-white',
      activeBorder: 'border-[#A78BFA]',
    },
    {
      id: 'diaper',
      label: '대소변',
      icon: '/icons/diaper.png',
      activeBg: 'bg-[#34D399]',
      activeText: 'text-slate-900',
      activeBorder: 'border-[#34D399]',
    },
    {
      id: 'cry',
      label: '울음',
      icon: '/icons/cry.png',
      activeBg: 'bg-[#FBBF24]',
      activeText: 'text-slate-900',
      activeBorder: 'border-[#FBBF24]',
    },
  ];

  return (
    <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between gap-1 shadow-xs my-2">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectCategory(cat.id);
            }}
            className={`relative flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 select-none ${
              isActive
                ? `${cat.activeBg} ${cat.activeText} shadow-md scale-102`
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
            }`}
          >
            <img
              src={cat.icon}
              alt={cat.label}
              className={`w-6 h-6 object-contain transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}
            />
            <span className="whitespace-nowrap">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
