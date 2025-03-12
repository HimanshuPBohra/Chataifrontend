"use client"

import Chatbot from "./components/ChatWindow"
import { useEffect } from "react"

export default function App() {
  // Check for system preference on initial load
  useEffect(() => {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem("theme")

    // If no saved preference, check system preference
    if (!savedTheme) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        document.documentElement.classList.add("dark")
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Your main content can go here */}
      </div>
      <Chatbot />
    </div>
  )
}

