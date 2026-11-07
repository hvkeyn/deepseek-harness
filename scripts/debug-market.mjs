import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
page.on('console', m => { if (m.type() === 'error') console.log('err:', m.text().slice(0, 160)) })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)
await page.evaluate(() => {
  const l = Array.from(document.querySelectorAll('button, a, [role=button]')).find(n => /^(\u041f\u043b\u0430\u0433\u0438\u043d\u044b|Plugins)$/.test((n.textContent || '').trim()))
  if (l) l.click()
})
await page.waitForTimeout(5000)
await page.evaluate(() => {
  const t = Array.from(document.querySelectorAll('[role=tab], button')).find(n => /^(\u041e\u0431\u0437\u043e\u0440|Discover)$/.test((n.textContent || '').trim()))
  if (t) t.click()
})
await page.waitForTimeout(9000)
const text = await page.evaluate(() => document.body.innerText.split('\n').filter(Boolean).slice(-40).join(' | '))
console.log('tail text:', text)
await browser.close()