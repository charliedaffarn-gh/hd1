"use client";

import { useState, type FormEvent } from "react";
import styles from "./PasscodeForm.module.css";

export default function PasscodeForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (res.ok) {
      window.location.href = "/";
      return;
    }

    setError("Incorrect passcode");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Family Dashboard</h1>
      <input
        type="password"
        autoFocus
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="Passcode"
        className={styles.input}
      />
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" disabled={submitting} className={styles.button}>
        {submitting ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
