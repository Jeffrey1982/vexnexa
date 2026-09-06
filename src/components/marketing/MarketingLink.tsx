'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { localizeMarketingHref } from '@/lib/marketing-links';

type MarketingLinkProps = ComponentPropsWithoutRef<typeof Link>;

/** A normal Next link that keeps the current language on known marketing pages. */
const MarketingLink = forwardRef<HTMLAnchorElement, MarketingLinkProps>(function MarketingLink(
  { href, ...props },
  ref
) {
  const locale = useLocale();
  const localizedHref = typeof href === 'string'
    ? localizeMarketingHref(href, locale)
    : href.protocol || href.hostname || href.host || typeof href.pathname !== 'string'
      ? href
      : { ...href, pathname: localizeMarketingHref(href.pathname, locale) };

  return <Link {...props} href={localizedHref} ref={ref} />;
});

export default MarketingLink;
