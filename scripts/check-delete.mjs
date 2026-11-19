import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 760 } })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12000)
await page.evaluate(() => { const p = /Skills|\u0421\u043a\u0438\u043b\u043b\u044b/; const e = Array.from(document.querySelectorAll('button, [role=button]')).find(c => p.test(c.getAttribute('aria-label') || c.textContent || '')); if (e) e.click() })
await page.waitForTimeout(3500)
const deleted = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('li'))
  const row = rows.find(r => /^debug/.test(r.innerText.trim()))
  const btn = row && Array.from(row.querySelectorAll('button')).find(b => /\u0423\u0434\u0430\u043b\u0438\u0442\u044c/.test(b.textContent || ''))
  if (btn) { btn.click(); return true }
  return false
})
await page.waitForTimeout(5000)
console.log('delete clicked:', deleted)
const notice = await page.evaluate(() => document.body.innerText.match(/\u0443\u0434\u0430\u043b\u0451\u043d|\u0443\u0434\u0430\u043b\u0435\u043d/g) ?? [])
console.log('notice:', JSON.stringify(notice))
await browser.close()
