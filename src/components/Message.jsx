"use client"

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Calendar, Clock, CheckCircle2, XCircle, MessageSquare, Zap, User } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import botLogo from "../assets/uknowva.png" // Bot logo import
import userAvatar from "../assets/avtar.png" // User avatar import

export default function Message({
  message,
  onDateSelect,
  onSend,
  botLogoPath = botLogo,
  userAvatarPath = userAvatar,
  botName = "ChatBot",
  showTimestamp = false,
}) {
  const { role, content, timestamp } = message
  const isBot = role === "bot"
  const [actionClicked, setActionClicked] = useState("")

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return ""
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    return isToday
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const renderAvatar = () => {
    if (isBot) {
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-primary-blue to-primary-green rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 border-2 border-white">
          <img src={botLogoPath} alt="Bot" className="w-8 h-8" />
        </div>
      )
    }
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-accent-gold-light to-accent-gold rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 border-2 border-white">
        <User className="w-6 h-6 text-white" />
      </div>
    )
  }

  const renderMessageContent = () => {
    if (!content) return null

    if (typeof content === "string" && content.includes("<table")) {
      return (
        <div className="w-full overflow-x-auto rounded-xl shadow-sm bg-white p-2 my-2 animate-fadeIn">
          <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )
    }

    if (typeof content === "string") {
      return (
        <div className="whitespace-pre-wrap">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )
    }

    if (typeof content === "object" && content.message) {
      return (
        <div className="whitespace-pre-wrap">
          <ReactMarkdown>{content.message}</ReactMarkdown>
        </div>
      )
    }

    return String(content)
  }

  const renderStructuredContent = () => {
    if (typeof content !== "object") return null

    switch (content.type) {
      case "date_picker":
        return (
          <div className="mt-3 bg-white/90 rounded-xl p-4 shadow-md border border-primary-blue-light animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-primary-blue" />
              <span className="text-gray-700 font-medium">{content.message}</span>
            </div>
            <DatePicker
              selected={null}
              onChange={(date) => onDateSelect && onDateSelect(content.field, date)}
              dateFormat="yyyy-MM-dd"
              minDate={new Date()}
              className="w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue shadow-sm"
              placeholderText="Select a date"
            />
          </div>
        )

      case "leave_type_selection":
        return (
          <div className="mt-3 bg-white/90 rounded-xl p-4 shadow-md border border-primary-blue-light animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary-blue" />
              <span className="text-gray-700 font-medium">{content.message}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {content.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onDateSelect && onDateSelect("leave_type", option.value)}
                  className="p-3 text-left border rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-primary-blue-light transition-all duration-300 shadow-sm"
                >
                  <span className="text-sm font-medium text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case "leave_confirmation":
        let details
        try {
          details = typeof content.details === "string" ? JSON.parse(content.details) : content.details
        } catch (e) {
          console.error("Error parsing confirmation details:", e)
          details = {}
        }
        return (
          <div className="mt-3 bg-white/90 rounded-xl p-4 shadow-md border border-primary-blue-light animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-primary-blue" />
              <span className="text-gray-700 font-medium">Confirm Leave Details</span>
            </div>
            <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-gray-500">Leave Type:</span>
                <span className="text-sm font-medium">{details.Leave_type}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-gray-500">Start Date:</span>
                <span className="text-sm font-medium">{details.startDate}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-gray-500">End Date:</span>
                <span className="text-sm font-medium">{details.endDate}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-gray-500">Half Day:</span>
                <span className="text-sm font-medium">{details.half_day === "Y" ? "Yes" : "No"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-gray-500">Reason:</span>
                <span className="text-sm font-medium">{details.reason}</span>
              </div>
            </div>
            <p className="text-sm mb-3 text-gray-600">{content.message}</p>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-2 rounded-lg bg-green-500 text-white font-medium flex items-center justify-center gap-1 shadow-sm hover:bg-green-600 transition-all duration-300 ${actionClicked === "confirm" ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={actionClicked === "confirm"}
                onClick={() => {
                  setActionClicked("confirm")
                  onSend && onSend("Y")
                }}
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Confirm</span>
              </button>
              <button
                className={`flex-1 py-2 rounded-lg bg-red-500 text-white font-medium flex items-center justify-center gap-1 shadow-sm hover:bg-red-600 transition-all duration-300 ${actionClicked === "cancel" ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={actionClicked === "cancel"}
                onClick={() => {
                  setActionClicked("cancel")
                  onSend && onSend("N")
                }}
              >
                <XCircle className="w-4 h-4 text-white" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )

      case "leave_response":
        const isSuccess = content.status === "success"
        return (
          <div className={`mt-3 rounded-xl p-4 shadow-md border animate-fadeIn ${isSuccess ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`font-medium ${isSuccess ? "text-green-700" : "text-red-700"}`}>
                {isSuccess ? "Success" : "Error"}
              </span>
            </div>
            <p className={`text-sm ${isSuccess ? "text-green-600" : "text-red-600"}`}>{content.message}</p>
            {isSuccess && (
              <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded-lg border border-green-100">
                <Zap className="w-4 h-4 text-accent-gold" />
                <span className="text-xs text-gray-600">Your leave request has been submitted successfully.</span>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`flex gap-4 ${isBot ? "animate-slideInLeft" : "animate-slideInRight justify-end"}`}>
      {isBot && <div className="mt-1">{renderAvatar()}</div>}
      <div className={`flex flex-col max-w-[85%] ${!isBot && "items-end"}`}>
        <div
          className={`px-5 py-4 rounded-2xl shadow-sm text-base ${
            isBot ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {renderMessageContent()}
          {renderStructuredContent()}
        </div>
        {showTimestamp && (
          <span className="text-sm text-gray-500 mt-1 px-1">
            {formatTimestamp(timestamp)}
          </span>
        )}
      </div>
      {!isBot && <div className="mt-1">{renderAvatar()}</div>}
    </div>
  )
}