// Verify the image annotator: attach a PNG, open the pen overlay, draw, save.
import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const image = process.argv[3]
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)

const fileInput = await page.$('input[type=file]')
console.log('file input:', fileInput !== null)
if (fileInput === null) { await browser.close(); process.exit(0) }
await fileInput.setInputFiles(image)
await page.waitForTimeout(3000)

const opened = await page.evaluate(() => {
  const button = Array.from(document.querySelectorAll('button'))
    .find(node => /Annotate image|\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0440\u0430\u0437\u043c\u0435\u0442\u043a\u0443|\u0410\u043d\u043d\u043e\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c/.test(node.getAttribute('aria-label') || ''))
  if (button === null) return 'no button'
  button.click()
  return 'clicked'
})
console.log('annotate button:', opened)
await page.waitForTimeout(1500)

const dialog = await page.evaluate(() => {
  const node = document.querySelector('[role=dialog]')
  return node === null ? 'none' : (node.getAttribute('aria-label') || 'dialog')
})
console.log('dialog:', dialog)

if (dialog !== 'none') {
  const canvas = await page.$('canvas')
  const box = canvas === null ? null : await canvas.boundingBox()
  if (box !== null) {
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.6, { steps: 8 })
    await page.mouse.up()
  }
  await page.waitForTimeout(500)
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('[role=dialog] button'))
    .map(node => (node.textContent || '').trim()).filter(Boolean))
  console.log('dialog buttons:', JSON.stringify(buttons))
  await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/annotator-0.3.2.png' })
  const saved = await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll('[role=dialog] button'))
      .find(node => /Save markup|\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c/.test(node.textContent || ''))
    if (button === undefined) return 'no save'
    button.click()
    return 'saved'
  })
  console.log('save:', saved)
  await page.waitForTimeout(2500)
  const after = await page.evaluate(() => document.querySelector('[role=dialog]') === null)
  console.log('dialog closed:', after)
}
await browser.close()
