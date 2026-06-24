import { useCallback, useState } from 'react';
import type { Channel, AIRecommendationResult } from '@/types';

interface UseAIActionsParams {
  selectedIds: Set<number>;
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setSelectedIds: (ids: Set<number>) => void;
}

export function useAIActions({
  selectedIds,
  channels,
  setChannels,
  setSelectedIds,
}: UseAIActionsParams) {
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number } | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendationResult[] | null>(null);

  const handleRequestAIGroup = useCallback(async () => {
    const idsToProcess = Array.from(selectedIds);
    if (idsToProcess.length === 0) return;

    setIsAILoading(true);
    setAiProgress({ current: 0, total: idsToProcess.length });

    const chunkSize = 30;
    const allResults: AIRecommendationResult[] = [];

    try {
      for (let i = 0; i < idsToProcess.length; i += chunkSize) {
        const chunk = idsToProcess.slice(i, i + chunkSize);
        const res = await fetch('/api/ai/group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelIds: chunk }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `分析第 ${Math.floor(i / chunkSize) + 1} 批频道失败`);
        }

        const data = await res.json();
        if (data.success && data.results) {
          allResults.push(...data.results);
        }

        setAiProgress(prev => prev ? { ...prev, current: Math.min(prev.current + chunk.length, prev.total) } : null);
      }

      setAiRecommendations(allResults);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`AI 智能分组失败: ${msg}`);
    } finally {
      setIsAILoading(false);
      setAiProgress(null);
    }
  }, [selectedIds]);

  const handleApplyAIGroup = useCallback(async (updates: { id: number; groupTitle: string }[]) => {
    setIsAILoading(true);
    try {
      const res = await fetch('/api/channel/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateGroups',
          ids: updates.map(u => u.id),
          data: { updates },
        }),
      });
      if (!res.ok) throw new Error('更新分组失败');

      setChannels(prev => prev.map(c => {
        const matched = updates.find(u => u.id === c.id);
        if (matched) {
          return { ...c, groupTitle: matched.groupTitle === '未分类' ? null : matched.groupTitle };
        }
        return c;
      }));
      setSelectedIds(new Set());
      setAiRecommendations(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`应用分组失败: ${msg}`);
    } finally {
      setIsAILoading(false);
    }
  }, [setChannels, setSelectedIds]);

  return {
    isAILoading,
    aiProgress,
    aiRecommendations,
    setAiRecommendations,
    handleRequestAIGroup,
    handleApplyAIGroup,
  };
}
