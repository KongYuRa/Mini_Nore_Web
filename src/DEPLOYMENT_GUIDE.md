# 🚀 Mini Nore 배포 가이드 (한글)

이 가이드는 Mini Nore를 독립적인 웹사이트로 만들고, 수정하고, 배포하는 방법을 단계별로 설명합니다.

## 📋 준비물

1. **컴퓨터** (Windows, Mac, Linux 모두 가능)
2. **Node.js 설치** - https://nodejs.org/ 에서 다운로드
3. **코드 에디터** - VS Code 추천 (https://code.visualstudio.com/)

## 🎯 Step 1: 프로젝트 설정

### 1-1. 새 폴더 만들기
```bash
# 터미널이나 명령 프롬프트를 열고:
mkdir mini-nore
cd mini-nore
```

### 1-2. 모든 파일 복사
Figma Make에서 만든 모든 파일을 이 폴더에 복사하세요:
- App.tsx
- components/ 폴더와 모든 내용
- data/ 폴더와 모든 내용
- styles/ 폴더와 모든 내용
- package.json
- vite.config.ts
- index.html
- src/main.tsx

### 1-3. 의존성 설치
```bash
npm install
```

## 🎨 Step 2: 로컬에서 실행 & 수정

### 실행하기
```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속!

### 수정하기

**소스 아이콘 변경하고 싶다면?**
- `/data/sources.ts` 파일 열기
- 이모지나 색상(color) 수정

**색상 테마 변경하고 싶다면?**
- `/App.tsx`, `/components/` 파일들에서 Tailwind 클래스 수정
- 예: `bg-yellow-50` → `bg-blue-50`

**새로운 기능 추가하고 싶다면?**
- `/App.tsx`에 로직 추가
- `/components/` 폴더에 새 컴포넌트 만들기

수정 후 저장하면 **자동으로 브라우저가 새로고침**됩니다!

## 🌐 Step 3: 웹에 배포하기

### 방법 1: Vercel (가장 쉬움! 추천 ⭐)

1. **Vercel 계정 만들기**
   - https://vercel.com 접속
   - GitHub로 가입

2. **GitHub에 코드 올리기**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # GitHub에 새 repository 만들고 연결
   git remote add origin [your-github-repo-url]
   git push -u origin main
   ```

3. **Vercel에서 배포**
   - Vercel 대시보드에서 "New Project"
   - GitHub repository 선택
   - "Deploy" 클릭
   - 완료! 🎉

**결과**: `https://mini-nore.vercel.app` 같은 무료 도메인을 받게 됩니다!

### 방법 2: Netlify

1. **프로젝트 빌드**
   ```bash
   npm run build
   ```

2. **Netlify에 배포**
   - https://netlify.com 접속 & 가입
   - "Add new site" → "Deploy manually"
   - `dist` 폴더를 드래그 앤 드롭
   - 완료! 🎉

### 방법 3: 직접 서버에 올리기

1. **빌드하기**
   ```bash
   npm run build
   ```

2. **dist 폴더 업로드**
   - `dist` 폴더 안의 모든 파일을
   - 웹 호스팅 서버에 FTP로 업로드
   - (카페24, 닷홈, AWS S3 등 어디든 가능)

## 🔄 수정 후 재배포하는 법

### Vercel 사용 중이라면:
```bash
git add .
git commit -m "Update features"
git push
```
→ 자동으로 배포됩니다!

### Netlify 수동 배포라면:
```bash
npm run build
```
→ `dist` 폴더를 다시 업로드

## 💡 자주 하는 수정들

### 1. 팩 설명 바꾸기
`/components/PackSelector.tsx` 파일에서:
```typescript
description: '여기에 새로운 설명!'
```

### 2. 소스 개수 늘리기
`/data/sources.ts`에서 배열에 항목 추가:
```typescript
{ id: 'new-1', name: 'New', type: 'music', icon: '🎺', color: '#fbbf24' },
```

### 3. 배경색 바꾸기
`/App.tsx`에서:
```typescript
className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"
```

## 🎵 실제 오디오 추가하기 (심화)

나중에 실제 음악 재생 기능을 원하신다면:

1. `/public/audio/` 폴더에 MP3/WAV 파일 추가
2. Web Audio API 사용
3. 위치에 따른 패닝 구현

이 부분은 필요하시면 따로 가이드 드릴게요!

## 🆘 문제 해결

**"npm을 찾을 수 없습니다" 에러**
→ Node.js를 설치하세요

**포트 5173이 이미 사용중**
→ 다른 프로그램 종료하거나 `npm run dev -- --port 3000`

**빌드 에러**
→ `node_modules` 폴더 삭제 후 `npm install` 다시 실행

## 📞 도움이 더 필요하시면

문제가 생기면 에러 메시지를 복사해서 물어보세요!

---

**즐거운 음악 제작 되세요! 🎵✨**
