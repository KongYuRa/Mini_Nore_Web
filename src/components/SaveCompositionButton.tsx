/**
 * Composition 저장 버튼
 * 사용자가 만든 작품을 서버에 저장
 */
import { useState } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { apiService, CompositionData } from '../services/api';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface SaveCompositionButtonProps {
  composition: CompositionData;
  disabled?: boolean;
}

export const SaveCompositionButton = ({
  composition,
  disabled,
}: SaveCompositionButtonProps) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiService.saveComposition(composition);
      setSaved(true);
      toast.success('작품이 저장되었습니다!', {
        description: `ID: ${response.id}`,
      });

      // 2초 후 체크마크 해제
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('저장에 실패했습니다', {
        description: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      onClick={handleSave}
      disabled={disabled || saving || saved}
      size="sm"
      className="gap-2"
    >
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          저장 중...
        </>
      ) : saved ? (
        <>
          <Check className="w-4 h-4" />
          저장됨!
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          작품 저장
        </>
      )}
    </Button>
  );
};
