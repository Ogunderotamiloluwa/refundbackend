import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function GradientBackground() {
  const [colors, setColors] = useState(['from-indigo-900', 'via-purple-900', 'to-command-dark'])

  useEffect(() => {
    const interval = setInterval(() => {
      const colorSets = [
        ['from-indigo-900', 'via-purple-900', 'to-command-dark'],
        ['from-command-cobalt', 'via-blue-900', 'to-command-dark'],
        ['from-purple-900', 'via-indigo-900', 'to-command-dark'],
      ]
      setColors(colorSets[Math.floor(Math.random() * colorSets.length)])
    }, 12000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Static gradient base */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors[0]} ${colors[1]} ${colors[2]} opacity-40 transition-all duration-5000`}
      />

      {/* Subtle floating orbs */}
      <motion.div
        animate={{
          y: [0, 20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 -left-40 w-96 h-96 bg-command-cobalt/5 rounded-full blur-3xl"
      />

      <motion.div
        animate={{
          y: [0, -20, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-32 -right-32 w-80 h-80 bg-command-gold/3 rounded-full blur-3xl"
      />
    </div>
  )
}
