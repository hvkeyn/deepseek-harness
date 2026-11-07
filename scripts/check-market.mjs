// Verify the plugin market: Plugins page shows Discover and lists the default index.
import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)

await page.evaluate(() => {
  const link = Array.from(document.querySelectorAll('button, a, [role=button]'))
    .find(node => /^(Plugins|\u041f\u043b\u0430\u0433\u0438\u043d\u044b)$/.test((node.textContent || '').trim()))
  if (link) link.click()
})
await page.waitForTimeout(6000)

const tabs = await page.evaluate(() => Array.from(document.querySelectorAll('[role=tab], button'))
  .map(node => (node.textContent || '').trim())
  .filter(text => /^(Installed|Discover|\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043d\u044b\u0435|\u041e\u0431\u0437\u043e\u0440)$/.test(text)))
console.log('tabs:', JSON.stringify(tabs))

await page.evaluate(() => {
  const tab = Array.from(document.querySelectorAll('[role=tab], button'))
    .find(node => /^(Discover|\u041e\u0431\u0437\u043e\u0440)$/.test((node.textContent || '').trim()))
  if (tab) tab.click()
})
await page.waitForTimeout(8000)

const state = await page.evaluate(() => {
  const text = document.body.innerText
  return {
    hasIndex: /HVKeyn Edition plugins|\u041f\u043b\u0430\u0433\u0438\u043d\u044b HVKeyn/.test(text),
    entries: Array.from(document.querySelectorAll('li, article')).map(n => (n.textContent || '').trim())
      .filter(t => /dsh-experimental|auto-review|voice-input/.test(t)).length,
    body: text.slice(0, 300).replace(/\n+/g, ' | '),
  }
})
console.log('has default index:', state.hasIndex, '| entry cards:', state.entries)
console.log('page text:', state.body)
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/market-0.4.0.png' })
await browser.close()
