import Link from 'next/link';
import VexnexaLogo from '@/components/brand/VexnexaLogo';
import { useTranslations } from 'next-intl';

export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-border/50 bg-muted/30 mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <Link href="/" className="inline-block mb-2">
              <VexnexaLogo size={38} />
            </Link>
            <p className="text-xs text-muted-foreground">
              {t('description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">{t('dashboard')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('overview')}
                </Link>
              </li>
              <li>
                <Link href="/scans" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('scans')}
                </Link>
              </li>
              <li>
                <Link href="/sites" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('sites')}
                </Link>
              </li>
              <li>
                <Link href="/teams" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('teams')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Settings */}
          <div>
            <h3 className="font-semibold text-sm mb-3">{t('settings')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/settings/billing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('billing')}
                </Link>
              </li>
              <li>
                <Link href="/settings/notifications" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('notifications')}
                </Link>
              </li>
              <li>
                <Link href="/settings/white-label" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('whiteLabel')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-sm mb-3">{t('support')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('termsOfService')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} VexNexa. {t('allRightsReserved')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('madeWithLove')}
          </p>
        </div>
      </div>
    </footer>
  );
}
