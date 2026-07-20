"use client";

import useSWR from "swr";
import Panel from "./Panel";
import RelativeTime from "./RelativeTime";
import type { EmailMessage } from "@/types";
import styles from "./EmailPanel.module.css";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface DigestResponse {
  messages: EmailMessage[];
  computedAt: string | null;
}

async function fetcher(url: string): Promise<DigestResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load email");
  return res.json();
}

function sourceLabel(email: string): string {
  return email.split("@")[0];
}

export default function EmailPanel() {
  const { data, error, isLoading } = useSWR<DigestResponse>("/api/gmail", fetcher, {
    refreshInterval: REFRESH_INTERVAL_MS,
  });

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
  const computedAt = data?.computedAt ?? null;
  const sourceCount = new Set(messages.map((message) => message.sourceEmail)).size;

  return (
    <Panel title="Email">
      {messages.length === 0 ? (
        <p className={styles.message}>
          {computedAt
            ? "Nothing needs attention right now."
            : "No digest yet — the overnight triage hasn’t run. Mail labeled NeedsAttention still shows up here."}
        </p>
      ) : (
        messages.map((email) => (
          <div key={email.id} className={styles.email}>
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
            <div className={styles.reason}>{email.reason}</div>
          </div>
        ))
      )}
      {computedAt && (
        <p className={styles.updatedAt}>
          Triage updated <RelativeTime iso={computedAt} />
        </p>
      )}
    </Panel>
  );
}
