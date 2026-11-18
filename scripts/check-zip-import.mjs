import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button, [role=button]')).find(n => /Skills|\u0421\u043a\u0438\u043b\u043b\u044b/.test(n.getAttribute('aria-label') || n.textContent || ''))
  if (b) b.click()
})
await page.waitForTimeout(4000)
const typed = await page.evaluate((path) => {
  const input = document.querySelector('input[placeholder*="zip"]')
  if (!input) return 'no zip input'
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(input, path)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  return 'typed'
}, process.argv[3])
console.log('input:', typed)
await page.waitForTimeout(500)
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find(n => /^\u0418\u043c\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c$/.test((n.textContent || '').trim()))
  if (b) b.click()
})
await page.waitForTimeout(6000)
const state = await page.evaluate(() => {
  const text = document.body.innerText
  const match = text.match(/Импортировано скиллов: (\d+)/)
  return { notice: match ? match[0] : null, chips: (text.match(/blender/g) || []).length }
})
console.log(JSON.stringify(state))
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/zip-import-0.5.1.png' })
await browser.close()