import React from 'react';
import { Baby } from '../types';
import { getAgeInDays, getAgeInWeeks } from '../data/guides';
import { DEFAULT_BABY_AVATAR } from '../data/avatars';
import { Settings } from 'lucide-react';
import { triggerHaptic, getCharacterImage } from '../utils';

interface HeaderProps {
  babies: Baby[];
  activeBabyId: string;
  onSelectBaby: (id: string) => void;
  onOpenSettings: () => void;
  onOpenBabySelector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  babies,
  activeBabyId,
  onSelectBaby,
  onOpenSettings,
}) => {
  const activeBaby = babies.find((b) => b.id === activeBabyId) || babies[0];

  if (!activeBaby) return null;

  const ageDays = getAgeInDays(activeBaby.birthDate);
  const ageWeeks = getAgeInWeeks(activeBaby.birthDate);
  const characterImg = activeBaby.avatarUrl || getCharacterImage(activeBaby.birthDate, activeBaby.gender);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Baby Tabs if Twins / Multiple or Single Baby indicator */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {babies.length > 1 ? (
            babies.map((baby) => {
              const isActive = baby.id === activeBabyId;
              const bAvatar = baby.avatarUrl || getCharacterImage(baby.birthDate, baby.gender);
              return (
                <button
                  key={baby.id}
                  onClick={() => {
                    triggerHaptic();
                    onSelectBaby(baby.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs scale-102'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <img
                    src={bAvatar}
                    alt={baby.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_BABY_AVATAR;
                    }}
                    className="w-6 h-6 rounded-full object-contain bg-rose-50 p-0.5 border border-white/40"
                  />
                  <span>{baby.name}</span>
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={characterImg}
                  alt={activeBaby.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_BABY_AVATAR;
                  }}
                  className="w-10 h-10 rounded-full object-contain bg-rose-50 border-2 border-rose-200 shadow-xs p-0.5"
                />
                <span className="absolute -bottom-0.5 -right-0.5 text-xs">
                  {activeBaby.gender === 'female' ? '👧' : '👦'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-slate-900 leading-tight">
                    {activeBaby.name}
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-black px-1.5 py-0.5 rounded-full">
                    D+{ageDays}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-semibold">
                  생후 {ageDays}일 · {ageWeeks}주차
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Settings Gear */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenSettings();
          }}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center text-slate-600 shadow-2xs"
          aria-label="설정"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
