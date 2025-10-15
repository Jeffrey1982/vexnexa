"use client"

import Image from "next/image"
import { motion } from "framer-motion"

interface Logo {
  name: string
  src: string
  width?: number
  height?: number
}

interface LogoCloudProps {
  logos: Logo[]
  title?: string
}

export function LogoCloud({ logos, title = "Trusted by forward-thinking teams" }: LogoCloudProps) {
  return (
    <div className="py-12">
      {title && (
        <p className="text-center text-sm font-medium text-steel-600 uppercase tracking-wider mb-8">
          {title}
        </p>
      )}
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-7 items-center justify-items-center">
        {logos.map((logo, index) => (
          <motion.div
            key={logo.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={logo.width || 120}
              height={logo.height || 40}
              className="max-h-10 w-auto"
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
