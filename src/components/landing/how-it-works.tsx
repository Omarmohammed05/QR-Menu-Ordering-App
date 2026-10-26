import {getTranslations} from 'next-intl/server';

const STEP_COUNT = 3;

export async function HowItWorks() {
  const t = await getTranslations('landing');

  return (
    <section className="border-t border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('steps.title')}</h2>
          <p className="mx-auto max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
            {t('steps.subtitle')}
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({length: STEP_COUNT}, (_, index) => (
            <li
              key={index}
              className="flex flex-col gap-3 rounded-base border border-hairline bg-surface p-5"
            >
              <span className="grid size-8 place-items-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                {index + 1}
              </span>
              <h3 className="text-sm font-semibold">{t(`steps.items.${index}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`steps.items.${index}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
