import { chromium } from 'file:///C:/PROJECTS/DeepSeekHarness/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage()
const hits = []
page.on('console', m => { const t = m.text(); if (t.includes('BISECT') || t.includes('conflicts')) hits.push(t) })
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(15000)
console.log('hits', hits.length)
for (const h of hits.slice(0, 3)) console.log(h.slice(0, 300))
await browser.close()
