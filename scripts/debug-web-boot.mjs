// Open the local dsh web host in Chromium, collect console errors, and report
// the module that fails during client boot.
import { chromium } from 'playwright'

const url = process.argv[2]
if (!url) throw new Error('usage: node scripts/debug-web-boot.mjs <url>')

const browser = await chromium.launch()
const page = await browser.newPage()
const lines = []
page.on('console', (message) => {
  const text = message.text()
  if (message.type() === 'error' || /failed|did not activate|pending/i.test(text)) {
    lines.push(`[${message.type()}] ${text.slice(0, 600)}`)
  }
})
page.on('pageerror', (error) => {
  lines.push(`[pageerror] ${String(error).slice(0, 600)}`)
})
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(25_000)
console.log(`--- captured ${lines.length} line(s) ---`)
for (const line of lines.slice(0, 40)) console.log(line)
await browser.close()
