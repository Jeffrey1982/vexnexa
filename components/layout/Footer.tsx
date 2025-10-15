import Link from "next/link"
import { Github, Twitter, Linkedin } from "lucide-react"

const footerNavigation = {
  solutions: [
    { name: "Websites", href: "/solutions#websites" },
    { name: "Automation", href: "/solutions#automation" },
    { name: "AI & Integrations", href: "/solutions#ai" },
    { name: "Accessibility", href: "/solutions#accessibility" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Case Studies", href: "/cases" },
    { name: "Blog", href: "/blog" },
  ],
  resources: [
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/legal/privacy" },
    { name: "Terms of Service", href: "/legal/terms" },
  ],
}

const socialLinks = [
  { name: "Twitter", href: "#", icon: Twitter },
  { name: "LinkedIn", href: "#", icon: Linkedin },
  { name: "GitHub", href: "#", icon: Github },
]

export function Footer() {
  return (
    <footer className="bg-charcoal text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="text-2xl font-display font-bold hover:text-primary transition-colors">
              VexNexa
            </Link>
            <p className="mt-4 text-sm text-steel-300 max-w-xs">
              VexNexa helps SMEs modernize—without pausing the business.
            </p>
            <div className="flex space-x-4 mt-6">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-steel-300 hover:text-primary transition-colors"
                  aria-label={item.name}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Solutions
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.solutions.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-steel-300 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-steel-300 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-steel-300 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-steel-300 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-steel-800">
          <p className="text-sm text-steel-400 text-center">
            &copy; {new Date().getFullYear()} VexNexa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
