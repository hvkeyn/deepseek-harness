import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
const errors = []
page.on('console', m => { if (m.type() === 'error' || /failed|cancelled|error/i.test(m.text())) errors.push('[console] ' + m.text().slice(0, 300)) })
page.on('pageerror', e => errors.push('[pageerror] ' + String(e).slice(0, 300)))
page.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) errors.push('[http ' + r.status() + '] ' + r.url().slice(-60)) })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12000)
await page.evaluate(() => { const p = /Skills|\u0421\u043a\u0438\u043b\u043b\u044b/; const e = Array.from(document.querySelectorAll('button, [role=button]')).find(c => p.test(c.getAttribute('aria-label') || c.textContent || '')); if (e) e.click() })
await page.waitForTimeout(3000)
const before = await page.evaluate(() => document.body.innerText.match(/\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d/g)?.length ?? 0)
const clickedToggle = await page.evaluate(() => {
  const sw = document.querySelector('[role=switch]')
  if (sw) { sw.click(); return true }
  return false
})
await page.waitForTimeout(5000)
const after = await page.evaluate(() => document.body.innerText.match(/\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d/g)?.length ?? 0)
console.log('toggle clicked:', clickedToggle, 'installed-before:', before, 'installed-after:', after)
console.log('errors:', errors.length)
for (const e of errors.slice(0, 8)) console.log(e)
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/after-toggle.png' })
await browser.close()
