import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/api/public/calendar/feed')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // In a real app, verify a secure token from the URL params
        const url = new URL(request.url)
        const token = url.searchParams.get('token')
        
        if (!token) {
          return new Response('Unauthorized', { status: 401 })
        }

        // Generate iCal (normally we'd fetch from DB here)
        // Since we are in a demo, we'll return a simple valid iCal string
        const ical = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Keyhold//Rental Management//EN",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          "X-WR-CALNAME:Keyhold Rental Events (Demo)",
          "BEGIN:VEVENT",
          "UID:demo-event-1@keyhold.app",
          "DTSTAMP:20260812T000000Z",
          "DTSTART;VALUE=DATE:20260815",
          "SUMMARY:[Keyhold] Rent due — Zhou family",
          "DESCRIPTION:CA$3,100.00 · 27 Birchmount Rd",
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\r\n");

        return new Response(ical, {
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="keyhold-events.ics"',
          }
        })
      }
    }
  }
})
