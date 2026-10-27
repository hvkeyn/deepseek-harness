// Verify the skills tab: stat badges, local import, and the imported row.
import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const folder = process.argv[3]
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)

await page.evaluate(() => {
  const pattern = /Skills|\u0421\u043a\u0438\u043b\u043b\u044b/
  const button = Array.from(document.querySelectorAll('button, [role=button]'))
    .find(node => pattern.test(node.getAttribute('aria-label') || node.textContent || ''))
  if (button) button.click()
})
await page.waitForTimeout(3000)

const badges = await page.evaluate(() => Array.from(document.querySelectorAll('span'))
  .map(node => (node.textContent || '').trim())
  .filter(text => /^(включено|всего) \d+$/.test(text)))
console.log('stat badges:', JSON.stringify(badges))

const clicked = await page.evaluate((path) => {
  const input = document.querySelector('input[placeholder*=".md"]')
  if (!input) return 'no input'
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(input, path)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  return 'typed'
}, folder)
console.log('typed:', clicked)
await page.waitForTimeout(600)

const pressed = await page.evaluate(() => {
  const button = Array.from(document.querySelectorAll('button'))
    .find(node => (node.textContent || '').trim() === 'Импортировать')
  if (!button) return 'no button'
  button.click()
  return 'clicked'
})
console.log('import button:', pressed)
await page.waitForTimeout(4000)

const rows = await page.evaluate(() => Array.from(document.querySelectorAll('li'))
  .map(node => (node.textContent || '').trim())
  .filter(text => /demo-import/.test(text)))
console.log('demo-import rows:', JSON.stringify(rows.slice(0, 3)))
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/skills-0.2.9.png' })
await browser.close()
