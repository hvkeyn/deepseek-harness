/** `settings.skills` namespace dictionaries (the Skills management tab). */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  tab: '技能',
  title: '技能',
  description: '本地技能：启用、添加或删除。文件位于 ~/.dsh/skills 和项目的 .dsh/skills。',
  autoAttach: '自动附加技能',
  autoAttachDescription: '启用后，已启用的技能会随每个会话自动生效，无需手动 /名字 或调用 skill。',
  enabled: '已启用',
  noSkills: '还没有技能。在下方添加第一个，或把技能包解压到 ~/.dsh/skills。',
  addTitle: '新建技能',
  addName: '名称（a-z、0-9、连字符）',
  addContent: '技能内容：标题、「Use this when…」、步骤',
  add: '添加',
  adding: '保存中…',
  remove: '删除',
  removeTitle: '删除技能文件',
  saveFailed: '无法保存技能。',
  toggleFailed: '无法更改技能状态。',
  removeFailed: '无法删除技能。',
  invalidName: '名称：小写字母、数字和连字符，以字母开头。',
} satisfies Record<string, string>

/** The `settings.skills` namespace key union. */
export type SkillsLocaleKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  tab: 'Skills',
  title: 'Skills',
  description: 'Local skills: enable, add, or remove. Files live in ~/.dsh/skills and the project’s .dsh/skills.',
  autoAttach: 'Auto-attach skills',
  autoAttachDescription: 'When on, enabled skills apply to every session without a /name or a skill call.',
  enabled: 'Enabled',
  noSkills: 'No skills yet. Add the first one below, or unpack the skills package into ~/.dsh/skills.',
  addTitle: 'New skill',
  addName: 'Name (a-z, 0-9, hyphen)',
  addContent: 'Skill text: title, “Use this when…”, steps',
  add: 'Add',
  adding: 'Saving…',
  remove: 'Remove',
  removeTitle: 'Delete the skill file',
  saveFailed: 'Could not save the skill.',
  toggleFailed: 'Could not change the skill state.',
  removeFailed: 'Could not remove the skill.',
  invalidName: 'Name: lowercase letters, digits, and hyphens, starting with a letter.',
} satisfies Record<SkillsLocaleKey, string>
