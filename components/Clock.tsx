"use client";

import { useSyncExternalStore } from "react";
import styles from "./Clock.module.css";

function subscribe(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}

function getSnapshot(): number | null {
  return Date.now();
}

function getServerSnapshot(): number | null {
  return null;
}

export default function Clock() {
  const nowMs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const now = nowMs ? new Date(nowMs) : null;

  return (
    <div className={styles.clock}>
      <div className={styles.time}>
        {now
          ? now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
          : "––:––"}
      </div>
      <div className={styles.date}>
        {now
          ? now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
          : ""}
      </div>
    </div>
  );
}
