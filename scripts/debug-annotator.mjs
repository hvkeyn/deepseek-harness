// Debug the annotator overlay: dump its DOM after opening.
import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'

const url = process.argv[2]
const image = process.argv[3]
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.on('console', message => { if (message.type() === 'error') console.log('console.error:', message.text().slice(0, 200)) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)
const input = await page.$('input[type=file]')
await input.setInputFiles(image)
await page.waitForTimeout(3000)
console.log('attachments in rail:', await page.evaluate(() => document.querySelectorAll('img[src^="blob:"]').length))
await page.evaluate(() => {
  const button = Array.from(document.querySelectorAll('button'))
    .find(node => (node.getAttribute('aria-label') || '') === 'Annotate image')
  if (button) button.click()
})
await page.waitForTimeout(2000)
const html = await page.evaluate(() => {
  const node = document.querySelector('[role=dialog]')
  return node === null ? 'none' : node.outerHTML.slice(0, 1200)
})
console.log('dialog html:', html)
await page.waitForTimeout(500)
console.log('after 500ms dialog:', await page.evaluate(() => document.querySelector('[role=dialog]') !== null))
await browser.close()
