# Mini Nore ML 시스템 가이드

## 📋 개요

Mini Nore Web에 머신러닝 기반 음악 composition 추천 시스템이 통합되었습니다.

**주요 기능:**
- 🎵 사용자가 만든 composition 수집 및 저장
- 🤖 Transformer 기반 AI 모델로 새로운 composition 생성
- 💡 팩별 추천 예시 제공 (Adventure, Combat, Shelter)
- 📊 사용자 피드백 기반 품질 평가 (별점, 좋아요)

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Composer UI  │  │ AI 추천 UI   │  │ 저장 기능    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                          │                    │               │
└──────────────────────────┼────────────────────┼──────────────┘
                           │                    │
                           ▼                    ▼
                  ┌────────────────────────────────┐
                  │      FastAPI Backend           │
                  │                                 │
                  │  ┌──────────┐  ┌────────────┐ │
                  │  │ REST API │  │ ML Service │ │
                  │  └──────────┘  └────────────┘ │
                  └────────┬────────────┬──────────┘
                           │            │
              ┌────────────┘            └───────────┐
              ▼                                     ▼
     ┌────────────────┐                  ┌─────────────────┐
     │    MongoDB     │                  │  ML Models      │
     │                │                  │                 │
     │ - Compositions │                  │ - Adventure     │
     │ - User Ratings │                  │ - Combat        │
     │ - Statistics   │                  │ - Shelter       │
     └────────────────┘                  └─────────────────┘
```

---

## 🚀 빠른 시작

### 1. Docker Compose로 전체 시스템 실행

```bash
# 프로젝트 루트에서
docker-compose up -d
```

이 명령어로 다음 서비스가 실행됩니다:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **MongoDB**: localhost:27017
- **API Docs**: http://localhost:8000/docs

### 2. 개별 실행

#### Backend

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env

# MongoDB 실행 (Docker)
docker run -d -p 27017:27017 --name mini-nore-mongo mongo:7.0

# API 서버 실행
python -m uvicorn api.main:app --reload
```

#### Frontend

```bash
# 프로젝트 루트에서
npm install
npm run dev
```

---

## 🎯 사용 방법

### 1. 작품 만들기 및 저장

1. Mini Nore 앱에서 음악 composition 제작
2. 우측 상단의 **"작품 저장"** 버튼 클릭
3. 서버에 저장되고 ML 학습 데이터로 활용됨

### 2. AI 추천 작품 보기

1. 우측 상단의 **"AI 추천"** 버튼 클릭
2. 현재 선택된 팩의 AI 생성 예시 확인
3. 마음에 드는 작품의 **"불러오기"** 버튼으로 로드
4. 로드된 작품을 수정하거나 그대로 재생 가능

### 3. AI 작품 평가하기

- **좋아요**: 작품 카드의 하트 버튼
- **별점**: (향후 추가 예정)
- 평가는 모델 학습 개선에 활용됩니다

---

## 🤖 ML 모델 상세

### 모델 아키텍처

**타입**: Transformer Encoder-Decoder

**구조**:
```
Input → Source Embedding → Position Encoding → Features
                                                   ↓
                                         Transformer Encoder
                                                   ↓
                                         Latent Representation
                                                   ↓
                                         Transformer Decoder
                                                   ↓
        ┌──────────────┬──────────────┬──────────────────┐
        ↓              ↓              ↓                  ↓
   Source ID       Position        Volume            Output
   Prediction      Prediction      Prediction
```

**파라미터**:
- Embedding Dimension: 64
- Hidden Dimension: 256
- Attention Heads: 8
- Transformer Layers: 6
- 총 파라미터: ~1.2M per model

**입력 데이터**:
- 소스 ID (32개 소스)
- 위치 (x, y 좌표)
- 볼륨 (0~1)
- 16개 씬 시퀀스

**출력**:
- 새로운 composition (16 scenes)
- 각 씬의 소스 배치 정보

### 팩별 독립 모델

각 팩(Adventure, Combat, Shelter)마다 별도의 모델을 학습합니다:

- `adventure_model.pth`
- `combat_model.pth`
- `shelter_model.pth`

이유: 각 팩의 음악적 특성이 다르기 때문

### Fallback 메커니즘

학습된 모델이 없을 경우, **룰 기반 생성**이 작동합니다:
- 음악 이론 기반 소스 조합
- 무작위 위치 배치 (중앙 주변 분산)
- 적절한 볼륨 설정

---

## 📊 데이터 수집 전략

### Phase 1: Bootstrap (현재)
- 룰 기반 생성으로 초기 예시 제공
- 사용자 작품 수집 시작
- 최소 10개 이상 수집 필요

### Phase 2: Initial Training
- 10~30개 작품으로 첫 학습
- Data Augmentation 적용:
  - 좌우 반전
  - 볼륨 변화 (±10%)
  - 소스 순서 섞기

### Phase 3: Active Learning
- AI 생성 → 사용자 평가 → 재학습 반복
- 고평가 작품 위주로 학습
- 주기적 모델 업데이트

---

## 🛠️ 모델 학습

### 학습 시작

```bash
cd backend

# 특정 팩 학습
python -m training.train --pack adventure --epochs 100

# 모든 팩 학습
for pack in adventure combat shelter; do
    python -m training.train --pack $pack --epochs 100
done
```

### 학습 과정

1. **데이터 로드**: MongoDB에서 사용자 작품 가져오기
2. **전처리**: 텐서 변환, Data Augmentation
3. **학습**: Transformer 학습
4. **검증**: Validation set으로 평가
5. **저장**: Best model 체크포인트 저장

### 학습 메트릭

- **Source Accuracy**: 소스 ID 예측 정확도
- **Position MAE**: 위치 예측 평균 절대 오차
- **Volume MAE**: 볼륨 예측 평균 절대 오차
- **Validation Loss**: 검증 손실

---

## 📈 평가 지표

### 모델 성능 지표

```python
# 모델 상태 확인
GET /api/recommendations/model/status

# 응답 예시
{
  "device": "cuda",
  "models": {
    "adventure": {
      "loaded": true,
      "version": "v1.0",
      "parameters": 1234567
    }
  }
}
```

### 품질 지표

1. **Diversity Score**: 생성된 작품의 다양성
   - Jaccard Distance 기반
   - 0~1 (높을수록 다양함)

2. **Musicality Score**: 음악적 품질 (휴리스틱)
   - 소스 개수 적절성 (2~6개)
   - 위치 분산
   - 볼륨 밸런스

3. **User Ratings**: 사용자 평가
   - 별점 (0~5)
   - 좋아요 수
   - 재생 수

---

## 🔧 API 엔드포인트

### Compositions

```bash
# 작품 저장
POST /api/compositions/
{
  "pack": "adventure",
  "scenes": [...],
  "masterVolume": 1.0,
  "musicVolume": 1.0,
  "ambienceVolume": 0.7
}

# 작품 목록 조회
GET /api/compositions/?pack=adventure&limit=50

# 특정 작품 조회
GET /api/compositions/{id}

# 작품 평가 (좋아요)
PATCH /api/compositions/{id}
{
  "likes": 10,
  "rating": 4.5
}

# 통계
GET /api/compositions/stats/summary
```

### AI 추천

```bash
# AI 작품 생성
POST /api/recommendations/generate?pack=adventure&temperature=1.0

# 팩별 예시 조회
GET /api/recommendations/examples/adventure?count=3

# 모델 상태
GET /api/recommendations/model/status

# 모델 재학습 트리거
POST /api/recommendations/model/train?pack=adventure
```

---

## 💡 대학원 포트폴리오 포인트

### 1. 완전한 ML 시스템
- 데이터 수집 → 전처리 → 학습 → 추론 → 평가
- 실제 작동하는 end-to-end 시스템

### 2. 최신 아키텍처
- Transformer 기반 시퀀스 생성
- Attention 메커니즘 활용
- VAE-like latent space (확장 가능)

### 3. 실용적인 문제 해결
- 데이터 부족 → Fallback + Augmentation
- 품질 제어 → 사용자 피드백 루프
- 확장성 → 팩별 독립 모델

### 4. 평가 체계
- 정량적 지표 (Accuracy, MAE)
- 정성적 지표 (Diversity, Musicality)
- 사용자 평가 (Ratings, Likes)

### 5. 배포 가능
- Docker 기반 배포
- API 문서화 (Swagger)
- 프로덕션 준비 코드

---

## 📁 프로젝트 구조

```
Mini_Nore_Web/
├── frontend/              # React 앱
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIRecommendations.tsx    # AI 추천 UI
│   │   │   └── SaveCompositionButton.tsx # 저장 버튼
│   │   ├── services/
│   │   │   └── api.ts                    # API 클라이언트
│   │   └── App.tsx                        # 메인 앱
│   └── package.json
│
├── backend/               # Python/FastAPI
│   ├── api/              # API 서버
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── routes/
│   │   │   ├── compositions.py
│   │   │   └── recommendations.py
│   │   ├── schemas/
│   │   │   └── composition.py
│   │   └── services/
│   │       └── ml_service.py
│   │
│   ├── models/           # ML 모델
│   │   └── transformer/
│   │       └── composition_generator.py
│   │
│   ├── training/         # 학습 파이프라인
│   │   ├── train.py
│   │   ├── preprocessing/
│   │   │   └── data_processor.py
│   │   └── evaluation/
│   │       └── metrics.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── docker-compose.yml    # 전체 시스템 구성
└── ML_SYSTEM_GUIDE.md    # 이 문서
```

---

## 🐛 트러블슈팅

### "No module named 'api'"

```bash
cd backend
export PYTHONPATH=/app  # Docker 내부
# 또는
export PYTHONPATH=$(pwd)  # 로컬
```

### MongoDB 연결 실패

```bash
# MongoDB 상태 확인
docker ps | grep mongo

# 로그 확인
docker logs mini_nore_mongodb

# 재시작
docker-compose restart mongodb
```

### CORS 오류

`.env` 파일에서 CORS_ORIGINS 확인:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 모델이 생성되지 않음

1. 학습 데이터 확인:
   ```bash
   GET /api/compositions/stats/summary
   ```
2. 최소 10개 이상 필요
3. Fallback 모드로 작동 중 (룰 기반)

### GPU Out of Memory

```bash
# CPU로 학습
python -m training.train --pack adventure --epochs 100 --device cpu

# 배치 크기 줄이기
# training/train.py에서 BATCH_SIZE 수정 (32 → 16)
```

---

## 📚 참고 자료

### 논문
- "Attention Is All You Need" (Transformer)
- "Variational Autoencoders for Music Generation"
- "MuseGAN: Multi-track Sequential Generative Adversarial Networks"

### 기술 스택
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Python, FastAPI, PyTorch
- **Database**: MongoDB
- **Deployment**: Docker, docker-compose

---

## 🎓 향후 개선 방향

### 단기
1. ✅ 기본 시스템 구축 (완료)
2. 🔄 데이터 수집 (진행 중)
3. 📈 첫 모델 학습 (데이터 충분 시)

### 중기
1. VAE 추가로 latent space 탐색
2. GAN-based 모델 실험
3. 실시간 학습 파이프라인

### 장기
1. Personalized 추천 (사용자별)
2. Multi-modal 학습 (오디오 + 메타데이터)
3. Style Transfer (팩 간 스타일 변환)

---

## 📞 문의

대학원 포트폴리오 프로젝트입니다.

**개발자**: Yu Ra Kong, Da Hyun Kim

**Repository**: [GitHub Link]
**API Docs**: http://localhost:8000/docs (서버 실행 후)

---

**Happy Composing! 🎵**
