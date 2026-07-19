"use client";

import useSWR from "swr";
import Panel from "./Panel";
import RelativeTime from "./RelativeTime";
import type { EmailMessage } from "@/types";
import styles from "./EmailPanel.module.css";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

async function fetcher(url: string): Promise<{ messages: EmailMessage[] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load email");
  return res.json();
}

function sourceLabel(email: string): string {
  return email.split("@")[0];
}

export default function EmailPanel() {
  const { data, error, isLoading } = useSWR<{ messages: EmailMessage[] }>(
    "/api/gmail",
    fetcher,
    { refreshInterval: REFRESH_INTERVAL_MS },
  );

  if (isLoading) {
    return (
      <Panel title="Email">
        <p className={styles.message}>Loading…</p>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="Email">
        <p className={styles.message}>Couldn&rsquo;t load email.</p>
      </Panel>
    );
  }

  const messages = data?.messages ?? [];
  const sourceCount = new Set(messages.map((message) => message.sourceEmail)).size;

  if (messages.length === 0) {
    return (
      <Panel title="Email">
        <p className={styles.message}>No unread mail.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Email">
      {messages.map((email) => (
        <div
          key={email.id}
          className={email.important ? `${styles.email} ${styles.important}` : styles.email}
        >
          <div className={styles.emailHeader}>
            <span className={styles.from}>{email.from}</span>
            <span className={styles.time}>
              <RelativeTime iso={email.receivedAt} />
            </span>
          </div>
          <div className={styles.subject}>
            <span className={styles.subjectText}>{email.subject}</span>
            {sourceCount > 1 && (
              <span className={styles.sourceTag}>{sourceLabel(email.sourceEmail)}</span>
            )}
          </div>
          <div className={styles.snippet}>{email.snippet}</div>
        </div>
      ))}
    </Panel>
  );
}
