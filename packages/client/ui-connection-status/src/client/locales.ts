/** `connectionStatus` namespace dictionaries for the session header chip. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'label.online': '在线',
  'label.slow': '网络较慢',
  'label.offline': '离线',
  'label.checking': '检查中',
  'tip.online': '与 Harness 的连接正常。离线技能会在网络断开时接管。',
  'tip.slow': '连接较慢：先做机械步骤，避免一次拉取大量上下文。',
  'tip.offline': 'Harness 不可达或浏览器离线：使用 offline-mode 技能，仅依赖本地文件与工具。',
  'tip.checking': '正在检查与 Harness 的连接。',
} satisfies Record<string, string>

/** The namespace key union. */
export type ConnectionStatusKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'label.online': 'Online',
  'label.slow': 'Slow link',
  'label.offline': 'Offline',
  'label.checking': 'Checking',
  'tip.online': 'The Harness connection is healthy. The offline skill takes over when the link drops.',
  'tip.slow': 'The link is slow: do mechanical steps first and avoid pulling large context at once.',
  'tip.offline': 'The Harness is unreachable or the browser is offline: use the offline-mode skill and rely on local files and tools.',
  'tip.checking': 'Checking the Harness connection.',
} satisfies Record<ConnectionStatusKey, string>
