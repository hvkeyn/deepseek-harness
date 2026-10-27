import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12000)
const clicked = await page.evaluate(() => {
  const pattern = /Skills|\u0421\u043a\u0438\u043b\u043b\u044b/
  const element = Array.from(document.querySelectorAll('button, [role=button]')).find(c => pattern.test(c.getAttribute('aria-label') || c.textContent || ''))
  if (!element) return false
  element.click()
  return true
})
console.log('clicked:', clicked)
await page.waitForTimeout(4000)
const text = await page.evaluate(() => document.body.innerText.slice(0, 900))
console.log('page:', text.replace(/\n+/g, ' | ').slice(0, 700))
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/sidebar-skills.png' })
await browser.close()
