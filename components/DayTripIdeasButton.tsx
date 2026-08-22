"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import RelativeTime from "./RelativeTime";
import type { DayTripIdea } from "@/types";
import styles from "./DayTripIdeasButton.module.css";

interface IdeasResponse {
  computedAt: string | null;
  items: DayTripIdea[];
}

async function fetcher(url: string): Promise<IdeasResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load weekend ideas");
  return res.json();
}

export default function DayTripIdeasButton() {
  const [open, setOpen] = useState(false);
  // Only fetched once the popup is actually opened — this doesn't need to
  // poll in the background like the always-visible panels do.
  const { data, error, isLoading } = useSWR<IdeasResponse>(
    open ? "/api/day-trip-ideas" : null,
    fetcher,
  );

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
        </span>
        <span className={styles.label}>Weekend Ideas</span>
      </button>

      {open && (
        <div className={styles.backdrop} onClick={() => setOpen(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Weekend day trip ideas"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Weekend Ideas</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {isLoading ? (
              <p className={styles.message}>Loading…</p>
            ) : error ? (
              <p className={styles.message}>Couldn&rsquo;t load ideas.</p>
            ) : !data || data.items.length === 0 ? (
              <p className={styles.message}>
                No ideas yet — check back after the next weekly refresh.
              </p>
            ) : (
              <>
                <div className={styles.ideas}>
                  {data.items.map((idea) => (
                    <div key={idea.title} className={styles.idea}>
                      <h3 className={styles.ideaTitle}>{idea.title}</h3>
                      <p>
                        <strong>Why it fits:</strong> {idea.whyItFits}
                      </p>
                      <p>
                        <strong>Travel time:</strong> {idea.travelTime}
                      </p>
                      <p>
                        <strong>Booking:</strong> {idea.booking}
                      </p>
                      <p>
                        <strong>Wet-weather fallback:</strong> {idea.wetWeatherFallback}
                      </p>
                    </div>
                  ))}
                </div>
                {data.computedAt && (
                  <p className={styles.updatedAt}>
                    Suggested <RelativeTime iso={data.computedAt} />
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
