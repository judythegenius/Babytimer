import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'babytimer', // ⚠️ 영문+하이픈만, 딥링크로 쓰임: intoss://babytimer
  brand: {
    displayName: '우리아이 먹잠타이머', // 토스앱에서 보이는 이름
    primaryColor: '#FF6B6B', // 앱 메인 컬러 (코랄)
    icon: 'https://static.toss.im/appsintoss/47343/cb9c2d2b-30ab-4f39-a8c4-a3dab7a38d78.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite dev',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});