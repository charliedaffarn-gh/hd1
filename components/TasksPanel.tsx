"use client";

import { useState, type FormEvent } from "react";
import useSWR, { mutate } from "swr";
import Panel from "./Panel";
import { formatTaskDue, getTaskDueStatus } from "@/lib/format";
import type { Task } from "@/types";
import styles from "./TasksPanel.module.css";

const REFRESH_INTERVAL_MS = 60 * 1000;
const TASKS_KEY = "/api/tasks";

async function fetcher(url: string): Promise<{ tasks: Task[] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load tasks");
  return res.json();
}

export default function TasksPanel() {
  const { data, error, isLoading } = useSWR<{ tasks: Task[] }>(TASKS_KEY, fetcher, {
    refreshInterval: REFRESH_INTERVAL_MS,
  });
  const [newTitle, setNewTitle] = useState("");

  const tasks = data?.tasks ?? [];

  function completeTask(task: Task) {
    const remaining = tasks.filter((t) => t.id !== task.id);

    mutate(
      TASKS_KEY,
      async () => {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: true }),
        });
        if (!res.ok) throw new Error("Failed to update task");
        return { tasks: remaining };
      },
      { optimisticData: { tasks: remaining }, rollbackOnError: true, revalidate: false },
    );
  }

  function addTask(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");

    mutate(TASKS_KEY, async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const { task } = (await res.json()) as { task: Task };
      return { tasks: [...tasks, task] };
    });
  }

  return (
    <Panel
      title="Family To-Do"
      footer={
        <form onSubmit={addTask} className={styles.form}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task…"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Add
          </button>
        </form>
      }
    >
      {isLoading ? (
        <p className={styles.message}>Loading…</p>
      ) : error ? (
        <p className={styles.message}>Couldn&rsquo;t load tasks.</p>
      ) : tasks.length === 0 ? (
        <p className={styles.message}>No tasks yet.</p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => {
            const dueStatus = task.due ? getTaskDueStatus(task.due) : null;
            const statusClass =
              dueStatus === "overdue"
                ? styles.overdue
                : dueStatus === "today"
                  ? styles.today
                  : styles.upcoming;
            return (
              <li key={task.id} className={styles.item}>
                <label className={styles.label}>
                  <input
                    type="checkbox"
                    onChange={() => completeTask(task)}
                    className={styles.checkbox}
                  />
                  <span className={styles.taskText}>
                    <span className={dueStatus === "overdue" || dueStatus === "today" ? statusClass : undefined}>
                      {task.title}
                    </span>
                    {task.due && (
                      <span className={`${styles.dueBadge} ${statusClass}`}>
                        {formatTaskDue(task.due)}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
