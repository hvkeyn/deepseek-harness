import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(14000)
await (await page.$('input[type=file]')).setInputFiles(process.argv[3])
await page.waitForTimeout(2500)
console.log('previews:', await page.evaluate(() => ({
  data: document.querySelectorAll('img[src^="data:"]').length,
  blob: document.querySelectorAll('img[src^="blob:"]').length,
})))
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find(n => n.getAttribute('aria-label') === 'Annotate image')
  if (b) b.click()
})
await page.waitForTimeout(2000)
const info = await page.evaluate(() => {
  const d = document.querySelector('[role=dialog]')
  if (!d) return { dialog: false }
  const c = d.querySelector('canvas')
  const r = c ? c.getBoundingClientRect() : null
  const styles = d.firstElementChild ? getComputedStyle(d.firstElementChild) : null
  return { dialog: true, canvas: r ? { w: r.width, h: r.height, x: r.x, y: r.y } : null, visible: styles ? styles.display : null, z: getComputedStyle(d).zIndex }
})
console.log('dialog info:', JSON.stringify(info))
await page.screenshot({ path: 'C:/PROJECTS/HVKeyn-Edition/annotator-open.png' })
await browser.close()