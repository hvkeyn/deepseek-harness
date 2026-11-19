/** Local mirror of the Host's skill admin entry: the tab only reads these fields. */

/** One catalog skill as the management tab sees it. */
export interface SkillAdminEntry {
  /** Kebab-case identifier. */
  readonly name: string
  /** Short routing description. */
  readonly description: string
  /** Absolute instruction-file path when a filesystem provider supplied one. */
  readonly path?: string
  /** Whether the skill is currently offered to the model and the composer. */
  readonly enabled: boolean
}
