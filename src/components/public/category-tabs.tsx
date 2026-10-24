'use client';

import {useEffect, useRef, useState, type MouseEvent} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {localizedName} from '@/lib/localize';
import type {PublicMenuCategory} from '@/server/public-menu';

type Props = {categories: PublicMenuCategory[]};

/** Stable DOM id for a category's section anchor. */
export function sectionId(categoryId: string) {
  return `section-${categoryId}`;
}

/** Distance (px) from the viewport top under the sticky bar where a section counts as current. */
const ACTIVE_LINE = 96;

/**
 * The floating category strip (Stitch nav pattern): a translucent material
 * pill that sticks to the top and tracks which section the customer scrolls
 * through, with smooth anchor jumps.
 */
export function CategoryTabs({categories}: Props) {
  const t = useTranslations('publicMenu');
  const locale = useLocale();
  const [active, setActive] = useState(categories[0]?.id ?? '');
  const tabRefs = useRef(new Map<string, HTMLAnchorElement>());

  // Track the section passing under the sticky bar while the page scrolls.
  useEffect(() => {
    const onScroll = () => {
      let current = categories[0]?.id ?? '';
      for (const category of categories) {
        const el = document.getElementById(sectionId(category.id));
        if (el && el.getBoundingClientRect().top <= ACTIVE_LINE) current = category.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [categories]);

  // Keep the current tab visible inside the horizontal strip.
  useEffect(() => {
    tabRefs.current
      .get(active)
      ?.scrollIntoView({block: 'nearest', inline: 'center', behavior: 'smooth'});
  }, [active]);

  const jump = (categoryId: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    // Anchor href works without JS; with JS we glide instead of snap.
    event.preventDefault();
    document.getElementById(sectionId(categoryId))?.scrollIntoView({behavior: 'smooth'});
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 py-3">
      <nav
        aria-label={t('sectionsNav')}
        className="material flex gap-1 overflow-x-auto rounded-full border border-hairline p-1.5 shadow-sm"
      >
        {categories.map((category) => {
          const isActive = category.id === active;
          return (
            <a
              key={category.id}
              href={`#${sectionId(category.id)}`}
              onClick={jump(category.id)}
              ref={(el) => {
                if (el) tabRefs.current.set(category.id, el);
                else tabRefs.current.delete(category.id);
              }}
              aria-current={isActive ? 'true' : undefined}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors duration-100 ${
                isActive
                  ? 'brand-gradient font-medium text-white shadow-[0_4px_12px_rgba(255,87,34,0.35)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {localizedName(locale, category)}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
