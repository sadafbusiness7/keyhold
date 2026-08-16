import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

/**
 * Handle inbound email webhooks (e.g. from SendGrid, Postmark, Mailgun)
 */
export const Route = createFileRoute('/api/public/email/inbound')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Verify signature (skipped for prototype)
        
        // 2. Parse body
        try {
          const body = await request.json() as {
            from: string;
            subject: string;
            text: string;
          }

          // 3. Logic to route to Messages module would happen here in a real backend.
          // For the prototype, we handle this in the mock store via a manual trigger in the UI or a helper.
          
          console.log("Inbound email received:", body.from, body.subject);
          
          return new Response(JSON.stringify({ status: 'received' }), {
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (e) {
          return new Response('Invalid payload', { status: 400 })
        }
      }
    }
  }
})
