/**
 * AI 추천 컴포넌트
 * 팩별 AI 생성 예시를 보여주고 로드할 수 있게 함
 */
import { useState, useEffect } from 'react';
import { Sparkles, Loader2, ThumbsUp, Play, Download } from 'lucide-react';
import { apiService, CompositionResponse } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface AIRecommendationsProps {
  pack: 'adventure' | 'combat' | 'shelter';
  onLoadComposition: (composition: CompositionResponse) => void;
}

export const AIRecommendations = ({ pack, onLoadComposition }: AIRecommendationsProps) => {
  const [examples, setExamples] = useState<CompositionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadExamples();
  }, [pack]);

  const loadExamples = async () => {
    setLoading(true);
    try {
      const data = await apiService.getExamples(pack, 3);
      setExamples(data);
    } catch (error) {
      console.error('Failed to load examples:', error);
      toast.error('AI 예시를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const generateNew = async () => {
    setGenerating(true);
    try {
      const newComposition = await apiService.generateComposition(pack, 1.0);
      setExamples((prev) => [newComposition, ...prev.slice(0, 2)]);
      toast.success('새로운 AI 작품이 생성되었습니다!');
    } catch (error) {
      console.error('Failed to generate:', error);
      toast.error('생성에 실패했습니다');
    } finally {
      setGenerating(false);
    }
  };

  const handleLoad = (composition: CompositionResponse) => {
    onLoadComposition(composition);
    toast.success('AI 작품을 불러왔습니다!');
  };

  const handleLike = async (id: string) => {
    try {
      const composition = examples.find((c) => c.id === id);
      if (!composition) return;

      await apiService.updateComposition(id, {
        likes: composition.likes + 1,
      });

      setExamples((prev) =>
        prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
      );

      toast.success('좋아요!');
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">AI 추천 예시</h3>
        </div>

        <Button
          onClick={generateNew}
          disabled={generating}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              새로 생성
            </>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {examples.map((example) => (
            <Card key={example.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm">
                      {example.pack.charAt(0).toUpperCase() + example.pack.slice(1)} 팩
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {new Date(example.created_at).toLocaleDateString('ko-KR')}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* 통계 */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {example.plays}
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {example.likes}
                  </div>
                </div>

                {/* 씬 정보 */}
                <div className="text-xs text-gray-600">
                  {example.scenes.reduce(
                    (sum, scene) => sum + scene.placedSources.length,
                    0
                  )}{' '}
                  개 소스 사용
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleLoad(example)}
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <Download className="w-3 h-3" />
                    불러오기
                  </Button>
                  <Button
                    onClick={() => handleLike(example.id)}
                    size="sm"
                    variant="outline"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && examples.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>아직 AI 예시가 없습니다.</p>
          <p className="text-sm mt-2">'새로 생성' 버튼을 눌러 만들어보세요!</p>
        </div>
      )}
    </div>
  );
};
