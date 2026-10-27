import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12000)
await page.evaluate(() => {
  const pattern = /Skills|\u0421\u043a\u0438\u043b\u043b\u044b/
  const el = Array.from(document.querySelectorAll('button, [role=button]')).find(c => pattern.test(c.getAttribute('aria-label') || c.textContent || ''))
  if (el) el.click()
})
await page.waitForTimeout(3000)
const load = await page.evaluate(() => {
  const pattern = /\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433|Load catalog/
  const el = Array.from(document.querySelectorAll('button')).find(c => pattern.test(c.textContent || ''))
  if (el) { el.click(); return true }
  return false
})
console.log('load clicked:', load)
await page.waitForTimeout(7000)
const text = await page.evaluate(() => {
  const body = document.body.innerText
  const index = body.indexOf('Skills')
  return body.slice(Math.max(0, index), index + 1200)
})
console.log(text.replace(/\n+/g, ' | ').slice(0, 900))
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/catalog.png' })
await browser.close()
