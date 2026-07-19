import { listGoogleAccounts } from "@/lib/accounts";
import styles from "./page.module.css";

// Always reflects live connection state — never statically prerendered.
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: "That connection attempt expired or was invalid. Please try again.",
  exchange_failed: "Google didn't accept that connection. Please try again.",
  access_denied: "Consent was declined, so nothing was connected.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const accounts = await listGoogleAccounts();
  const primary = accounts.find((account) => account.isPrimary);
  const secondary = accounts.filter((account) => !account.isPrimary);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Settings</h1>

      {connected && <p className={styles.success}>Connected successfully.</p>}
      {error && (
        <p className={styles.error}>{ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}</p>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Google Account</h2>
        <p className={styles.status}>
          {primary ? (
            <>
              Connected as <strong>{primary.email}</strong>
            </>
          ) : (
            "Not connected yet."
          )}
        </p>
        <p className={styles.hint}>Powers Calendar, Tasks, and one of the Email sources.</p>
        <a className={styles.button} href="/api/oauth/google/start?role=primary">
          {primary ? "Reconnect" : "Connect Google Account"}
        </a>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Additional Gmail Inboxes</h2>
        {secondary.length === 0 ? (
          <p className={styles.status}>None connected yet.</p>
        ) : (
          <ul className={styles.accountList}>
            {secondary.map((account) => (
              <li key={account.id}>{account.email}</li>
            ))}
          </ul>
        )}
        <p className={styles.hint}>
          Collated into the Email panel alongside the main account, read-only.
        </p>
        <a className={styles.button} href="/api/oauth/google/start?role=gmail">
          Connect another Gmail inbox
        </a>
      </section>
    </main>
  );
}
