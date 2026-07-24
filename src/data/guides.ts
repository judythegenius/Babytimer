import { AgeGuideInfo } from '../types';

export function getAgeInDays(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  const birth = new Date(birthDateStr);
  const now = new Date();
  const diffTime = now.getTime() - birth.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

export function getAgeInWeeks(birthDateStr: string): number {
  return Math.floor(getAgeInDays(birthDateStr) / 7);
}

export function getAgeInMonths(birthDateStr: string): number {
  const days = getAgeInDays(birthDateStr);
  return Math.floor(days / 30.4375);
}

export function getAgeGuide(birthDateStr: string): AgeGuideInfo {
  const days = getAgeInDays(birthDateStr);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.4375);

  if (weeks <= 2) {
    return {
      weeks,
      months,
      title: '신생아 (0~2주)',
      feedIntervalHours: '2~3시간',
      dailyFeedCount: '8~12회',
      napCount: '4~5회 (수시)',
      totalSleepHours: '16~18시간',
      feedVolumeMl: '60~90mL / 수유',
      awakeWindowMinutes: '30~60분',
      tip: '위 용량이 매우 작아 자주 수유하고 수시로 잠듭니다. 밤낮 구분이 시작되는 시기입니다.',
    };
  } else if (weeks <= 4) {
    return {
      weeks,
      months,
      title: '생후 1개월 (3~4주)',
      feedIntervalHours: '2.5~3.5시간',
      dailyFeedCount: '7~8회',
      napCount: '4~5회',
      totalSleepHours: '15~17시간',
      feedVolumeMl: '80~120mL / 수유',
      awakeWindowMinutes: '45~75분',
      tip: '깨어있는 시간이 늘어납니다. 졸려하는 신호(눈 비비기, 멍하니 보기)를 잘 관찰해보세요.',
    };
  } else if (months <= 2) {
    return {
      weeks,
      months,
      title: '생후 2개월',
      feedIntervalHours: '3~4시간',
      dailyFeedCount: '6~7회',
      napCount: '3~4회',
      totalSleepHours: '14~16시간',
      feedVolumeMl: '120~160mL / 수유',
      awakeWindowMinutes: '60~90분',
      tip: '수면 의식을 조금씩 시작해보세요. 배앓이(영아 산통)가 가장 흔한 시기입니다.',
    };
  } else if (months <= 4) {
    return {
      weeks,
      months,
      title: '생후 3~4개월',
      feedIntervalHours: '3.5~4시간',
      dailyFeedCount: '5~6회',
      napCount: '3회',
      totalSleepHours: '14~15시간',
      feedVolumeMl: '150~200mL / 수유',
      awakeWindowMinutes: '90~120분',
      tip: '수면 퇴행이 올 수 있습니다. 밤잠과 낮잠의 구분을 명확히 해주고, 이유식 준비(150일 전후)를 고민해보세요.',
    };
  } else if (months <= 6) {
    return {
      weeks,
      months,
      title: '생후 5~6개월',
      feedIntervalHours: '4시간 (이유식 시작)',
      dailyFeedCount: '4~5회 (이유식 1회)',
      napCount: '2~3회',
      totalSleepHours: '13~14시간',
      feedVolumeMl: '180~220mL (1일 800~1000mL)',
      awakeWindowMinutes: '2~2.5시간',
      tip: '초기 이유식을 시작하는 시기입니다. 알레르기 반응을 확인하며 한 가지 재료씩 시도해보세요.',
    };
  } else if (months <= 9) {
    return {
      weeks,
      months,
      title: '생후 7~9개월',
      feedIntervalHours: '4~5시간 (이유식 2회)',
      dailyFeedCount: '3~4회 (이유식 2회)',
      napCount: '2회',
      totalSleepHours: '13~14시간',
      feedVolumeMl: '이유식 2회 + 수유 500~700mL',
      awakeWindowMinutes: '2.5~3.5시간',
      tip: '분리불안이 커질 수 있습니다. 일정 시각 밤잠에 들도록 규칙적인 하루 루틴을 만들어주세요.',
    };
  } else if (months <= 12) {
    return {
      weeks,
      months,
      title: '생후 10~12개월',
      feedIntervalHours: '이유식 3회 + 간식',
      dailyFeedCount: '이유식 3회 + 수유 2~3회',
      napCount: '1~2회',
      totalSleepHours: '12~14시간',
      feedVolumeMl: '이유식 3회 + 수유 400~500mL',
      awakeWindowMinutes: '3~4시간',
      tip: '아이의 자기주도적 먹기가 발달합니다. 핑거푸드를 제공해주면 소근육 발달에 도움이 됩니다.',
    };
  } else {
    return {
      weeks,
      months,
      title: '생후 13~18개월',
      feedIntervalHours: '유아식 3회 + 간식 2회',
      dailyFeedCount: '유아식 3회 + 생유 1~2회',
      napCount: '1회 (오후 낮잠)',
      totalSleepHours: '11~13시간',
      feedVolumeMl: '유아식 위주 + 생유유 300~400mL',
      awakeWindowMinutes: '4~5.5시간',
      tip: '낮잠이 1회로 통합되는 시기입니다. 걷기 등 신체활동량이 많아지며 밤 잠이 더욱 깊어집니다.',
    };
  }
}
