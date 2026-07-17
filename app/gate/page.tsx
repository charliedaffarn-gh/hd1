import PasscodeForm from "@/components/PasscodeForm";
import styles from "./page.module.css";

export default function GatePage() {
  return (
    <main className={styles.main}>
      <PasscodeForm />
    </main>
  );
}
