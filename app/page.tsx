"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Section } from "@/components/layout/Section"
import Link from "next/link"
import {
  Users,
  Heart,
  Target,
  MessageCircle,
  Video,
  Share2,
  Zap,
  Globe2,
  Rocket,
  ArrowRight,
  Star,
  TrendingUp,
  CheckCircle2
} from "lucide-react"

const connectionTypes = [
  {
    label: "Dating & Relationships",
    color: "bg-gradient-to-br from-primary-400 to-primary-600",
    icon: Heart,
    desc: "Matching algorithms & engagement"
  },
  {
    label: "Business Networks",
    color: "bg-gradient-to-br from-coral-400 to-coral-600",
    icon: TrendingUp,
    desc: "Professional networking platforms"
  },
  {
    label: "Social Communities",
    color: "bg-gradient-to-br from-cyan-400 to-cyan-600",
    icon: Users,
    desc: "Community management systems"
  },
  {
    label: "Interactive Experiences",
    color: "bg-gradient-to-br from-sunny-400 to-sunny-600",
    icon: Target,
    desc: "High-engagement applications"
  },
]

const connectionBenefits = [
  {
    icon: Target,
    title: "User-Centric Design",
    description: "Every platform is engineered with user experience as the priority. We deliver intuitive interfaces that drive engagement and maximize retention metrics.",
    color: "primary"
  },
  {
    icon: Zap,
    title: "Performance at Scale",
    description: "From real-time messaging to dynamic feeds, we architect high-performance systems that maintain responsiveness under load. Built for enterprise reliability.",
    color: "coral"
  },
  {
    icon: TrendingUp,
    title: "Scalable Architecture",
    description: "Our platforms are designed for growth. We implement robust infrastructure that scales efficiently, supporting expansion from launch to enterprise-level operations.",
    color: "cyan"
  },
  {
    icon: CheckCircle2,
    title: "Results-Driven Development",
    description: "We focus on measurable outcomes. Our solutions are built to achieve your business objectives through data-informed decisions and continuous optimization.",
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
      {/* Hero Section */}
      <Section className="pt-20 md:pt-32 pb-32 md:pb-40 relative overflow-hidden">

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Company Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-coral-100 border-2 border-primary-300 mb-8"
            >
              <Rocket className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Enterprise SaaS Solutions</span>
            </motion.div>

            <h1 className="text-display-lg md:text-display-xl bg-gradient-to-r from-primary-600 via-coral-500 to-cyan-600 bg-clip-text text-transparent mb-6 text-balance font-extrabold">
              Building{" "}
              <span className="relative inline-block">
                Scalable
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-sunny-300 -z-10"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
              {" "}SaaS Platforms That Drive Results
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 mb-10 leading-relaxed max-w-3xl mx-auto">
              VexNexa delivers custom software solutions that optimize operations, increase engagement,
              and accelerate business growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-glow-purple transition-all duration-200"
                asChild
              >
                <Link href="/about">
                  <Target className="w-5 h-5 mr-2" />
                  Learn More
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="group hover:bg-gradient-to-r hover:from-coral-50 hover:to-primary-50"
                asChild
              >
                <Link href="/cases">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  View Portfolio
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Solution Categories */}
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
                  whileHover={{ y: -5 }}
                  className="group cursor-pointer"
                >
                  <Card className="h-full border-2 border-transparent hover:border-primary-300 transition-all duration-300 hover:shadow-glow-purple backdrop-blur-sm bg-white/90">
                    <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg transition-shadow`}>
                      <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    <p className="font-bold text-gray-800 text-center mb-1">{item.label}</p>
                    <p className="text-sm text-gray-600 text-center">{item.desc}</p>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1 }}
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

      {/* Why Choose Us */}
      <Section className="bg-gradient-soft">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-display-md bg-gradient-to-r from-primary-600 to-coral-600 bg-clip-text text-transparent mb-4">
              Our Approach
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              VexNexa delivers enterprise-grade solutions through proven methodologies and technical excellence.
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

      {/* Development Process */}
      <Section background="white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-display-md text-gray-800 mb-4">
                Our Process
              </h2>
              <p className="text-xl text-gray-600">
                A systematic approach to delivering high-quality software solutions.
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
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Users className="w-10 h-10 mb-2" />
                  <span>01</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Discovery & Analysis</h3>
                <p className="text-gray-600 leading-relaxed">
                  We begin by understanding your business requirements, user needs, and technical constraints to define clear objectives.
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
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Target className="w-10 h-10 mb-2" />
                  <span>02</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Design & Architecture</h3>
                <p className="text-gray-600 leading-relaxed">
                  We create comprehensive technical specifications and user-centric designs that balance functionality with usability.
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
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <TrendingUp className="w-10 h-10 mb-2" />
                  <span>03</span>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Development & Deployment</h3>
                <p className="text-gray-600 leading-relaxed">
                  We build scalable, maintainable solutions using industry best practices, with continuous testing and deployment pipelines.
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

      {/* Final CTA */}
      <Section className="bg-gradient-to-br from-primary-600 via-coral-500 to-cyan-600 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-display-md md:text-display-lg mb-6 font-extrabold">
              Ready to Build Your Platform?
            </h2>
            <p className="text-xl md:text-2xl mb-10 leading-relaxed opacity-95">
              Partner with VexNexa to develop scalable solutions that deliver measurable results.
              Explore our capabilities or discuss your project requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary-700 hover:bg-gray-100 shadow-xl transition-all duration-200 font-bold"
                asChild
              >
                <Link href="/about">
                  <Target className="w-5 h-5 mr-2" />
                  About Us
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm"
                asChild
              >
                <Link href="/contact">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Contact Us
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
