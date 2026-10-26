import {getTranslations} from 'next-intl/server';
import {
  ChartIcon,
  PrinterIcon,
  QrCodeIcon,
  RefreshIcon,
  TableIcon,
  WhatsAppIcon
} from '@/components/icons';

/** Ordered to match the i18n keys `features.items.{0..5}`. */
const FEATURE_ICONS = [QrCodeIcon, WhatsAppIcon, TableIcon, RefreshIcon, PrinterIcon, ChartIcon];

export async function FeatureGrid() {
  const t = await getTranslations('landing');

  return (
    <section id="features" className="scroll-mt-20 border-t border-hairline bg-surface-raised">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('features.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('features.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ICONS.map((Icon, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-base border border-hairline bg-surface p-5"
            >
              <span className="grid size-10 place-items-center rounded-base bg-muted text-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="text-sm font-semibold">{t(`features.items.${index}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`features.items.${index}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
