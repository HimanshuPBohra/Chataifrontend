"use client"

import { useState } from 'react'

export default function QuickAction({ action, onClick }) {
  const Icon = action.icon
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:translate-y-[-2px] flex items-center space-x-4 border border-neutral-100"
    >
      <div className={`p-3 rounded-lg transition-all duration-500 ${
        isHovered 
          ? 'bg-gradient-to-br from-primary-blue to-primary-green' 
          : 'bg-gradient-to-br from-primary-blue-light/30 to-primary-green-light/30'
      }`}>
        <Icon className={`w-6 h-6 transition-all duration-500 ${
          isHovered ? 'text-white' : 'text-primary-blue'
        }`} />
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-medium text-lg text-gray-800">{action.label}</h3>
        <p className="text-sm text-gray-500">{action.description}</p>
      </div>
    </button>
  )
} 