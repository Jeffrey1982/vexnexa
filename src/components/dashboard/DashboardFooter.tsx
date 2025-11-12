import Link from 'next/link';

export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-muted/30 mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-display font-bold text-sm mb-3">VexNexa</h3>
            <p className="text-xs text-muted-foreground">
              Your Secure Path to Accessibility
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Professional accessibility testing and compliance monitoring.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Dashboard</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/scans" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Scans
                </Link>
              </li>
              <li>
                <Link href="/sites" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Sites
                </Link>
              </li>
              <li>
                <Link href="/teams" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Teams
                </Link>
              </li>
            </ul>
          </div>

          {/* Settings */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Settings</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/settings/billing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Billing
                </Link>
              </li>
              <li>
                <Link href="/settings/notifications" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Notifications
                </Link>
              </li>
              <li>
                <Link href="/settings/white-label" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  White Label
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} VexNexa. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ for web accessibility
          </p>
        </div>
      </div>
    </footer>
  );
}
