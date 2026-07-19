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
        <a className={styles.button} href="/api/oauth/google/start?role=primary">
          {primary ? "Reconnect" : "Connect Google Account"}
        </a>
      </section>
    </main>
  );
}
