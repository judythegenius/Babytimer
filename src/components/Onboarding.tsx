import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Baby, BabyGender, FeedingMode, AppSettings } from '../types';
import { requestNotificationPermission, triggerHaptic, getCharacterImage } from '../utils';
import { DEFAULT_BABY_AVATAR, PRESET_AVATARS } from '../data/avatars';
import { Sparkles, ChevronRight, Bell, Baby as BabyIcon, Milk, Heart, Upload } from 'lucide-react';

interface OnboardingProps {
  onComplete: (babies: Baby[], settings: AppSettings) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [isTwin, setIsTwin] = useState<boolean>(false);

  // Baby 1
  const [name1, setName1] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [gender1, setGender1] = useState<BabyGender>('female');
  const [avatarUrl1, setAvatarUrl1] = useState<string>('');

  // Baby 2 (Twins)
  const [name2, setName2] = useState<string>('');
  const [gender2, setGender2] = useState<BabyGender>('male');

  // Step 2 Feeding
  const [feedingMode, setFeedingMode] = useState<FeedingMode>('mixed');
  const [weaningStarted, setWeaningStarted] = useState<boolean>(false);

  // Step 3 Notifications
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [predictionAlert, setPredictionAlert] = useState<boolean>(true);
  const [cryAlert, setCryAlert] = useState<boolean>(true);

  // Auto-enable weaning if birthdate >= 150 days
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBirthDate(val);
    if (val) {
      const birth = new Date(val);
      const diffDays = (new Date().getTime() - birth.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 150) {
        setWeaningStarted(true);
      }
    }
  };

  const handleRequestPush = async () => {
    triggerHaptic();
    const granted = await requestNotificationPermission();
    setPushEnabled(granted);
  };

  const handleFinish = () => {
    triggerHaptic();
    const b1: Baby = {
      id: `baby_1_${Date.now()}`,
      name: name1.trim() || '보름이',
      birthDate: birthDate || new Date().toISOString().split('T')[0],
      gender: gender1,
      feedingMode,
      weaningStarted,
      isTwin,
      avatarUrl: avatarUrl1 || DEFAULT_BABY_AVATAR,
    };

    const babiesList: Baby[] = [b1];

    if (isTwin) {
      const b2: Baby = {
        id: `baby_2_${Date.now()}`,
        name: name2.trim() || '별님이',
        birthDate: birthDate || new Date().toISOString().split('T')[0],
        gender: gender2,
        feedingMode,
        weaningStarted,
        isTwin: true,
        avatarUrl: DEFAULT_BABY_AVATAR,
      };
      babiesList.push(b2);
    }

    const settings: AppSettings = {
      pushEnabled,
      predictionAlert,
      cryAlert,
      quietHoursStart: 23,
      quietHoursEnd: 7,
      activeBabyId: b1.id,
    };

    onComplete(babiesList, settings);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-5 max-w-md mx-auto relative font-sans text-slate-800">
      {/* Top Header */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-coral-500/10 flex items-center justify-center text-[#FF6B6B]">
              <Sparkles className="w-4 h-4 text-[#FF6B6B]" />
            </div>
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              우리아이 먹잠타이머
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full">
            {step} / 3 단계
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-8">
          <div
            className="bg-[#FF6B6B] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* STEP 1: Baby Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                아기 정보를 알려주세요 👶
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                아이 맞춤 수유·수면 수치를 계산해드려요.
              </p>
            </div>

            {/* Twin Toggle */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsTwin(false);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  !isTwin
                    ? 'bg-[#FF6B6B] text-white shadow-sm'
                    : 'bg-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                단태아 (1명)
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsTwin(true);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isTwin
                    ? 'bg-[#FF6B6B] text-white shadow-sm'
                    : 'bg-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                쌍둥이 (2명) 👶👶
              </button>
            </div>

            {/* Baby 1 Name & Gender */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="text-xs font-bold text-slate-400">
                {isTwin ? '첫째 아기 정보' : '아기 정보'}
              </div>

              {/* Character Avatar Upload / Selection */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  아기 캐릭터 / 프로필 사진
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl1 || getCharacterImage(birthDate, gender1)}
                    alt="아기 캐릭터"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_BABY_AVATAR;
                    }}
                    className="w-12 h-12 rounded-2xl object-contain bg-rose-50 p-1 border-2 border-rose-300 shadow-xs"
                  />
                  <div className="flex-1 space-y-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-rose-300" />
                      <span>내 이미지/캐릭터 업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setAvatarUrl1(ev.target.result as string);
                                triggerHaptic();
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = (avatarUrl1 || DEFAULT_BABY_AVATAR) === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          setAvatarUrl1(preset.url);
                        }}
                        className={`rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                          isSelected
                            ? 'border-rose-500 ring-2 ring-rose-200 scale-105'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-lg object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  아기 태명/이름 (최대 6자)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                  placeholder="예) 보름이"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  성별 선택
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setGender1('female');
                    }}
                    className={`py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${
                      gender1 === 'female'
                        ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>👧 여아</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setGender1('male');
                    }}
                    className={`py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${
                      gender1 === 'male'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>👦 남아</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Baby 2 Info (If Twins) */}
            {isTwin && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="text-xs font-bold text-slate-400">
                  둘째 아기 정보
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    둘째 이름 (최대 6자)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={name2}
                    onChange={(e) => setName2(e.target.value)}
                    placeholder="예) 별님이"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    성별 선택
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setGender2('female');
                      }}
                      className={`py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${
                        gender2 === 'female'
                          ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]'
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <span>👧 여아</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        setGender2('male');
                      }}
                      className={`py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${
                        gender2 === 'male'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <span>👦 남아</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BirthDate */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                생년월일
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={handleBirthDateChange}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6B6B]"
              />
            </div>
          </motion.div>
        )}

        {/* STEP 2: Feeding Mode */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                수유 방식이 어떻게 되나요? 🍼
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                주로 수유하시는 형태에 맞춰 패널을 세팅해드립니다.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'breast', label: '모유 수유', desc: '좌/우 타이머 스톱워치 제공', icon: '🤱' },
                { id: 'formula', label: '분유 수유', desc: 'mL 단위 원터치 기록', icon: '🍼' },
                { id: 'mixed', label: '혼합 수유', desc: '모유 + 분유 모두 기록', icon: '✨' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setFeedingMode(item.id as FeedingMode);
                  }}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                    feedingMode === item.id
                      ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{item.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Weaning Toggle */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900">이유식 기록 패널</div>
                <div className="text-xs text-slate-500">생후 150일 경 시작하는 이유식 카테고리</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setWeaningStarted(!weaningStarted);
                }}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  weaningStarted ? 'bg-[#FF6B6B] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Notification Permission */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                골든타임 알림 설정 🔔
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                다음 수유 시각과 잠타이밍에 맞춰 부드럽게 알려드려요.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                <Bell className="w-7 h-7 text-amber-500" />
              </div>

              <div>
                <div className="font-bold text-base text-slate-900">
                  {pushEnabled ? '브라우저 알림 허용됨 ✅' : '골든타임 알림 받기'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  앱을 열어두지 않아도 수유/수면 타이밍을 잊지 마세요.
                </div>
              </div>

              {!pushEnabled && (
                <button
                  type="button"
                  onClick={handleRequestPush}
                  className="w-full py-3 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-xs hover:bg-amber-600 active:scale-98 transition-all"
                >
                  알림 권한 요청하기
                </button>
              )}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">예측 알람 (수유/수면)</div>
                  <div className="text-[11px] text-slate-400">수유 및 잠타이밍 예상 시각에 알림</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPredictionAlert(!predictionAlert)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                    predictionAlert ? 'bg-[#FF6B6B] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">울음 원인 분석 가이드</div>
                  <div className="text-[11px] text-slate-400">규칙 기반 원인 우선순위 제시</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCryAlert(!cryAlert)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                    cryAlert ? 'bg-[#FF6B6B] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Nav Buttons */}
      <div className="pt-6 pb-2">
        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setStep(step + 1);
            }}
            className="w-full py-4 bg-[#FF6B6B] text-white rounded-2xl text-base font-bold shadow-md hover:bg-[#FF5252] active:scale-98 transition-all flex items-center justify-center gap-1"
          >
            <span>다음</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-4 bg-[#FF6B6B] text-white rounded-2xl text-base font-bold shadow-md hover:bg-[#FF5252] active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5 fill-current" />
            <span>육아 시작하기</span>
          </button>
        )}
      </div>
    </div>
  );
};
