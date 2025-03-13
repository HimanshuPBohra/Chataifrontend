"use client"

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Calendar, Clock, CheckCircle2, XCircle, MessageSquare } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import botLogo from "../assets/uknowva.png" // Import the bot logo
import userAvatar from "../assets/avtar.png" // Import the user avatar

export default function Message({
  message,
  onDateSelect,
  onSend,
  botLogoPath = botLogo, // Use the imported bot logo
  userAvatarPath = userAvatar, // Use the imported user avatar
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
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime())

  const renderAvatar = () => {
    if (isBot) {
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-blue-600" />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <img src={userAvatarPath} alt="User" className="w-6 h-6 rounded-full" />
      </div>
    )
  }

  const renderMessageContent = () => {
    if (!content) return null

if (typeof content === "string") {
  return (
    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />
  )
}

    if (typeof content === "object") {
      if (content.message) {
        return (
          <div className="whitespace-pre-wrap">
            <ReactMarkdown>{content.message}</ReactMarkdown>
          </div>
        )
      }
      return String(content)
    }

    return String(content)
  }

  const renderStructuredContent = () => {
    if (typeof content !== "object") return null

    switch (content.type) {
      case "date_picker":
        return (
          <div className="mt-2 bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 text-sm">{content.message}</span>
            </div>
            <DatePicker
              selected={null}
              onChange={(date) => onDateSelect && onDateSelect(content.field, date)}
              dateFormat="yyyy-MM-dd"
              minDate={new Date()}
              className="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select a date"
            />
          </div>
        )

      case "leave_type_selection":
        return (
          <div className="mt-2 bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 text-sm">{content.message}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {content.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onDateSelect && onDateSelect("leave_type", option.value)}
                  className="p-2 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case "leave_type_selection_for_apply":
        return (
          <div className="mt-2 bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 text-sm">{content.message}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {content.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onSelectLeaveTypeForApply && onSelectLeaveTypeForApply(option.value)}
                  className="p-2 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case "leave_confirmation":
        let details
        try {
          details = typeof content.details === "string" ? JSON.parse(content.details) : content.details
        } catch (error) {
          console.error("Failed to parse details:", error)
          details = content.details || {}
        }

        return (
          <div className="mt-2 p-3 mb-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-gray-100 dark:border-gray-700 inner-bubble transition-all duration-300 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-800 dark:text-white text-sm">Leave Request Details</span>
            </div>
            <div className="space-y-2 text-sm">
              {details.user_id && (
                <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                  <span className="text-gray-700 dark:text-gray-300">User ID</span>
                  <span className="font-medium text-blue-900 dark:text-blue-300">{details.user_id}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <span className="text-gray-700 dark:text-gray-300">Start Date</span>
                <span className="font-medium text-blue-900 dark:text-blue-300">{details.startDate}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <span className="text-gray-700 dark:text-gray-300">End Date</span>
                <span className="font-medium text-blue-900 dark:text-blue-300">{details.endDate}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <span className="text-gray-700 dark:text-gray-300">Type</span>
                <span className="font-medium text-blue-900 dark:text-blue-300">
                  {details.Leave_type === "CL"
                    ? "Casual Leave"
                    : details.Leave_type === "PL"
                      ? "Privilege Leave"
                      : details.Leave_type === "SL"
                        ? "Sick Leave"
                        : details.Leave_type}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <span className="text-gray-700 dark:text-gray-300">Reason</span>
                <span className="font-medium text-blue-900 dark:text-blue-300">{details.reason}</span>
              </div>
              {details.half_day === "Y" && (
                <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                  <span className="text-gray-700 dark:text-gray-300">Duration</span>
                  <span className="font-medium text-blue-900 dark:text-blue-300">Half Day</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2 justify-end p-2">
              <button
                disabled={actionClicked !== ""}
                onClick={() => {
                  if (!actionClicked) {
                    setActionClicked("cancelled");
                    onSend && onSend("N");
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium ${
                  actionClicked === "cancelled" 
                    ? "text-red-600 bg-red-50 border border-red-200" 
                    : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                } rounded-lg transition-all duration-300`}
              >
                {actionClicked === "cancelled" ? (
                  <span className="flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancelled
                  </span>
                ) : "Cancel"}
              </button>
              <button
                disabled={actionClicked !== ""}
                onClick={() => {
                  if (!actionClicked) {
                    setActionClicked("confirmed");
                    onSend && onSend("Y");
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium ${
                  actionClicked === "confirmed" 
                    ? "text-white bg-green-600" 
                    : "text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
                } rounded-lg transition-all duration-300`}
              >
                {actionClicked === "confirmed" ? (
                  <span className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Confirmed
                  </span>
                ) : "Confirm"}
              </button>
            </div>
          </div>
        )


      case "leave_balance":
        return (
          <div className="mt-2 bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 text-sm font-medium">Leave Balance Details</span>
            </div>
            <div className="space-y-2">
              {Object.entries(content.data).map(([key, value]) => {
                const percentage = Math.min(100, (value.leave_balance / 30) * 100)
                return (
                  <div
                    key={key}
                    className="p-2 bg-white border rounded-lg hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">{value.leave_type}</span>
                      <span className="text-sm font-medium text-blue-600">{value.leave_balance} days</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case "leave_response":
        const isSuccess = content.status === "success"
        return (
          <div className={`mt-2 p-3 rounded-lg ${isSuccess ? "bg-red-50" : "bg-green-50"}`}>
            <div className="flex items-center gap-2">
              {isSuccess ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              <span className={`text-sm ${isSuccess ? "text-red-700" : "text-green-700"}`}>
                {content.message}
              </span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"} group`}>
      {renderAvatar()}
      <div className={`flex-1 ${isBot ? "pr-12" : "pl-12"}`}>
        {showTimestamp && (
          <div className={`text-xs text-gray-400 mb-1 ${isBot ? "" : "text-right"}`}>
            {formatTimestamp(timestamp)}
          </div>
        )}
        <div
          className={`p-3 rounded-lg ${
            isBot
              ? "bg-gray-100 text-gray-700"
              : "bg-blue-600 text-white"
          }`}
        >
          {renderMessageContent()}
        </div>
        {renderStructuredContent()}
      </div>
    </div>
  )
}
