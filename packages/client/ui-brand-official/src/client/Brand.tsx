import { BrandWordmark, FishLogo } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import css from './Brand.module.css'

/**
 * Render the official mark with the presentation requested by its host surface.
 * @param props - Host-supplied mark presentation.
 * @returns the official whale mark.
 */
export function OfficialBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return <FishLogo size={size} />
}

/**
 * Render the official name artwork with this deployment's edition marker.
 *
 * The sidebar names the edition compactly so the lockup fits its narrowest width;
 * the full edition name stays available as the marker's title.
 * @param props - Locale seat that supplies the edition labels.
 * @returns the official name wordmark followed by the compact edition marker.
 */
export function OfficialBrandName({ t }: PropsLocale<'common'>) {
  return (
    <span className={css.name}>
      <BrandWordmark includeMark={false} />
      <span className={css.edition} title={t('brand.hvkeynEdition')}>{t('brand.hvkeynEditionCompact')}</span>
    </span>
  )
}
