/**
 * API 서비스
 * 백엔드 API와 통신
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PlacedSourceData {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  volume: number;
  muted?: boolean;
}

export interface SceneSlot {
  id: number;
  placedSources: PlacedSourceData[];
}

export interface CompositionData {
  pack: 'adventure' | 'combat' | 'shelter';
  scenes: SceneSlot[];
  masterVolume: number;
  musicVolume: number;
  ambienceVolume: number;
}

export interface CompositionResponse extends CompositionData {
  id: string;
  created_at: string;
  rating?: number;
  likes: number;
  plays: number;
  is_ai_generated: boolean;
}

export interface StatsResponse {
  total_compositions: number;
  ai_generated: number;
  user_created: number;
  by_pack: {
    adventure: number;
    combat: number;
    shelter: number;
  };
}

export interface ModelStatus {
  device: string;
  models: {
    [pack: string]: {
      loaded: boolean;
      version: string | null;
      parameters: number;
    };
  };
}

class APIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: 'Unknown error',
      }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ========== Compositions API ==========

  /**
   * 새로운 composition 저장
   */
  async saveComposition(data: CompositionData): Promise<CompositionResponse> {
    return this.request<CompositionResponse>('/api/compositions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Composition 목록 조회
   */
  async getCompositions(params?: {
    pack?: string;
    is_ai_generated?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<CompositionResponse[]> {
    const queryParams = new URLSearchParams();

    if (params?.pack) queryParams.append('pack', params.pack);
    if (params?.is_ai_generated !== undefined)
      queryParams.append('is_ai_generated', String(params.is_ai_generated));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.skip) queryParams.append('skip', String(params.skip));

    const query = queryParams.toString();
    const endpoint = query ? `/api/compositions/?${query}` : '/api/compositions/';

    return this.request<CompositionResponse[]>(endpoint);
  }

  /**
   * 특정 composition 조회
   */
  async getComposition(id: string): Promise<CompositionResponse> {
    return this.request<CompositionResponse>(`/api/compositions/${id}`);
  }

  /**
   * Composition 업데이트 (평가)
   */
  async updateComposition(
    id: string,
    data: { rating?: number; likes?: number }
  ): Promise<CompositionResponse> {
    return this.request<CompositionResponse>(`/api/compositions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * 통계 조회
   */
  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/api/compositions/stats/summary');
  }

  // ========== Recommendations API ==========

  /**
   * AI composition 생성
   */
  async generateComposition(
    pack: 'adventure' | 'combat' | 'shelter',
    temperature: number = 1.0
  ): Promise<CompositionResponse> {
    return this.request<CompositionResponse>(
      `/api/recommendations/generate?pack=${pack}&temperature=${temperature}`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * 팩별 예시 조회
   */
  async getExamples(
    pack: 'adventure' | 'combat' | 'shelter',
    count: number = 3
  ): Promise<CompositionResponse[]> {
    return this.request<CompositionResponse[]>(
      `/api/recommendations/examples/${pack}?count=${count}`
    );
  }

  /**
   * 모델 상태 확인
   */
  async getModelStatus(): Promise<ModelStatus> {
    return this.request<ModelStatus>('/api/recommendations/model/status');
  }

  /**
   * 모델 재학습 트리거
   */
  async triggerTraining(pack?: 'adventure' | 'combat' | 'shelter'): Promise<{
    message: string;
    task_id: string;
    pack: string;
  }> {
    const endpoint = pack
      ? `/api/recommendations/model/train?pack=${pack}`
      : '/api/recommendations/model/train';

    return this.request(endpoint, {
      method: 'POST',
    });
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const apiService = new APIService();
