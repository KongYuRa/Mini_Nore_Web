# Vercel 배포 에러 해결 가이드

## 에러: "No Output Directory named 'dist' found"

### 해결 방법 1: vercel.json 확인

프로젝트 루트에 `vercel.json` 파일이 있는지 확인하세요. 없다면 생성:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### 해결 방법 2: Vercel 대시보드에서 직접 설정

1. Vercel 프로젝트 페이지 이동
2. **Settings** 클릭
3. **General** → **Build & Development Settings**
4. 다음과 같이 설정:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Save** 클릭
6. **Deployments** 탭으로 이동
7. 최근 배포에서 **⋯** → **Redeploy** 클릭

### 해결 방법 3: 로컬에서 빌드 테스트

먼저 로컬에서 빌드가 잘 되는지 확인:

```bash
# 의존성 설치
npm install

# 빌드 실행
npm run build

# dist 폴더가 생성되었는지 확인
ls dist
```

빌드가 성공하면 `dist` 폴더가 생성됩니다!

### 해결 방법 4: package.json 확인

`package.json`에 빌드 스크립트가 있는지 확인:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 해결 방법 5: 파일 구조 확인

프로젝트 구조가 다음과 같은지 확인:

```
mini-nore/
├── package.json        ✅
├── vite.config.ts      ✅
├── vercel.json         ✅
├── index.html          ✅
├── App.tsx             ✅
├── src/
│   └── main.tsx        ✅
├── components/         ✅
├── data/              ✅
└── styles/            ✅
```

### 여전히 안 된다면?

1. **프로젝트 삭제하고 재생성**
   - Vercel에서 프로젝트 삭제
   - GitHub repository 다시 연결
   - 새로 배포

2. **Vercel CLI로 배포**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

3. **빌드 로그 확인**
   - Vercel 대시보드에서 실패한 배포 클릭
   - **Building** 섹션의 로그 확인
   - 에러 메시지 복사해서 검색

## 성공 확인

배포가 성공하면:
- ✅ "Building" 완료
- ✅ "dist" 폴더 생성
- ✅ 웹사이트 URL 제공 (`https://your-project.vercel.app`)

---

도움이 필요하면 Vercel 빌드 로그 전체를 복사해서 보내주세요!
