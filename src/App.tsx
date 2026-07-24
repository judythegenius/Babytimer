/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Baby,
  AppSettings,
  ActivityLog,
  PredictionResult,
} from './types';
import {
  getStoredBabies,
  saveBabies,
  getStoredLogs,
  getAppSettings,
  saveAppSettings,
  calculatePrediction,
  sendPushNotification,
  triggerHaptic,
} from './utils';
import { Onboarding } from './components/Onboarding';
import { Header } from './components/Header';
import { GoldenTimeBanner } from './components/GoldenTimeBanner';
import { CategoryRoller, RollerCategory } from './components/CategoryRoller';
import { FeedPanel } from './components/FeedPanel';
import { SleepPanel } from './components/SleepPanel';
import { DiaperPanel } from './components/DiaperPanel';
import { CryPanel } from './components/CryPanel';
import { ReportView } from './components/ReportView';
import { SettingsModal } from './components/SettingsModal';
import { Clock, BarChart2, Sparkles, Heart } from 'lucide-react';

type MainTab = 'timer' | 'report';

export default function App() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings>({
    pushEnabled: false,
    predictionAlert: true,
    cryAlert: true,
    quietHoursStart: 23,
    quietHoursEnd: 7,
    activeBabyId: '',
  });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Navigation
  const [mainTab, setMainTab] = useState<MainTab>('timer');
  const [activeCategory, setActiveCategory] = useState<RollerCategory>('feed');

  // Settings Modal
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Initial Load
  useEffect(() => {
    const loadedBabies = getStoredBabies();
    const loadedSettings = getAppSettings();
    const loadedLogs = getStoredLogs();

    setBabies(loadedBabies);
    setSettings(loadedSettings);
    setLogs(loadedLogs);

    if (loadedBabies.length > 0) {
      setActiveBabyId(loadedSettings.activeBabyId || loadedBabies[0].id);
    }

    setIsLoaded(true);
  }, []);

  // Reload logs handler
  const handleRefreshLogs = () => {
    const updated = getStoredLogs();
    setLogs(updated);
  };

  // Active Baby
  const activeBaby = babies.find((b) => b.id === activeBabyId) || babies[0];

  // Prediction calculations for active baby
  const activeBabyLogs = activeBaby
    ? logs.filter((l) => l.babyId === activeBaby.id)
    : [];
  const prediction: PredictionResult | null = activeBaby
    ? calculatePrediction(activeBaby.birthDate, activeBabyLogs)
    : null;

  // Background prediction Push Notifications check
  useEffect(() => {
    if (!prediction || !settings.predictionAlert || !activeBaby) return;

    const interval = setInterval(() => {
      // Feed alert
      if (
        prediction.nextFeedMinutes <= 5 &&
        prediction.nextFeedMinutes >= -2
      ) {
        sendPushNotification(
          `🍼 ${activeBaby.name} 수유 시간이 다가와요`,
          `마지막 수유 후 약 ${Math.floor(
            (prediction.recommendedFeedIntervalMin || 180) / 60
          )}시간이 경과했습니다.`,
          `feed_alert_${activeBaby.id}`
        );
      }

      // Sleep alert
      if (
        !prediction.isCurrentlySleeping &&
        prediction.nextSleepMinutes <= 5 &&
        prediction.nextSleepMinutes >= -2
      ) {
        sendPushNotification(
          `😴 ${activeBaby.name} 졸릴 시간이에요`,
          `깨어있는 시간이 ${Math.floor(
            prediction.awakeMinutes / 60
          )}시간 ${prediction.awakeMinutes % 60}분 경과되었습니다.`,
          `sleep_alert_${activeBaby.id}`
        );
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [prediction, settings, activeBaby]);

  // Handle Onboarding Completion
  const handleOnboardingComplete = (
    newBabies: Baby[],
    newSettings: AppSettings
  ) => {
    saveBabies(newBabies);
    saveAppSettings(newSettings);
    setBabies(newBabies);
    setSettings(newSettings);
    setActiveBabyId(newBabies[0].id);
  };

  // Switch baby
  const handleSelectBaby = (id: string) => {
    setActiveBabyId(id);
    const updatedSettings = { ...settings, activeBabyId: id };
    setSettings(updatedSettings);
    saveAppSettings(updatedSettings);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-pulse text-sm font-bold text-slate-400">
          우리아이 먹잠타이머 불러오는 중...
        </div>
      </div>
    );
  }

  // Show Onboarding if no babies saved
  if (babies.length === 0) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 select-none">
      {/* Mobile Frame Container (Targeted for Toss 375px viewports & mobile devices) */}
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen flex flex-col relative border-x border-slate-200/60 shadow-xl">
        {/* Header Bar */}
        <Header
          babies={babies}
          activeBabyId={activeBabyId}
          onSelectBaby={handleSelectBaby}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 pb-24 overflow-y-auto">
          {mainTab === 'timer' && activeBaby && prediction && (
            <div className="space-y-3">
              {/* Golden Time Real-time Status Banner */}
              <GoldenTimeBanner
                prediction={prediction}
                babyName={activeBaby.name}
                birthDate={activeBaby.birthDate}
                gender={activeBaby.gender}
              />

              {/* Category Roller Buttons */}
              <CategoryRoller
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
              />

              {/* Dynamic Input Panel according to active category */}
              {activeCategory === 'feed' && (
                <FeedPanel
                  babyId={activeBaby.id}
                  birthDate={activeBaby.birthDate}
                  feedingLogs={activeBabyLogs.filter((l) =>
                    ['breast', 'formula', 'weaning'].includes(l.type)
                  )}
                  weaningStarted={activeBaby.weaningStarted}
                  onLogAdded={handleRefreshLogs}
                />
              )}

              {activeCategory === 'sleep' && (
                <SleepPanel
                  babyId={activeBaby.id}
                  birthDate={activeBaby.birthDate}
                  sleepLogs={activeBabyLogs.filter((l) => l.type === 'sleep')}
                  isCurrentlySleeping={prediction.isCurrentlySleeping}
                  activeSleepLog={prediction.activeSleepLog}
                  awakeMinutes={prediction.awakeMinutes}
                  onLogAdded={handleRefreshLogs}
                />
              )}

              {activeCategory === 'diaper' && (
                <DiaperPanel
                  babyId={activeBaby.id}
                  diaperLogs={activeBabyLogs.filter((l) => l.type === 'diaper')}
                  onLogAdded={handleRefreshLogs}
                />
              )}

              {activeCategory === 'cry' && (
                <CryPanel
                  babyId={activeBaby.id}
                  birthDate={activeBaby.birthDate}
                  babyLogs={activeBabyLogs}
                  onSelectCategory={(cat) => setActiveCategory(cat)}
                  onLogAdded={handleRefreshLogs}
                />
              )}
            </div>
          )}

          {mainTab === 'report' && activeBaby && (
            <ReportView
              baby={activeBaby}
              logs={logs}
              onLogUpdated={handleRefreshLogs}
            />
          )}
        </main>

        {/* Fixed Bottom Navigation Bar (2 Fixed Tabs: Timer / Report) */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-6 py-2 flex items-center justify-around z-40">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setMainTab('timer');
            }}
            className={`flex-1 py-1.5 flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              mainTab === 'timer'
                ? 'text-[#FF6B6B]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>타이머</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setMainTab('report');
            }}
            className={`flex-1 py-1.5 flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              mainTab === 'report'
                ? 'text-[#FF6B6B]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span>리포트</span>
          </button>
        </nav>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            babies={babies}
            settings={settings}
            activeBabyId={activeBabyId}
            onClose={() => setShowSettings(false)}
            onSaved={(updatedBabies, updatedSettings) => {
              setBabies(updatedBabies);
              setSettings(updatedSettings);
              handleRefreshLogs();
            }}
          />
        )}
      </div>
    </div>
  );
}
