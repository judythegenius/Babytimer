export type BabyGender = 'male' | 'female';
export type ActivityType = 'breast' | 'formula' | 'weaning' | 'sleep' | 'diaper' | 'cry';
export type DiaperType = 'pee' | 'poop';
export type PoopConsistency = 'normal' | 'loose' | 'hard';
export type WeaningUnit = 'g' | 'spoon' | 'cup';
export type SleepType = 'nap' | 'night';
export type FeedingMode = 'breast' | 'formula' | 'mixed';

export interface Baby {
  id: string;
  name: string;
  birthDate: string; // ISO date string (YYYY-MM-DD)
  gender?: BabyGender;
  feedingMode: FeedingMode;
  weaningStarted: boolean;
  isTwin?: boolean;
  avatarUrl?: string;
}

export interface ActivityLog {
  id: string;
  babyId: string;
  type: ActivityType;
  startTime: string; // ISO datetime string
  endTime?: string;  // ISO datetime string
  // 모유 수유
  breastSide?: 'left' | 'right' | 'both';
  durationSeconds?: number;
  // 분유 / 이유식
  amountMl?: number;
  weaningFood?: string;
  weaningAmount?: number;
  weaningUnit?: WeaningUnit;
  // 수면
  sleepType?: SleepType;
  // 대소변
  diaperType?: DiaperType;
  poopConsistency?: PoopConsistency;
  // 울음
  cryDiagnosis?: CryDiagnosisResult;
  // 공통
  memo?: string;
  isBackfilled?: boolean;
}

export type CryReason = 'hunger' | 'tired' | 'diaper' | 'burp' | 'other';

export interface CryReasonRank {
  reason: CryReason;
  reasonLabel: string;
  elapsedMinutes: number;
  confidence: 'high' | 'medium' | 'low';
  description: string;
}

export interface CryDiagnosisResult {
  timestamp: string;
  rankedReasons: CryReasonRank[];
  checklistCompleted?: string[];
}

export interface AppSettings {
  pushEnabled: boolean;
  predictionAlert: boolean;
  cryAlert: boolean;
  quietHoursStart: number; // 23
  quietHoursEnd: number;   // 7
  activeBabyId: string;
}

export interface PredictionResult {
  nextFeedMinutes: number;      // minutes remaining until next feed
  nextFeedTime: Date;           // predicted Date
  lastFeedMinutesAgo: number;   // minutes since last feed
  nextSleepMinutes: number;     // minutes remaining until next sleep/nap
  nextSleepTime: Date;          // predicted Date
  awakeMinutes: number;         // minutes awake
  recommendedFeedIntervalMin: number;
  recommendedAwakeWindowMin: number;
  isCurrentlySleeping: boolean;
  activeSleepLog?: ActivityLog;
}

export interface AgeGuideInfo {
  weeks: number;
  months: number;
  title: string;
  feedIntervalHours: string;
  dailyFeedCount?: string;
  napCount: string;
  totalSleepHours: string;
  feedVolumeMl: string;
  awakeWindowMinutes: string;
  tip: string;
}
