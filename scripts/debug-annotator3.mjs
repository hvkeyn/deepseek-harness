import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)
await (await page.$('input[type=file]')).setInputFiles(process.argv[3])
await page.waitForTimeout(2500)
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find(n => n.getAttribute('aria-label') === 'Annotate image')
  if (b) b.click()
})
await page.waitForTimeout(2000)
const result = await page.evaluate(() => {
  const canvas = document.querySelector('[role=dialog] canvas')
  if (!canvas) return 'no canvas'
  const rect = canvas.getBoundingClientRect()
  const opts = { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2, pointerId: 1, pointerType: 'mouse', isPrimary: true }
  canvas.dispatchEvent(new PointerEvent('pointerdown', opts))
  canvas.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientX: opts.clientX + 40 }))
  canvas.dispatchEvent(new PointerEvent('pointerup', opts))
  return 'dispatched'
})
console.log('synthetic:', result)
await page.waitForTimeout(800)
console.log('undo enabled:', await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('[role=dialog] button')).find(n => (n.textContent || '').trim() === 'Undo')
  return b !== undefined && !b.disabled
}))
await browser.close()