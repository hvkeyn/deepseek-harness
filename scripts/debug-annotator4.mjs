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
console.log(await page.evaluate(() => {
  const canvas = document.querySelector('[role=dialog] canvas')
  const r = canvas.getBoundingClientRect()
  const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
  return { hit: hit ? hit.tagName + '.' + hit.className : 'none', canvasClass: canvas.className, pointerEvents: getComputedStyle(canvas).pointerEvents }
}))
await browser.close()