import {
  Baby,
  ActivityLog,
  AppSettings,
  PredictionResult,
  CryDiagnosisResult,
  CryReasonRank,
  AgeGuideInfo,
} from './types';
import { getAgeInDays, getAgeInMonths, getAgeGuide } from './data/guides';

export function getAgeGuideInfo(birthDateStr: string): AgeGuideInfo {
  return getAgeGuide(birthDateStr);
}

export function getCharacterImage(birthDateStr: string, gender?: 'male' | 'female'): string {
  const birth = new Date(birthDateStr).getTime();
  const days = Math.max(0, Math.floor((Date.now() - birth) / (1000 * 60 * 60 * 24)));
  const ageMonths = days / 30;
  const genderStr = gender === 'female' ? '여자' : '남자';

  if (ageMonths < 3) return `/characters/신생아-${genderStr}.png`;
  if (ageMonths < 9) return `/characters/6개월-${genderStr}.png`;
  if (ageMonths < 15) return `/characters/1년-${genderStr}.png`;
  return `/characters/1년6개월-${genderStr}.png`;
}

const STORAGE_KEYS = {
  BABIES: 'baby_timer_babies_v2',
  LOGS: 'baby_timer_logs_v2',
  SETTINGS: 'baby_timer_settings_v2',
};

// --- HAPTIC FEEDBACK ---
export function triggerHaptic() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(15);
    } catch {
      // Ignore vibration errors
    }
  }
}

// --- LOCAL STORAGE HELPERS ---
export function getStoredBabies(): Baby[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BABIES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse babies from localStorage', e);
    return [];
  }
}

export function saveBabies(babies: Baby[]): void {
  localStorage.setItem(STORAGE_KEYS.BABIES, JSON.stringify(babies));
}

export function getStoredLogs(): ActivityLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse logs from localStorage', e);
    return [];
  }
}

export function saveLogs(logs: ActivityLog[]): void {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

export function getAppSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse settings from localStorage', e);
  }
  return {
    pushEnabled: false,
    predictionAlert: true,
    cryAlert: true,
    quietHoursStart: 23,
    quietHoursEnd: 7,
    activeBabyId: '',
  };
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function addLog(newLog: Omit<ActivityLog, 'id'>): ActivityLog {
  const logs = getStoredLogs();
  const created: ActivityLog = {
    ...newLog,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  const updated = [created, ...logs];
  saveLogs(updated);
  return created;
}

export function updateLog(logId: string, updates: Partial<ActivityLog>): void {
  const logs = getStoredLogs();
  const updated = logs.map((l) => (l.id === logId ? { ...l, ...updates } : l));
  saveLogs(updated);
}

export function deleteLog(logId: string): void {
  const logs = getStoredLogs();
  const updated = logs.filter((l) => l.id !== logId);
  saveLogs(updated);
}

// --- NOTIFICATION HELPERS ---
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendPushNotification(title: string, body: string, tag: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // Check quiet hours
  const nowHour = new Date().getHours();
  const settings = getAppSettings();
  const isQuietHour =
    nowHour >= settings.quietHoursStart || nowHour < settings.quietHoursEnd;

  // Diaper alert is silenced during quiet hours
  if (tag.includes('diaper') && isQuietHour) {
    return;
  }

  try {
    new Notification(title, {
      body,
      tag,
      icon: '/favicon.ico',
    });
  } catch (e) {
    console.error('Push notification error', e);
  }
}

// --- TIME FORMATTING HELPERS ---
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}초`;
  if (secs === 0) return `${mins}분`;
  return `${mins}분 ${secs}초`;
}

export function formatTimeAgo(isoString: string): string {
  if (!isoString) return '기록 없음';
  const time = new Date(isoString).getTime();
  const diffMins = Math.floor((Date.now() - time) / (1000 * 60));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours}시간 ${mins}분 전` : `${hours}시간 전`;
  }

  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function formatTimeOnly(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const hours = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${period} ${displayHours}:${mins}`;
}

export function formatDateWithDay(isoDateStr: string): string {
  const date = new Date(isoDateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dayName = days[date.getDay()];
  return `${m}월 ${d}일 (${dayName})`;
}

// --- AGE BASE PARAMETERS ---
export function getRecommendedParameters(birthDateStr: string) {
  const days = getAgeInDays(birthDateStr);
  const months = getAgeInMonths(birthDateStr);

  let feedIntervalMin = 180; // 3 hours default
  let awakeWindowMin = 90;   // 1.5 hours default

  if (days <= 14) {
    feedIntervalMin = 150; // 2.5h
    awakeWindowMin = 45;   // 45m
  } else if (days <= 30) {
    feedIntervalMin = 180; // 3h
    awakeWindowMin = 60;   // 1h
  } else if (months <= 2) {
    feedIntervalMin = 210; // 3.5h
    awakeWindowMin = 75;   // 1h 15m
  } else if (months <= 4) {
    feedIntervalMin = 225; // 3h 45m
    awakeWindowMin = 105;  // 1h 45m
  } else if (months <= 6) {
    feedIntervalMin = 240; // 4h
    awakeWindowMin = 135;  // 2h 15m
  } else {
    feedIntervalMin = 240; // 4h
    awakeWindowMin = 180;  // 3h
  }

  return { feedIntervalMin, awakeWindowMin };
}

// --- PREDICTION ALGORITHM ---
export function calculatePrediction(
  birthDateStr: string,
  babyLogs: ActivityLog[]
): PredictionResult {
  const { feedIntervalMin, awakeWindowMin } = getRecommendedParameters(birthDateStr);

  // 1. Last feeding
  const feedLogs = babyLogs.filter((l) =>
    ['breast', 'formula', 'weaning'].includes(l.type)
  );
  feedLogs.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  const lastFeed = feedLogs[0];

  let lastFeedMinutesAgo = 999;
  let nextFeedTime = new Date();
  let nextFeedMinutes = 0;

  if (lastFeed) {
    const lastFeedTime = new Date(lastFeed.startTime).getTime();
    lastFeedMinutesAgo = Math.floor((Date.now() - lastFeedTime) / (1000 * 60));
    nextFeedTime = new Date(lastFeedTime + feedIntervalMin * 60 * 1000);
    nextFeedMinutes = Math.floor(
      (nextFeedTime.getTime() - Date.now()) / (1000 * 60)
    );
  }

  // 2. Sleep & Awake Status
  const sleepLogs = babyLogs.filter((l) => l.type === 'sleep');
  sleepLogs.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  const activeSleep = sleepLogs.find((l) => !l.endTime);

  const isCurrentlySleeping = !!activeSleep;

  let awakeMinutes = 0;
  let nextSleepTime = new Date();
  let nextSleepMinutes = 0;

  if (isCurrentlySleeping && activeSleep) {
    awakeMinutes = 0;
    nextSleepMinutes = 0;
  } else {
    // Find when baby last woke up
    const finishedSleepLogs = sleepLogs.filter((l) => l.endTime);
    if (finishedSleepLogs.length > 0) {
      const lastWakeTime = new Date(finishedSleepLogs[0].endTime!).getTime();
      awakeMinutes = Math.max(
        0,
        Math.floor((Date.now() - lastWakeTime) / (1000 * 60))
      );
      nextSleepTime = new Date(lastWakeTime + awakeWindowMin * 60 * 1000);
      nextSleepMinutes = Math.floor(
        (nextSleepTime.getTime() - Date.now()) / (1000 * 60)
      );
    } else {
      // Default fallback
      awakeMinutes = 60;
      nextSleepMinutes = Math.max(0, awakeWindowMin - awakeMinutes);
      nextSleepTime = new Date(Date.now() + nextSleepMinutes * 60 * 1000);
    }
  }

  return {
    nextFeedMinutes,
    nextFeedTime,
    lastFeedMinutesAgo,
    nextSleepMinutes,
    nextSleepTime,
    awakeMinutes,
    recommendedFeedIntervalMin: feedIntervalMin,
    recommendedAwakeWindowMin: awakeWindowMin,
    isCurrentlySleeping,
    activeSleepLog: activeSleep,
  };
}

// --- CRY DIAGNOSIS ALGORITHM ---

function isSleepRegressionAge(ageWeeks: number): boolean {
  return (ageWeeks >= 14 && ageWeeks <= 20) || (ageWeeks >= 32 && ageWeeks <= 40);
}

export function diagnoseCryReasons(
  birthDateStr: string,
  babyLogs: ActivityLog[],
  checklistCompleted: string[] = []
): CryDiagnosisResult {
  const { feedIntervalMin, awakeWindowMin } = getRecommendedParameters(birthDateStr);
  const now = Date.now();

  const birthMs = new Date(birthDateStr).getTime();
  const ageWeeks = Math.floor((now - birthMs) / (1000 * 60 * 60 * 24 * 7));

  // 1. Last Feed
  const feedLogs = babyLogs.filter((l) =>
    ['breast', 'formula', 'weaning'].includes(l.type)
  );
  feedLogs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const lastFeed = feedLogs[0];
  const minsSinceFeed = lastFeed
    ? Math.floor((now - new Date(lastFeed.startTime).getTime()) / (1000 * 60))
    : 999;

  // 2. Last Wake
  const finishedSleepLogs = babyLogs
    .filter((l) => l.type === 'sleep' && l.endTime)
    .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime());
  const lastWake = finishedSleepLogs[0];
  const awakeMins = lastWake
    ? Math.floor((now - new Date(lastWake.endTime!).getTime()) / (1000 * 60))
    : 999;

  // 3. Last Diaper
  const diaperLogs = babyLogs.filter((l) => l.type === 'diaper');
  diaperLogs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const lastDiaper = diaperLogs[0];
  const minsSinceDiaper = lastDiaper
    ? Math.floor((now - new Date(lastDiaper.startTime).getTime()) / (1000 * 60))
    : 999;

  const rawRanks: CryReasonRank[] = [];

  // 1. 배고픔
  const hungerRatio = minsSinceFeed / feedIntervalMin;
  rawRanks.push({
    reason: 'hunger',
    reasonLabel: '🍼 배고픔일 가능성',
    elapsedMinutes: minsSinceFeed,
    confidence: hungerRatio >= 1.0 ? 'high' : hungerRatio >= 0.8 ? 'medium' : 'low',
    description: minsSinceFeed === 999
      ? '수유 기록이 없어 배고플 수 있습니다.'
      : `마지막 수유 후 ${formatMinutesToHoursMins(minsSinceFeed)} 경과`,
  });

  // 2. 열/아픔 — 체온 미확인이면 medium으로 항상 노출
  rawRanks.push({
    reason: 'fever' as any,
    reasonLabel: '🤒 열이나 통증',
    elapsedMinutes: 0,
    confidence: checklistCompleted.includes('checked_temp') ? 'low' : 'medium',
    description: checklistCompleted.includes('checked_temp')
      ? '체온 정상 확인됐네요. 다른 원인을 살펴보세요.'
      : '체온을 측정해보세요. 38도 이상이면 소아과 방문을 권장해요.',
  });

  // 3. 배앓이/가스 — 수유 후 20~60분이 핵심 시간대
  const gasConf = (minsSinceFeed >= 20 && minsSinceFeed <= 60) ? 'high'
    : (minsSinceFeed > 0 && minsSinceFeed < 20) ? 'medium' : 'low';
  rawRanks.push({
    reason: 'gas' as any,
    reasonLabel: '💨 배앓이 / 가스',
    elapsedMinutes: minsSinceFeed,
    confidence: checklistCompleted.includes('gas_massage') ? 'low' : gasConf,
    description: checklistCompleted.includes('gas_massage')
      ? '배 마사지 완료됐네요.'
      : (minsSinceFeed >= 20 && minsSinceFeed <= 60)
        ? `수유 후 ${minsSinceFeed}분 경과. 배앓이가 가장 심한 시간대예요.`
        : '배에 가스가 차 있을 수 있어요. 배 마사지를 시도해보세요.',
  });

  // 4. 졸림
  const tiredRatio = awakeMins / awakeWindowMin;
  rawRanks.push({
    reason: 'tired',
    reasonLabel: '😴 졸릴 수 있음',
    elapsedMinutes: awakeMins,
    confidence: tiredRatio >= 1.0 ? 'high' : tiredRatio >= 0.8 ? 'medium' : 'low',
    description: awakeMins === 999
      ? '깨어있는 시간이 늘어 졸릴 수 있습니다.'
      : `기상 후 ${formatMinutesToHoursMins(awakeMins)} 경과 (권장: ${formatMinutesToHoursMins(awakeWindowMin)})`,
  });

  // 5. 트림
  const isRecentFeed = minsSinceFeed <= 20;
  rawRanks.push({
    reason: 'burp',
    reasonLabel: '🫧 트림이 필요함',
    elapsedMinutes: minsSinceFeed,
    confidence: checklistCompleted.includes('burp') ? 'low'
      : isRecentFeed ? 'high' : 'low',
    description: checklistCompleted.includes('burp')
      ? '트림 완료됐네요. 다른 원인을 확인해보세요.'
      : isRecentFeed
        ? `수유 완료 ${minsSinceFeed}분 이내입니다. 속이 불편할 수 있습니다.`
        : '수유 직후가 아니지만 배에 가스가 차있을 수 있습니다.',
  });

  // 6. 기저귀
  rawRanks.push({
    reason: 'diaper',
    reasonLabel: '💧 기저귀 확인 필요',
    elapsedMinutes: minsSinceDiaper,
    confidence: checklistCompleted.includes('diaper') ? 'low'
      : minsSinceDiaper >= 180 ? 'high'
      : minsSinceDiaper >= 120 ? 'medium' : 'low',
    description: checklistCompleted.includes('diaper')
      ? '기저귀 이상 없음 확인됐네요.'
      : minsSinceDiaper === 999
        ? '기저귀 교체 기록이 없습니다.'
        : `마지막 기저귀 교체 후 ${formatMinutesToHoursMins(minsSinceDiaper)} 경과`,
  });

  // 7. 수면 퇴행 (해당 월령만 추가)
  if (isSleepRegressionAge(ageWeeks)) {
    rawRanks.push({
      reason: 'sleep_regression' as any,
      reasonLabel: '🌙 수면 퇴행 시기',
      elapsedMinutes: 0,
      confidence: 'medium',
      description: `생후 ${ageWeeks}주는 수면 퇴행 시기예요. 평소보다 자주 깨는 게 정상이에요.`,
    });
  }

  // 8. 온도/불편함
  rawRanks.push({
    reason: 'other',
    reasonLabel: '🌡️ 온도/불편함/자극',
    elapsedMinutes: 0,
    confidence: (checklistCompleted.includes('temp') && checklistCompleted.includes('hug'))
      ? 'low' : 'medium',
    description: checklistCompleted.includes('temp')
      ? '온습도는 쾌적한 상태네요. 옷이 불편하지 않은지 확인해보세요.'
      : '더위/추위, 꽉 끼는 옷, 자세 변경 또는 안아주기가 필요할 수 있습니다.',
  });

  // confidence 기준 정렬: high → medium → low
  const scoreMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
  rawRanks.sort((a, b) => scoreMap[b.confidence] - scoreMap[a.confidence]);

  return {
    timestamp: new Date().toISOString(),
    rankedReasons: rawRanks,
    checklistCompleted,
  };
}

function formatMinutesToHoursMins(mins: number): string {
  if (mins === 999) return '기록 없음';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}