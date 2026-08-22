import Clock from "./Clock";
import AppShortcuts from "./AppShortcuts";
import DayTripIdeasButton from "./DayTripIdeasButton";
import CalendarPanel from "./CalendarPanel";
import EmailPanel from "./EmailPanel";
import TasksPanel from "./TasksPanel";
import styles from "./DashboardGrid.module.css";

export default function DashboardGrid() {
  return (
    <div className={styles.grid}>
      <header className={styles.header}>
        <Clock />
        <div className={styles.headerControls}>
          <DayTripIdeasButton />
          <AppShortcuts />
        </div>
      </header>
      <div className={styles.panels}>
        <CalendarPanel />
        <TasksPanel />
        <EmailPanel />
      </div>
    </div>
  );
}
