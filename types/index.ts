export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  allDay?: boolean;
  calendarName?: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: string; // ISO 8601
  sourceEmail: string;
  important: boolean;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
}
