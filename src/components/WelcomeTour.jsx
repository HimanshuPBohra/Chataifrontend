"use client"

import { useEffect, useState } from "react"
import { X, Check, Calendar, Clock, FileText, Info } from "lucide-react"
import botLogo from "../assets/uknowva.png"

export default function WelcomeTour() {
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    // Add welcome message to localStorage to prevent showing tour again
    localStorage.setItem("hasVisitedBefore", "true")
    
    // Trigger animation after mounting
    setTimeout(() => setAnimateIn(true), 100)
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[10000]">
      <div className={`bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 relative transform transition-all duration-500 ${animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button
          onClick={() => window.location.reload()}
          className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
        
        <div className="w-16 h-16 bg-gradient-to-br from-primary-blue to-primary-green rounded-xl flex items-center justify-center mb-6 shadow-md">
          <img src={botLogo} alt="Uknowva Logo" className="w-10 h-10" />
        </div>
        
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-blue-dark to-primary-green-dark bg-clip-text text-transparent mb-3">Welcome to HR Assistant! 👋</h2>
        
        <p className="text-neutral-600 mb-6">
          I'm here to help you manage your HR-related needs quickly and efficiently.
        </p>
        
        <div className="space-y-4 mb-6">
          <div className="p-3 bg-primary-blue-light/20 rounded-xl flex items-start">
            <div className="mr-3 mt-0.5">
              <Calendar className="w-5 h-5 text-primary-blue" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-800">Leave Management</h3>
              <p className="text-sm text-neutral-600">Apply for leave, check balances, and view history</p>
            </div>
          </div>
          
          <div className="p-3 bg-primary-green-light/20 rounded-xl flex items-start">
            <div className="mr-3 mt-0.5">
              <Clock className="w-5 h-5 text-primary-green" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-800">Time Tracking</h3>
              <p className="text-sm text-neutral-600">Log working hours and view attendance records</p>
            </div>
          </div>
          
          <div className="p-3 bg-accent-gold-light/20 rounded-xl flex items-start">
            <div className="mr-3 mt-0.5">
              <FileText className="w-5 h-5 text-accent-gold" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-800">Policy Information</h3>
              <p className="text-sm text-neutral-600">Access company policies and HR guidelines</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-blue to-primary-green text-white flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-300 transform hover:translate-y-[-2px]"
        >
          <Check className="w-5 h-5" />
          <span>Get Started</span>
        </button>
        
        <p className="text-xs text-center text-neutral-400 mt-4">
          Click anywhere outside or press the X button to dismiss
        </p>
      </div>
    </div>
  )
} 