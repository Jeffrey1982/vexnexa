"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/layout/Section"
import Link from "next/link"
import {
  Users,
  Heart,
  Sparkles,
  MessageCircle,
  Video,
  Share2,
  Zap,
  Globe2,
  PartyPopper,
  Smile,
  Star,
  TrendingUp
} from "lucide-react"

const connectionTypes = [
  {
    label: "Dating & Relationships",
    color: "bg-gradient-to-br from-primary-400 to-primary-600",
    icon: Heart,
    desc: "Platforms that spark romance"
  },
  {
    label: "Business Networks",
    color: "bg-gradient-to-br from-coral-400 to-coral-600",
    icon: TrendingUp,
    desc: "B2B connections & revenue"
  },
  {
    label: "Social Communities",
    color: "bg-gradient-to-br from-cyan-400 to-cyan-600",
    icon: Users,
    desc: "Spaces people love"
  },
  {
    label: "Interactive Experiences",
    color: "bg-gradient-to-br from-sunny-400 to-sunny-600",
    icon: Sparkles,
    desc: "Engagement that sticks"
  },
]

const connectionBenefits = [
  {
    icon: Heart,
    title: "Social Cohesion First",
    description: "Every platform we create is designed to bring people together in meaningful ways. We build spaces where authentic connections flourish and communities thrive.",
    color: "primary"
  },
  {
    icon: Sparkles,
    title: "Interactivity at the Core",
    description: "From real-time messaging to dynamic feeds, we craft experiences that keep users engaged, active, and coming back. Every interaction matters.",
    color: "coral"
  },
  {
    icon: TrendingUp,
    title: "Built for Growth",
    description: "Our platforms don't just launch—they scale. We architect systems that grow with demand, turning small communities into thriving networks.",
    color: "cyan"
  },
  {
    icon: Globe2,
    title: "Mission-Driven Innovation",
    description: "We're not just building apps—we're creating the infrastructure for human connection in the digital age. Every line of code has purpose.",
    color: "sunny"
  }
]

const stats = [
  { value: "10M+", label: "Connections Made", color: "primary" },
  { value: "500K+", label: "Active Users", color: "coral" },
  { value: "15+", label: "Platforms Live", color: "cyan" },
  { value: "24/7", label: "Always Online", color: "sunny" }
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section - Fun & Friendly */}
      <Section className="pt-20 md:pt-32 pb-32 md:pb-40 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-coral-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Fun Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-coral-100 border-2 border-primary-300 mb-8"
            >
              <PartyPopper className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Building Businesses That Connect</span>
            </motion.div>

            <h1 className="text-display-lg md:text-display-xl bg-gradient-to-r from-primary-600 via-coral-500 to-cyan-600 bg-clip-text text-transparent mb-6 text-balance font-extrabold">
              Creating Digital{" "}
              <span className="relative inline-block">
                Experiences
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-sunny-300 -z-10"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
              {" "}That Bring People Together
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 mb-10 leading-relaxed max-w-3xl mx-auto">
              VexNexa builds innovative micro-SaaS platforms that spark connections, foster communities,
              and transform how people interact online.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-glow-purple transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <Link href="/about">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Our Mission
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="group hover:bg-gradient-to-r hover:from-coral-50 hover:to-primary-50"
                asChild
              >
                <Link href="/cases">
                  <Smile className="w-5 h-5 mr-2 group-hover:animate-wiggle" />
                  What We Build
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Floating Connection Cards */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {connectionTypes.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.15, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="group cursor-pointer"
                >
                  <Card className="h-full border-2 border-transparent hover:border-primary-300 transition-all duration-300 hover:shadow-glow-purple backdrop-blur-sm bg-white/90">
                    <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow group-hover:animate-bounce-slow`}>
                      <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    <p className="font-bold text-gray-800 text-center mb-1">{item.label}</p>
                    <p className="text-sm text-gray-600 text-center">{item.desc}</p>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Fun Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1, type: "spring" }}
                className="text-center"
              >
                <div className={`text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-${stat.color}-600 to-${stat.color}-700 bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* Why Choose Us - Connection Benefits */}
      <Section className="bg-gradient-soft">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-display-md bg-gradient-to-r from-primary-600 to-coral-600 bg-clip-text text-transparent mb-4">
              What Drives Us
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              At VexNexa, we're obsessed with building platforms that don't just work—they bring people together in ways that matter.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {connectionBenefits.map((benefit, index) => {
            const Icon = benefit.icon
            const colorMap: Record<string, string> = {
              coral: "from-coral-100 to-coral-50",
              primary: "from-primary-100 to-primary-50",
              cyan: "from-cyan-100 to-cyan-50",
              sunny: "from-sunny-100 to-sunny-50"
            }
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ y: -5 }}
              >
                <Card className={`h-full bg-gradient-to-br ${colorMap[benefit.color]} border-2 border-white hover:shadow-glass transition-all duration-300`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${benefit.color}-400 to-${benefit.color}-600 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">{benefit.title}</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Section>

      {/* How We Help Connect People */}
      <Section background="white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-display-md text-gray-800 mb-4">
                How We Build
              </h2>
              <p className="text-xl text-gray-600">
                Our approach to creating platforms that connect, engage, and inspire.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Dotted connection line */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-1 border-t-4 border-dotted border-primary-300" aria-hidden="true" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex flex-col items-center justify-center text-3xl font-bold mb-6 relative z-10 shadow-glow-purple"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Users className="w-10 h-10 mb-2" />
                  <span>01</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Understand People</h3>
                <p className="text-gray-600 leading-relaxed">
                  We start by deeply understanding human behavior, desires, and needs. Great platforms begin with empathy.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="w-32 h-32 rounded-3xl bg-gradient-to-br from-coral-500 to-coral-700 text-white flex flex-col items-center justify-center text-3xl font-bold mb-6 relative z-10 shadow-glow-pink"
                  whileHover={{ rotate: -5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Sparkles className="w-10 h-10 mb-2" />
                  <span>02</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Design for Delight</h3>
                <p className="text-gray-600 leading-relaxed">
                  We craft experiences that feel intuitive, look stunning, and make every interaction meaningful and memorable.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="w-32 h-32 rounded-3xl bg-gradient-to-br from-cyan-500 to-cyan-700 text-white flex flex-col items-center justify-center text-3xl font-bold mb-6 relative z-10 shadow-glow-cyan"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <TrendingUp className="w-10 h-10 mb-2" />
                  <span>03</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Build to Last</h3>
                <p className="text-gray-600 leading-relaxed">
                  We engineer platforms that scale effortlessly, perform flawlessly, and evolve with the communities they serve.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* What We Build */}
      <Section className="bg-gradient-to-br from-primary-50 via-white to-coral-50">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-display-md text-gray-800 mb-4">
              Featured Platforms
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real products, live and serving thousands of users every day.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 lg:col-span-1"
          >
            <Card className="h-full border-2 border-primary-200 hover:border-primary-400 hover:shadow-glow-purple transition-all duration-300 bg-white/80 backdrop-blur-sm group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 border border-primary-300">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-xs font-semibold text-primary-700">Live</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Vincamor</h3>
              <a
                href="https://vincamor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4 inline-flex items-center group/link"
              >
                vincamor.com
                <Globe2 className="w-3 h-3 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
              </a>
              <p className="text-gray-700 mb-6 leading-relaxed">
                A sophisticated dating platform connecting people looking for genuine relationships. Features intelligent matching, real-time chat, and beautiful user experiences designed for connection.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                  Smart matching algorithms
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                  Real-time messaging system
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                  Safety & verification features
                </li>
              </ul>
              <a
                href="https://vincamor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 font-semibold hover:text-primary-700 inline-flex items-center group/cta"
              >
                Visit Platform
                <Share2 className="w-4 h-4 ml-2 group-hover/cta:translate-x-1 transition-transform" />
              </a>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 lg:col-span-1"
          >
            <Card className="h-full border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-glow-cyan transition-all duration-300 bg-white/80 backdrop-blur-sm group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-300">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-xs font-semibold text-cyan-700">Live</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">TutusPorta</h3>
              <a
                href="https://tutusporta.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium mb-4 inline-flex items-center group/link"
              >
                tutusporta.com
                <Globe2 className="w-3 h-3 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
              </a>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Professional WCAG accessibility checker helping businesses ensure their websites are accessible to everyone. Generate comprehensive reports and improve digital inclusivity.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-cyan-500 mr-3 mt-0.5 flex-shrink-0" />
                  Complete WCAG compliance testing
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-cyan-500 mr-3 mt-0.5 flex-shrink-0" />
                  Downloadable PDF reports
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-cyan-500 mr-3 mt-0.5 flex-shrink-0" />
                  Real-time accessibility scanning
                </li>
              </ul>
              <a
                href="https://tutusporta.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 font-semibold hover:text-cyan-700 inline-flex items-center group/cta"
              >
                Visit Platform
                <Share2 className="w-4 h-4 ml-2 group-hover/cta:translate-x-1 transition-transform" />
              </a>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* Final CTA - Playful & Inviting */}
      <Section className="bg-gradient-to-br from-primary-600 via-coral-500 to-cyan-600 text-white text-center relative overflow-hidden">
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-10 left-10 text-6xl opacity-20"
          >
            💜
          </motion.div>
          <motion.div
            animate={{ y: [0, -30, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute top-20 right-20 text-5xl opacity-20"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{ y: [0, -25, 0], rotate: [0, 15, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, delay: 2 }}
            className="absolute bottom-20 left-1/4 text-6xl opacity-20"
          >
            🌟
          </motion.div>
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, -15, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, delay: 0.5 }}
            className="absolute bottom-10 right-1/4 text-5xl opacity-20"
          >
            🎉
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-display-md md:text-display-lg mb-6 font-extrabold">
              Building the Future of Connection
            </h2>
            <p className="text-xl md:text-2xl mb-10 leading-relaxed opacity-95">
              Every day, millions of people connect through the platforms we've created.
              Explore our mission, see our work, or get in touch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary-700 hover:bg-gray-100 shadow-xl transform hover:scale-105 transition-all duration-200 font-bold"
                asChild
              >
                <Link href="/about">
                  <Heart className="w-5 h-5 mr-2" />
                  Our Story
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm"
                asChild
              >
                <Link href="/contact">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get In Touch
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
