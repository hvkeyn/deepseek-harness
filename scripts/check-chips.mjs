import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12000)
// Ensure auto-attach is on.
await page.evaluate(() => { const p = /Skills|\u0421\u043a\u0438\u043b\u043b\u044b/; const e = Array.from(document.querySelectorAll('button, [role=button]')).find(c => p.test(c.getAttribute('aria-label') || c.textContent || '')); if (e) e.click() })
await page.waitForTimeout(2500)
const autoOn = await page.evaluate(() => { const sw = document.querySelector('[role=switch]'); if (!sw) return 'none'; if (sw.getAttribute('aria-checked') !== 'true') sw.click(); return 'on' })
console.log('auto:', autoOn)
// New session, then send a message.
await page.evaluate(() => { const p = /\u041d\u043e\u0432\u044b\u0439 \u0441\u0435\u0430\u043d\u0441/; const e = Array.from(document.querySelectorAll('button')).find(c => p.test(c.textContent || '')); if (e) e.click() })
await page.waitForTimeout(4000)
const box = await page.evaluate(() => { const el = document.querySelector('textarea, [contenteditable=true]'); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })
console.log('composer:', JSON.stringify(box))
if (box) { await page.mouse.click(box.x, box.y); await page.keyboard.type('test'); await page.keyboard.press('Enter') }
await page.waitForTimeout(12000)
const dock = await page.evaluate(() => { const m = document.body.innerText.match(/\u041f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u044b[^\n]*/); return m ? m[0] : 'none' })
console.log('dock:', dock)
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/chips.png' })
await browser.close()
