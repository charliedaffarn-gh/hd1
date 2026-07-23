"use client";

import styles from "./AppShortcuts.module.css";

interface AppShortcut {
  id: string;
  label: string;
  // Android intent URL — launches the app by package name via Fully Kiosk
  // Browser's "Open Other URL Schemes" setting. Syntax unverified until
  // tested against the real tablet.
  href: string;
}

const SHORTCUTS: AppShortcut[] = [
  {
    id: "iplayer",
    label: "iPlayer",
    href: "intent://#Intent;package=bbc.iplayer.android;end",
  },
];

export default function AppShortcuts() {
  return (
    <nav className={styles.shortcuts} aria-label="App shortcuts">
      {SHORTCUTS.map((shortcut) => (
        <a key={shortcut.id} href={shortcut.href} className={styles.shortcut}>
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
