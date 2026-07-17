"use client";

import Panel from "./Panel";
import RelativeTime from "./RelativeTime";
import type { EmailMessage } from "@/types";
import styles from "./EmailPanel.module.css";

function buildMockEmails(): EmailMessage[] {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

  return [
    {
      id: "1",
      from: "Emma's School",
      subject: "Reminder: Non-uniform day Friday",
      snippet: "Don't forget it's non-uniform day this Friday in support of...",
      receivedAt: minutesAgo(25),
    },
    {
      id: "2",
      from: "Delivery Co.",
      subject: "Your package is out for delivery",
      snippet: "Your order #48213 is on its way and should arrive today between...",
      receivedAt: minutesAgo(110),
    },
    {
      id: "3",
      from: "Grandma",
      subject: "Sunday lunch?",
      snippet: "Just wondering if you're all free this Sunday for lunch, would be lovely to...",
      receivedAt: minutesAgo(400),
    },
  ];
}

const mockEmails = buildMockEmails();

export default function EmailPanel() {
  return (
    <Panel title="Email">
      {mockEmails.map((email) => (
        <div key={email.id} className={styles.email}>
          <div className={styles.emailHeader}>
            <span className={styles.from}>{email.from}</span>
            <span className={styles.time}>
              <RelativeTime iso={email.receivedAt} />
            </span>
          </div>
          <div className={styles.subject}>{email.subject}</div>
          <div className={styles.snippet}>{email.snippet}</div>
        </div>
      ))}
    </Panel>
  );
}
