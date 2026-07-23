"use client";

import type { MouseEvent } from "react";
import styles from "./AppShortcuts.module.css";

declare global {
  interface Window {
    // Injected by Fully Kiosk Browser when Settings → Advanced Web Settings
    // → "Enable JavaScript interface" (Plus feature) is turned on.
    fully?: {
      startApplication: (packageName: string) => void;
    };
  }
}

interface AppShortcut {
  id: string;
  label: string;
  packageName: string;
  // Fallback for browsers without the Fully Kiosk JS interface (e.g. plain
  // Chrome on a phone) — an Android intent link. May land on the Play
  // Store listing rather than opening the app directly, since it doesn't
  // match a scheme the target app itself registers.
  fallbackHref: string;
}

const SHORTCUTS: AppShortcut[] = [
  {
    id: "iplayer",
    label: "iPlayer",
    packageName: "bbc.iplayer.android",
    fallbackHref: "intent://#Intent;package=bbc.iplayer.android;end",
  },
];

function launch(shortcut: AppShortcut, event: MouseEvent<HTMLAnchorElement>) {
  if (typeof window !== "undefined" && window.fully?.startApplication) {
    event.preventDefault();
    window.fully.startApplication(shortcut.packageName);
  }
  // Otherwise let the normal link navigation to fallbackHref proceed.
}

export default function AppShortcuts() {
  return (
    <nav className={styles.shortcuts} aria-label="App shortcuts">
      {SHORTCUTS.map((shortcut) => (
        <a
          key={shortcut.id}
          href={shortcut.fallbackHref}
          className={styles.shortcut}
          onClick={(event) => launch(shortcut, event)}
        >
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className={styles.label}>{shortcut.label}</span>
        </a>
      ))}
    </nav>
  );
}
