import type { CSSProperties, ReactNode } from "react";
import styles from "./Panel.module.css";

export default function Panel({
  title,
  footer,
  children,
  accent,
  tint,
}: {
  title: string;
  footer?: ReactNode;
  children: ReactNode;
  // A CSS color value (e.g. "var(--panel-calendar)") for this panel's
  // header bar — also exposed to its own content as --panel-accent, so
  // e.g. a checkbox or day label can pick up the same color.
  accent: string;
  // Optional soft tinted background for the panel body itself (e.g.
  // "var(--panel-calendar-tint)"). Falls back to the plain --surface
  // color when omitted.
  tint?: string;
}) {
  return (
    <section
      className={styles.panel}
      style={{ "--panel-accent": accent, "--panel-tint": tint } as CSSProperties}
    >
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}
