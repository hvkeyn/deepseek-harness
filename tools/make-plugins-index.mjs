// Build the plugin market index this fork publishes for the Discover tab.
//
// Every experimental bundle in the repository becomes one entry whose single
// version installs from a git source pinned to the current commit. The index is
// format 1 of @deepseek-ai/dsh-plugin-market-index.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const timestamp = Math.floor(Date.now() / 1000)
const repositoryUrl = 'https://github.com/hvkeyn/deepseek-harness'

const experimental = join(root, 'packages/experimental')
const entries = []
for (const directory of readdirSync(experimental)) {
  const packagePath = join(experimental, directory, 'package.json')
  let manifest
  try { manifest = JSON.parse(readFileSync(packagePath, 'utf8')) } catch { continue }
  if (manifest.dsh?.bundle === undefined) continue
  const description = typeof manifest.description === 'string' ? manifest.description : undefined
  entries.push({
    name: manifest.name,
    ...description === undefined ? {} : { title: { en: manifest.name, ru: manifest.name, zh: manifest.name } },
    ...description === undefined ? {} : { description: { en: description, ru: description, zh: description } },
    author: 'HVKeyn Edition',
    homepage: repositoryUrl,
    repository: { url: repositoryUrl, directory: `packages/experimental/${directory}` },
    metadata: { keywords: [], labels: [], sortKeys: {} },
    versions: [{
      version: manifest.version,
      publishTimestamp: timestamp,
      source: { type: 'git', url: repositoryUrl, commit, path: `packages/experimental/${directory}` },
      engines: { dsh: '>=0.2.0' },
    }],
  })
}

const index = {
  format: 1,
  title: { en: 'HVKeyn Edition plugins', ru: 'Плагины HVKeyn Edition', zh: 'HVKeyn Edition 插件' },
  description: {
    en: 'Experimental bundles shipped with this fork; install from the Discover tab.',
    ru: 'Экспериментальные плагины этой сборки; установка со вкладки «Обзор».',
    zh: '此分支的实验性插件；在「发现」标签页安装。',
  },
  metadata: { categories: {}, labels: {}, sortKeys: {} },
  plugins: entries,
}

writeFileSync(join(root, 'dist/plugins-index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8')
console.log(`plugins index: ${entries.length} entries, commit ${commit.slice(0, 8)}`)
