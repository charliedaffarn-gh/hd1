import Clock from "./Clock";
import CalendarPanel from "./CalendarPanel";
import EmailPanel from "./EmailPanel";
import TasksPanel from "./TasksPanel";
import styles from "./DashboardGrid.module.css";

export default function DashboardGrid() {
  return (
    <div className={styles.grid}>
      <header className={styles.header}>
        <Clock />
      </header>
      <div className={styles.panels}>
        <CalendarPanel />
        <EmailPanel />
        <TasksPanel />
      </div>
    </div>
  );
}
