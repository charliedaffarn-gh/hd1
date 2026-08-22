export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  allDay?: boolean;
  calendarName?: string;
  // Absent (or "family") for the connected Google Calendar(s); "hitchin"
  // for the monthly local "What's On" import.
  source?: "family" | "hitchin";
}

export interface RawEmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: string; // ISO 8601
  sourceEmail: string;
}

// A raw message that Claude's nightly triage flagged as needing attention.
export interface EmailMessage extends RawEmailMessage {
  reason: string;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
}

// One weekly-refreshed weekend day-trip suggestion.
export interface DayTripIdea {
  title: string;
  whyItFits: string;
  travelTime: string;
  booking: string;
  wetWeatherFallback: string;
}
