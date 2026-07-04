import { ReactNode, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const PULL_THRESHOLD = 64;
const MAX_PULL = 100;
const RESISTANCE = 1.8;

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a scrollable region with a native-feeling "pull down to refresh"
 * gesture (TikTok/Facebook-style). Only activates when the region is
 * scrolled to the top; relies on CSS overscroll-behavior (not
 * preventDefault, which React's passive touch listeners can't reliably
 * block) to stop the browser's own pull-to-refresh/bounce from double-firing.
 */
export const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) {
      startYRef.current = null;
      return;
    }
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || refreshing) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      // Re-baseline so a subsequent pull-down (without lifting the finger)
      // is measured from here, not the original touch point.
      startYRef.current = currentY;
      return;
    }
    setPullDistance(Math.min(MAX_PULL, delta / RESISTANCE));
  };

  const resetPull = () => {
    startYRef.current = null;
    setPullDistance(0);
  };

  const handleTouchEnd = async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const indicatorProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className={cn("overscroll-y-contain", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetPull}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150 ease-out"
        style={{ height: pullDistance }}
        aria-hidden={pullDistance === 0}
      >
        <RefreshCw
          className={cn("h-5 w-5 text-primary", refreshing && "animate-spin")}
          style={refreshing ? undefined : { transform: `rotate(${indicatorProgress * 180}deg)`, opacity: indicatorProgress }}
        />
      </div>
      {children}
    </div>
  );
};
