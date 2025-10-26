import Link from "next/link"
import { Heart, Users, MessageCircle, Sparkles } from "lucide-react"

const footerNavigation = {
  connect: [
    { name: "Community Platforms", href: "/solutions#community" },
    { name: "Social Networks", href: "/solutions#social" },
    { name: "Messaging Apps", href: "/solutions#messaging" },
    { name: "Video Platforms", href: "/solutions#video" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "How We Help", href: "/services" },
    { name: "Happy Stories", href: "/cases" },
  ],
  resources: [
    { name: "Pricing", href: "/pricing" },
    { name: "Say Hello", href: "/contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/legal/privacy" },
    { name: "Terms of Service", href: "/legal/terms" },
  ],
}

const socialLinks = [
  { name: "Twitter", href: "#", icon: MessageCircle, color: "hover:text-cyan-400" },
  { name: "LinkedIn", href: "#", icon: Users, color: "hover:text-primary-400" },
  { name: "Community", href: "#", icon: Heart, color: "hover:text-coral-400" },
]

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-primary-950 to-gray-900 text-white relative overflow-hidden" aria-labelledby="footer-heading">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-coral-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20" />
        <div className="absolute top-1/2 left-1/2 w-36 h-36 bg-cyan-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20" />
      </div>

      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-display font-extrabold bg-gradient-to-r from-primary-400 via-coral-400 to-cyan-400 bg-clip-text text-transparent hover:from-primary-300 hover:via-coral-300 hover:to-cyan-300 transition-all">
                VexNexa
              </span>
            </Link>
            <p className="mt-4 text-base text-gray-300 max-w-xs leading-relaxed">
              Bringing people together through beautiful platforms and meaningful connections. 💜
            </p>
            <div className="flex space-x-4 mt-6">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`text-gray-400 ${item.color} transition-all transform hover:scale-110`}
                  aria-label={item.name}
                >
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-bold text-primary-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              What We Build
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.connect.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 hover:text-coral-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold text-coral-300 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold text-sunny-300 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-300 hover:text-sunny-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700/50">
          <p className="text-sm text-gray-400 text-center">
            &copy; {new Date().getFullYear()} VexNexa. Made with <Heart className="w-4 h-4 inline text-coral-400 animate-pulse-slow" /> for people who love bringing people together.
          </p>
        </div>
      </div>
    </footer>
  )
}
