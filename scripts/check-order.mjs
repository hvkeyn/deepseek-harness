import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12000)
await page.evaluate(() => { const p = /Skills|\u0421\u043a\u0438\u043b\u043b\u044b/; const e = Array.from(document.querySelectorAll('button, [role=button]')).find(c => p.test(c.getAttribute('aria-label') || c.textContent || '')); if (e) e.click() })
await page.waitForTimeout(4000)
const order = await page.evaluate(() => {
  const text = document.body.innerText
  const connected = text.indexOf('\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d\u043d\u044b\u0435 \u0441\u043a\u0438\u043b\u043b\u044b')
  const catalog = text.indexOf('\u041a\u0430\u0442\u0430\u043b\u043e\u0433 \u0441\u043a\u0438\u043b\u043b\u043e\u0432')
  return { connected, catalog }
})
console.log('order:', JSON.stringify(order))
const header = await page.evaluate(() => (document.body.innerText.match(/\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d\u043d\u044b\u0435 \u0441\u043a\u0438\u043b\u043b\u044b[^\n]*/) ?? [''])[0])
console.log('header:', header)
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/order.png' })
await browser.close()
