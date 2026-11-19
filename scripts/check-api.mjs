import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage()
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(8000)
const text = await page.evaluate(async () => {
  const response = await fetch('/api/skills/listAdmin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
  return response.status + ' ' + (await response.text()).slice(0, 500)
})
console.log(text)
await browser.close()
