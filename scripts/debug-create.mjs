import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find(n => (n.getAttribute('aria-label') || '') === 'Ещё' && n.getAttribute('aria-haspopup') === 'menu')
  if (b) b.click()
})
await page.waitForTimeout(700)
await page.evaluate(() => {
  const item = Array.from(document.querySelectorAll('[role=menuitem]')).find(n => /\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0441\u0432\u043e\u0439 \u043f\u043b\u0430\u0433\u0438\u043d/.test(n.textContent || ''))
  if (item) item.click()
})
await page.waitForTimeout(8000)
const state = await page.evaluate(() => {
  const editors = Array.from(document.querySelectorAll('textarea, [contenteditable=true]'))
  const value = editors.map(node => ('value' in node ? node.value : node.textContent) || '').join(' ').trim()
  const presets = Array.from(document.querySelectorAll('button')).map(n => (n.textContent || '').trim()).filter(t => t.length > 0 && t.length < 30)
  return {
    url: location.href,
    editorText: value.slice(0, 160),
    editorCount: editors.length,
    presetCandidates: presets.filter(t => /Cordis|Standard|\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442|\u041a\u043e\u0440\u0434\u0438\u0441/i.test(t)),
    header: document.body.innerText.split('\n').slice(0, 6).join(' | '),
  }
})
console.log(JSON.stringify(state, null, 1))
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/create-debug.png' })
await browser.close()