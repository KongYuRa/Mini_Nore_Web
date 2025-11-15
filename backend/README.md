# Mini Nore ML Backend

머신러닝 기반 음악 composition 추천 시스템

## 🎯 주요 기능

- **데이터 수집**: 사용자가 만든 composition 저장 및 관리
- **ML 모델**: Transformer 기반 composition 생성 모델
- **추천 시스템**: 팩별 AI 생성 예시 제공
- **평가 시스템**: 별점, 좋아요, 재생 수 기반 품질 평가

## 🏗️ 아키텍처

```
backend/
├── api/                    # FastAPI 애플리케이션
│   ├── main.py            # 메인 앱
│   ├── database.py        # MongoDB 연결
│   ├── routes/            # API 라우트
│   │   ├── compositions.py
│   │   └── recommendations.py
│   ├── schemas/           # Pydantic 스키마
│   │   └── composition.py
│   └── services/          # 비즈니스 로직
│       └── ml_service.py
├── models/                # ML 모델
│   └── transformer/
│       └── composition_generator.py
├── training/              # 학습 파이프라인
│   ├── train.py
│   ├── preprocessing/
│   │   └── data_processor.py
│   └── evaluation/
│       └── metrics.py
└── requirements.txt
```

## 🚀 빠른 시작

### 1. Docker Compose로 실행 (권장)

```bash
# 프로젝트 루트에서
docker-compose up -d
```

서비스:
- Backend API: http://localhost:8000
- MongoDB: localhost:27017
- Frontend: http://localhost:5173

### 2. 로컬 개발 환경

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일 수정

# MongoDB 시작 (별도)
# docker run -d -p 27017:27017 mongo:7.0

# API 서버 실행
python -m uvicorn api.main:app --reload
```

## 📚 API 문서

서버 실행 후:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 주요 엔드포인트

#### Compositions

- `POST /api/compositions/` - 새로운 composition 저장
- `GET /api/compositions/` - Composition 목록 조회
- `GET /api/compositions/{id}` - 특정 composition 조회
- `PATCH /api/compositions/{id}` - Composition 업데이트 (평가)
- `GET /api/compositions/stats/summary` - 통계

#### Recommendations (AI)

- `POST /api/recommendations/generate` - AI composition 생성
- `GET /api/recommendations/examples/{pack}` - 팩별 예시 조회
- `GET /api/recommendations/model/status` - 모델 상태 확인
- `POST /api/recommendations/model/train` - 모델 재학습 트리거

## 🤖 ML 모델

### 모델 아키텍처

- **타입**: Transformer Encoder-Decoder
- **입력**: Composition 데이터 (소스 ID, 위치, 볼륨)
- **출력**: 새로운 composition 생성
- **팩별 모델**: Adventure, Combat, Shelter 각각 독립적인 모델

### 모델 학습

```bash
# 특정 팩 학습
python -m training.train --pack adventure --epochs 100

# 모든 팩 학습
for pack in adventure combat shelter; do
    python -m training.train --pack $pack --epochs 100
done
```

### 모델 파라미터

- Embedding Dimension: 64
- Hidden Dimension: 256
- Attention Heads: 8
- Transformer Layers: 6
- 총 파라미터: ~1M per model

## 📊 데이터 수집 전략

### Phase 1: Bootstrap (초기 데이터)
- 수작업 고품질 예시 20-30개
- 음악 이론 기반 패턴 생성

### Phase 2: Crowdsourcing
- 사용자 제출 composition 수집
- 별점/좋아요 피드백 수집

### Phase 3: Active Learning
- 모델 생성 → 사용자 평가 → 재학습

## 🔧 환경 변수

```bash
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=mini_nore_ml

# API
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173

# ML
MODEL_PATH=./models/checkpoints
LATENT_DIM=128
EMBEDDING_DIM=64

# Training
BATCH_SIZE=32
LEARNING_RATE=0.001
NUM_EPOCHS=100
```

## 📈 평가 메트릭

### 모델 성능 메트릭
- Source Accuracy: 소스 ID 예측 정확도
- Position MAE: 위치 예측 평균 절대 오차
- Volume MAE: 볼륨 예측 평균 절대 오차

### 품질 메트릭
- Diversity Score: 생성된 composition 다양성
- Musicality Score: 음악적 품질 (휴리스틱)
- User Ratings: 사용자 평가 (별점, 좋아요)

## 🧪 테스트

```bash
# 유닛 테스트
pytest tests/

# 커버리지
pytest --cov=api --cov=models --cov=training tests/
```

## 📝 개발 가이드

### 새로운 팩 추가

1. `backend/models/transformer/composition_generator.py`의 `_create_source_mapping()` 수정
2. 소스 목록 추가
3. 데이터 수집 시작
4. 모델 학습

### 모델 개선

1. `backend/models/transformer/composition_generator.py`에서 아키텍처 수정
2. `backend/training/train.py`에서 학습 로직 조정
3. `backend/training/evaluation/metrics.py`에서 평가 메트릭 추가

## 🐛 트러블슈팅

### MongoDB 연결 실패
```bash
# MongoDB 상태 확인
docker ps | grep mongo

# 로그 확인
docker logs mini_nore_mongodb
```

### CUDA Out of Memory
```bash
# CPU로 학습
python -m training.train --pack adventure --epochs 100 --device cpu

# 배치 사이즈 줄이기
python -m training.train --pack adventure --epochs 100 --batch-size 16
```

### 모델이 생성되지 않음
- 룰 기반 fallback이 작동합니다
- 학습 데이터가 충분한지 확인 (최소 10개 필요)
- 모델 파일 경로 확인: `./models/checkpoints/{pack}_model_best.pth`

## 📦 배포

### Production 배포

```bash
# Docker 이미지 빌드
docker build -t mini-nore-backend:latest ./backend

# 실행
docker run -d \
  -p 8000:8000 \
  -e MONGODB_URL=mongodb://your-mongo-host:27017 \
  mini-nore-backend:latest
```

### Vercel/Railway 배포
- `backend/` 디렉토리를 별도 레포지토리로 분리
- MongoDB Atlas 사용 권장
- 환경 변수 설정 필수

## 📄 라이선스

MIT License

## 👥 기여

대학원 포트폴리오 프로젝트입니다.
