"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, X, Mail, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const navigation = [
  { name: "Solutions", href: "/solutions" },
  { name: "Services", href: "/services" },
  { name: "Case Studies", href: "/cases" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-sm shadow-soft-sm"
            : "bg-transparent"
        )}
      >
        <nav
          className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2 group">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="text-2xl font-display font-extrabold bg-gradient-to-r from-primary-600 via-coral-500 to-cyan-600 bg-clip-text text-transparent">
                    VexNexa
                  </span>
                </motion.div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-base font-semibold transition-all relative py-2 group",
                    pathname === item.href
                      ? "text-primary-600"
                      : "text-gray-700 hover:text-primary-600"
                  )}
                >
                  <span className="relative">
                    {item.name}
                    {pathname === item.href && (
                      <motion.div
                        layoutId="underline"
                        className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-coral-500 rounded-full"
                      />
                    )}
                    {pathname !== item.href && (
                      <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-coral-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    )}
                  </span>
                </Link>
              ))}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              <Button variant="ghost" size="sm" className="hover:bg-primary-50" asChild>
                <Link href="/contact">
                  <Mail className="w-4 h-4 mr-1.5" />
                  Contact
                </Link>
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-md hover:shadow-lg transition-all"
                asChild
              >
                <Link href="/contact?intent=project">
                  <ArrowRight className="w-4 h-4 mr-1.5" />
                  Get Started
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-charcoal hover:text-primary hover:bg-steel-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-t border-steel-200"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "block px-3 py-3 rounded-md text-base font-medium transition-colors",
                      pathname === item.href
                        ? "text-primary bg-primary-50"
                        : "text-charcoal hover:text-primary hover:bg-steel-50"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 space-y-2">
                  <Button variant="ghost" className="w-full hover:bg-primary-50" asChild>
                    <Link href="/contact">
                      <Mail className="w-4 h-4 mr-1.5" />
                      Contact
                    </Link>
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
                    asChild
                  >
                    <Link href="/contact?intent=project">
                      <ArrowRight className="w-4 h-4 mr-1.5" />
                      Get Started
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
