"use client";

import { useSyncExternalStore } from "react";
import { formatRelativeTime } from "@/lib/format";

function subscribe(callback: () => void) {
  const id = setInterval(callback, 30000);
  return () => clearInterval(id);
}

function getSnapshot(): number | null {
  return Date.now();
}

function getServerSnapshot(): number | null {
  return null;
}

export default function RelativeTime({ iso }: { iso: string }) {
  const nowMs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (nowMs === null) return null;
  return <>{formatRelativeTime(iso, nowMs)}</>;
}
