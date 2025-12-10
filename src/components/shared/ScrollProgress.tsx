"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"

export function ScrollProgress() {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = (scrollPosition / totalHeight) * 100
        setValue(progress)
      } else {
        setValue(0)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <Progress
      value={value}
      className="fixed top-0 left-0 right-0 h-1 rounded-none z-50 bg-transparent"
    />
  )
}
