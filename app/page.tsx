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
    label: "Community Platforms",
    color: "bg-gradient-to-br from-primary-400 to-primary-600",
    icon: Users,
    desc: "Build thriving communities"
  },
  {
    label: "Social Networks",
    color: "bg-gradient-to-br from-coral-400 to-coral-600",
    icon: Heart,
    desc: "Connect hearts & minds"
  },
  {
    label: "Messaging Apps",
    color: "bg-gradient-to-br from-cyan-400 to-cyan-600",
    icon: MessageCircle,
    desc: "Real-time conversations"
  },
  {
    label: "Video Platforms",
    color: "bg-gradient-to-br from-sunny-400 to-sunny-600",
    icon: Video,
    desc: "Face-to-face moments"
  },
]

const connectionBenefits = [
  {
    icon: Heart,
    title: "Bring People Together",
    description: "Create spaces where meaningful connections happen naturally. Build communities that thrive on genuine interactions and shared experiences.",
    color: "coral"
  },
  {
    icon: Sparkles,
    title: "Make It Easy & Fun",
    description: "No complicated onboarding. No confusing interfaces. Just simple, delightful experiences that make people smile from day one.",
    color: "primary"
  },
  {
    icon: Zap,
    title: "Connect Instantly",
    description: "Real-time messaging, video calls, notifications—everything you need to keep your community engaged and connected 24/7.",
    color: "cyan"
  },
  {
    icon: Globe2,
    title: "Reach Everyone",
    description: "Build inclusive platforms that work for everyone, everywhere. From local communities to global movements, we've got you covered.",
    color: "sunny"
  }
]

const stats = [
  { value: "10M+", label: "Connections Made", color: "primary" },
  { value: "500K+", label: "Happy Users", color: "coral" },
  { value: "99.9%", label: "Uptime", color: "cyan" },
  { value: "24/7", label: "Support", color: "sunny" }
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
              <span className="text-sm font-semibold text-primary-700">Connecting People, Creating Joy!</span>
            </motion.div>

            <h1 className="text-display-lg md:text-display-xl bg-gradient-to-r from-primary-600 via-coral-500 to-cyan-600 bg-clip-text text-transparent mb-6 text-balance font-extrabold">
              Connect Everyone,{" "}
              <span className="relative inline-block">
                Everywhere
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-sunny-300 -z-10"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 mb-10 leading-relaxed max-w-3xl mx-auto">
              We build platforms that bring people together. From community hubs to social networks,
              we create spaces where connections flourish and friendships bloom. 🌸
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-glow-purple transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <Link href="/contact?intent=project">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Connecting People
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="group hover:bg-gradient-to-r hover:from-coral-50 hover:to-primary-50"
                asChild
              >
                <Link href="/about#process">
                  <Smile className="w-5 h-5 mr-2 group-hover:animate-wiggle" />
                  See Our Happy Approach
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
              Why People Love Us
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              We don't just build platforms—we create experiences that make connecting feel natural, joyful, and fun!
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
                From Idea to Thriving Community
              </h2>
              <p className="text-xl text-gray-600">
                Simple steps, amazing results. Let's build something people will love! ✨
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
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Understand Your Community</h3>
                <p className="text-gray-600 leading-relaxed">
                  We dive deep into who you want to connect, what makes them tick, and how they love to interact.
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
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Design Delightful Experiences</h3>
                <p className="text-gray-600 leading-relaxed">
                  Beautiful interfaces, smooth interactions, and features that make people say "wow!" every time.
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
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Grow & Celebrate Together</h3>
                <p className="text-gray-600 leading-relaxed">
                  Watch your community thrive! We're here to help you scale, optimize, and celebrate every milestone.
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
              Platforms That Connect
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From intimate groups to massive communities—we build it all with love! 💜
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-2 border-primary-200 hover:border-primary-400 hover:shadow-glow-purple transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 mb-6 shadow-lg">
                <Users className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Community Platforms</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Build vibrant communities where members connect, share, and grow together. Forums, groups, events—everything in one place!
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                  Member profiles & connections
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                  Discussion forums & groups
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                  Event planning & RSVP
                </li>
              </ul>
              <Link href="/solutions#community" className="text-primary-600 font-semibold hover:text-primary-700 inline-flex items-center group">
                Explore Community Features
                <Share2 className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <Card className="h-full border-2 border-coral-200 hover:border-coral-400 hover:shadow-glow-pink transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-coral-400 to-coral-600 mb-6 shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Real-Time Messaging</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Keep conversations flowing with instant messaging, group chats, and seamless notifications that keep everyone in the loop.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-coral-500 mr-3 mt-0.5 flex-shrink-0" />
                  1-on-1 & group messaging
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-coral-500 mr-3 mt-0.5 flex-shrink-0" />
                  File sharing & reactions
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-coral-500 mr-3 mt-0.5 flex-shrink-0" />
                  Push notifications
                </li>
              </ul>
              <Link href="/solutions#messaging" className="text-coral-600 font-semibold hover:text-coral-700 inline-flex items-center group">
                Discover Messaging Tools
                <Share2 className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-glow-cyan transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 mb-6 shadow-lg">
                <Video className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Video & Voice Calls</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Bring people face-to-face with crystal-clear video calls, virtual meetups, and live streaming capabilities.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-cyan-500 mr-3 mt-0.5 flex-shrink-0" />
                  HD video & voice quality
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-cyan-500 mr-3 mt-0.5 flex-shrink-0" />
                  Screen sharing & recording
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-cyan-500 mr-3 mt-0.5 flex-shrink-0" />
                  Live streaming events
                </li>
              </ul>
              <Link href="/solutions#video" className="text-cyan-600 font-semibold hover:text-cyan-700 inline-flex items-center group">
                See Video Features
                <Share2 className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45 }}
          >
            <Card className="h-full border-2 border-sunny-200 hover:border-sunny-400 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sunny-400 to-sunny-600 mb-6 shadow-lg">
                <Globe2 className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Social Networks</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Create social experiences where people share moments, discover content, and build meaningful relationships that last.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-sunny-600 mr-3 mt-0.5 flex-shrink-0" />
                  Posts, stories & feeds
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-sunny-600 mr-3 mt-0.5 flex-shrink-0" />
                  Friend connections & follows
                </li>
                <li className="flex items-start text-gray-700">
                  <Star className="w-5 h-5 text-sunny-600 mr-3 mt-0.5 flex-shrink-0" />
                  Content discovery algorithm
                </li>
              </ul>
              <Link href="/solutions#social" className="text-sunny-700 font-semibold hover:text-sunny-800 inline-flex items-center group">
                Build Your Network
                <Share2 className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
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
              Ready to Connect the World?
            </h2>
            <p className="text-xl md:text-2xl mb-10 leading-relaxed opacity-95">
              Let's build something amazing together! Whether you're creating a cozy community
              or the next big social platform, we're here to make it happen. 🚀
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary-700 hover:bg-gray-100 shadow-xl transform hover:scale-105 transition-all duration-200 font-bold"
                asChild
              >
                <Link href="/contact?intent=project">
                  <Heart className="w-5 h-5 mr-2" />
                  Let's Create Together!
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm"
                asChild
              >
                <Link href="/about">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Learn About Our Team
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
