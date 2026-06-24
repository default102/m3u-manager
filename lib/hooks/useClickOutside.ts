'use client';

import { useEffect, useRef } from 'react';

/**
 * 监听点击事件，当点击目标元素外部时触发回调
 * @param callback - 点击外部时执行的回调
 * @param className - 用于识别目标元素的 CSS class（可选）
 * @param enabled - 是否启用监听（用于条件性启用）
 */
export function useClickOutside(
  callback: () => void,
  className?: string,
  enabled: boolean = true,
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 优先用 className 匹配，其次用 ref
      if (className && target.closest(`.${className}`)) return;
      if (ref.current && ref.current.contains(target)) return;

      callback();
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [callback, className, enabled]);

  return ref;
}
