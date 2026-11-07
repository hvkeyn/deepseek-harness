// Verify multi-agent display: ask for one subagent call, then read the UI.
import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)

// Start a fresh session.
await page.evaluate(() => {
  const button = Array.from(document.querySelectorAll('button')).find(node => /Новый сеанс/.test(node.textContent || ''))
  if (button) button.click()
})
await page.waitForTimeout(3000)

const composer = await page.$('textarea, [contenteditable=true]')
if (composer === null) { console.log('no composer'); await browser.close(); process.exit(0) }
await composer.click()
await page.keyboard.type('Call the subagent tool exactly once with task "Say hello in one word", then tell me its answer.', { delay: 8 })
await page.waitForTimeout(500)
await page.keyboard.press('Enter')
console.log('prompt sent')

for (let round = 0; round < 12; round += 1) {
  await page.waitForTimeout(5000)
  const state = await page.evaluate(() => ({
    subagentRow: /subagent/i.test(document.body.innerText),
    catalog: Array.from(document.querySelectorAll('button')).some(node => /субагент|subagent|агент/i.test(node.getAttribute('aria-label') || '')),
    text: document.body.innerText.split('\n').filter(line => /subagent|агент/i.test(line)).slice(0, 4),
  }))
  console.log(`round ${round}:`, JSON.stringify(state))
  if (state.subagentRow) break
}
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/subagent-run.png' })
await browser.close()
