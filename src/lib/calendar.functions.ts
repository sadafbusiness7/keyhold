import { createServerFn } from "@tanstack/react-start";
import { calendarEvents, propertyById, unitById } from "./mock-data";

/**
 * Generates an iCalendar (RFC 5545) feed for a user's events.
 * In a real app, this would be a public server route with a secure token.
 * For this prototype, we'll expose a server function that returns the string.
 */
export const getCalendarIcal = createServerFn({ method: "GET" })
  .handler(async () => {
    const events = calendarEvents;
    
    let ical = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Keyhold//Rental Management//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Keyhold Rental Events",
      "X-WR-TIMEZONE:UTC",
    ];

    for (const e of events) {
      const unit = unitById(e.id.includes('-') ? e.id : 'u1'); // Mock safety
      const property = unit ? propertyById(unit.propertyId) : null;
      const location = property ? `${property.address}, ${property.city}, ${property.province}` : "";
      
      const dt = e.date.replace(/-/g, "");
      const uid = `event-${e.id}@keyhold.app`;
      
      ical.push("BEGIN:VEVENT");
      ical.push(`UID:${uid}`);
      ical.push(`DTSTAMP:${dt}T000000Z`);
      ical.push(`DTSTART;VALUE=DATE:${dt}`);
      ical.push(`SUMMARY:[Keyhold] ${e.title}`);
      ical.push(`DESCRIPTION:${e.detail}`);
      if (location) ical.push(`LOCATION:${location}`);
      ical.push("END:VEVENT");
    }

    ical.push("END:VCALENDAR");
    return ical.join("\r\n");
  });
