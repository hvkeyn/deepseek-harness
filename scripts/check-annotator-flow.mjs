// Full annotator flow: attach, open, draw one stroke, save, check the rail.
import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const image = process.argv[3]
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)
const input = await page.$('input[type=file]')
await input.setInputFiles(image)
await page.waitForTimeout(2500)

await page.evaluate(() => {
  const button = Array.from(document.querySelectorAll('button'))
    .find(node => (node.getAttribute('aria-label') || '') === 'Annotate image')
  if (button) button.click()
})
await page.waitForTimeout(2000)

const canvas = await page.$('[role=dialog] canvas')
const box = await canvas.boundingBox()
await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.3)
await page.mouse.down()
await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.55, { steps: 10 })
await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.35, { steps: 10 })
await page.mouse.up()
await page.waitForTimeout(600)

const undoEnabled = await page.evaluate(() => {
  const node = Array.from(document.querySelectorAll('[role=dialog] button'))
    .find(button => (button.textContent || '').trim() === 'Undo')
  return node !== undefined && !node.disabled
})
console.log('stroke recorded (undo enabled):', undoEnabled)
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/annotator-drawn.png' })

const before = await page.evaluate(() => document.querySelectorAll('img[src^="blob:"]').length)
await page.evaluate(() => {
  const button = Array.from(document.querySelectorAll('[role=dialog] button'))
    .find(node => (node.textContent || '').trim() === 'Save markup')
  if (button) button.click()
})
await page.waitForTimeout(3000)
const state = await page.evaluate(() => ({
  dialog: document.querySelector('[role=dialog]') !== null,
  images: document.querySelectorAll('img[src^="blob:"]').length,
}))
console.log('before images:', before, 'after:', JSON.stringify(state))
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/annotator-saved.png' })
await browser.close()
