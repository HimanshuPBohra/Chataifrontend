"use client"

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-primary-blue-light/60 to-primary-green-light/60 rounded-xl w-fit animate-fadeIn shadow-sm rounded-tl-none">
      <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms", animationDuration: "1s" }}></div>
      <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: "300ms", animationDuration: "1s" }}></div>
      <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: "600ms", animationDuration: "1s" }}></div>
    </div>
  )
} 