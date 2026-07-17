"use client";

import { useState, type FormEvent } from "react";
import Panel from "./Panel";
import type { Task } from "@/types";
import styles from "./TasksPanel.module.css";

const initialMockTasks: Task[] = [
  { id: "1", title: "Buy milk", done: false },
  { id: "2", title: "Pack lunches", done: false },
  { id: "3", title: "Book dentist appointment", done: true },
  { id: "4", title: "Sign school permission slip", done: false },
];

export default function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>(initialMockTasks);
  const [newTitle, setNewTitle] = useState("");

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }

  function addTask(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setTasks((prev) => [...prev, { id: crypto.randomUUID(), title, done: false }]);
    setNewTitle("");
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
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li key={task.id} className={styles.item}>
            <label className={styles.label}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className={styles.checkbox}
              />
              <span className={task.done ? styles.doneText : undefined}>{task.title}</span>
            </label>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
