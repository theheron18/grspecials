import { Resend } from 'resend'
import * as readline from 'readline'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((res) => rl.question(q, res))

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.error('❌ RESEND_API_KEY is not set. Run: RESEND_API_KEY=re_xxx node scripts/test-email.mjs')
  process.exit(1)
}

const to = await ask('Send test email to: ')
rl.close()

const resend = new Resend(apiKey)

const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM ?? 'hello@grspecials.com',
  to,
  subject: 'GRspecials.com — Email test',
  html: '<h1>✅ Resend is working!</h1><p>Your email setup for GRspecials.com is configured correctly.</p>',
  text: 'Resend is working! Your email setup for GRspecials.com is configured correctly.',
})

if (error) {
  console.error('❌ Failed:', error)
} else {
  console.log('✅ Email sent! ID:', data.id)
  console.log('   Check your inbox at', to)
}
