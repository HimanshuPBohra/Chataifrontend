"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import Message from "./Message"
import ChatHistory from "./ChatHistory"
import QuickAction from "./QuickAction"
import TypingIndicator from "./TypingIndicator"
import WelcomeTour from "./WelcomeTour"
import { ChevronLeft, Send, Calendar, Clock, FileText, Home, MessageSquare, Trash2, History, X, ChevronRight, HelpCircle, User } from "lucide-react"
import "react-datepicker/dist/react-datepicker.css"
import botBrandLogo from "../assets/uknowva.png"

const API_URL = "https://aichat.uknowva-stage.in"
const MAX_HISTORY_LENGTH = 50

const QUICK_ACTIONS = [
  { label: "Apply Leave", icon: Calendar, query: "apply_leave", description: "Submit a new leave request" },
  { label: "Leave Balance", icon: Clock, query: "leave balance", description: "Check your available leave days" },
  { label: "Cancel Leave", icon: Trash2, query: "cancel leave", description: "Cancel an existing leave request" },
  { label: "Leave History", icon: FileText, query: "Leave history", description: "View your Leave History" }
]

const WELCOME_MESSAGES = [
  "Hi there! 👋 How can I assist you today? 😊",
  "Hello! 😊 I'm here to help you with your queries. 🙂",
  "Welcome! 🤗 What can I do for you today? 😀",
  "Greetings! 👋 How may I help you? 😃"
]

const SUGGESTED_RESPONSES = [
  "Tell me about my leave balance",
  "How do I apply for leave?",
  "What's the leave policy?",
  "Who is my reporting manager?"
]

export default function Chatbot({ botBrandLogoPath = botBrandLogo }) {
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [leaveData, setLeaveData] = useState({
    startDate: null,
    endDate: null,
    user_id: "169",
    Leave_type: "",
    reason: "",
    half_day: "N",
  })
  const [currentStep, setCurrentStep] = useState(null)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [showTour, setShowTour] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState(false)
  const [showSuggestedResponses, setShowSuggestedResponses] = useState(true)
  const chatAreaRef = useRef(null)
  const [showHistory, setShowHistory] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedBefore")
    if (!hasVisited) {
      setShowTour(true)
      localStorage.setItem("hasVisitedBefore", "true")
    }
    setTimeout(() => setAnimateIn(true), 100)
  }, [])

  useEffect(() => {
    const savedConversations = localStorage.getItem("conversations")
    if (savedConversations) {
      const parsedConversations = JSON.parse(savedConversations)
      setConversations(parsedConversations)
      if (parsedConversations.length > 0) {
        setCurrentConversationId(parsedConversations[parsedConversations.length - 1].id)
        setMessages(parsedConversations[parsedConversations.length - 1].messages)
      }
    } else {
      const newConversation = { id: Date.now(), title: "New Conversation", messages: [] }
      setConversations([newConversation])
      setCurrentConversationId(newConversation.id)
      setMessages([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations))
  }, [conversations])

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  useEffect(() => {
    if (messages.length > 1) setShowSuggestedResponses(false)
  }, [messages])

  useEffect(() => {
    if (showChat && messages.length === 0) {
      setMessages([{ role: "bot", content: "Thank you for visiting us. What would you like to do?", timestamp: new Date().toISOString() }])
      setShowSuggestedResponses(true)
    }
  }, [showChat, messages.length])

  const clearHistory = () => {
    const newConversation = { id: Date.now(), title: "New Conversation", messages: [] }
    setConversations(prev => [...prev, newConversation])
    setCurrentConversationId(newConversation.id)
    setMessages([])
    setShowSuggestedResponses(true)
  }

  const getConversationContext = () => {
    return messages.slice(-5).map(msg => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : msg.content.message || "",
    }))
  }

  const handleDateSelect = async (field, value) => {
    if (field === "leave_type") {
      setLeaveData(prev => ({ ...prev, leave_type: value }))
      await processLeaveBalance(value)
      return
    }
    setLeaveData(prev => ({ ...prev, [field]: value }))
    if (field === "startDate") {
      setCurrentStep("end_date")
      setMessages(prev => [
        ...prev,
        { role: "bot", content: { type: "date_picker", field: "endDate", message: "Select end date:" }, timestamp: new Date().toISOString() },
      ])
    } else if (field === "endDate") {
      setCurrentStep("reason")
      setMessages(prev => [
        ...prev,
        { role: "bot", content: "Please provide reason for leave:", timestamp: new Date().toISOString() },
      ])
    }
  }

  const handleLeaveApplication = async () => {
    setCurrentStep("leave_type")
    setMessages(prev => [
      ...prev,
      {
        role: "bot",
        content: "Please select the type of leave you wish to apply for: Casual Leave (CL), Privilege Leave (PL), or Sick Leave (SL).",
        timestamp: new Date().toISOString(),
      },
    ])
  }

  const handleLeaveBalance = async (leaveType = "") => {
    if (leaveType) {
      setLeaveData(prev => ({ ...prev, leave_type: leaveType }))
      await processLeaveBalance(leaveType)
    } else {
      setCurrentStep("balance_type")
      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          content: {
            type: "leave_type_selection",
            message: "Select leave type to check balance:",
            options: [
              { label: "Casual Leave (CL)", value: "CL" },
              { label: "Privilege Leave (PL)", value: "PL" },
              { label: "Sick Leave (SL)", value: "SL" },
              { label: "All Leave Types", value: "" }
            ]
          },
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }

  const handleLeavePolicy = async () => {
    try {
      const response = await axios.get(`${API_URL}/leave_policy`)
      if (response.data.status) {
        const policyData = response.data.data
        const botMessage = { role: "bot", content: `Leave Policy:\n${policyData}`, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, botMessage])
      } else {
        const errorMessage = { role: "bot", content: "Failed to fetch leave policy. Please try again.", timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage = { role: "bot", content: "Failed to fetch leave policy. Please try again.", timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const processLeaveBalance = async (selectedType) => {
    const leaveType = selectedType !== undefined ? selectedType : leaveData.leave_type || ""
    try {
      const payload = { user_id: leaveData.user_id, leave_type: leaveType }
      const response = await axios.post(`${API_URL}/leave_balance`, payload)
      if (response.data.status) {
        const leaveDetails = response.data.data
        let combinedLeaveBalanceMessage = "<table class='min-w-full bg-white shadow-md rounded-lg overflow-hidden'><thead class='bg-blue-500 text-white'><tr><th class='py-2'>Leave Type</th><th class='py-2'>Balance</th></tr></thead><tbody class='bg-gray-100'>"
        if (leaveType === "") {
          combinedLeaveBalanceMessage += Object.keys(leaveDetails).map(key => {
            return `<tr class='hover:bg-blue-100'><td class='border px-4 py-2'>${leaveDetails[key].leave_type}</td><td class='border px-4 py-2'>${leaveDetails[key].leave_balance}</td></tr>`
          }).join("")
        } else {
          const leaveTypeKey = Object.keys(leaveDetails)[0]
          const detail = leaveDetails[leaveTypeKey]
          combinedLeaveBalanceMessage += `<tr class='hover:bg-blue-100'><td class='border px-4 py-2'>${detail.leave_type}</td><td class='border px-4 py-2'>${detail.leave_balance}</td></tr>`
        }
        combinedLeaveBalanceMessage += "</tbody></table>"
        const botMessage = { role: "bot", content: combinedLeaveBalanceMessage, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, botMessage])
      } else {
        const errorMessage = { role: "bot", content: "Failed to fetch leave balance. Please try again.", timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage = { role: "bot", content: "Failed to fetch leave balance. Please try again.", timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setCurrentStep(null)
      setLeaveData(prev => ({ ...prev, leave_type: "" }))
    }
  }

  const handleConfirmation = () => {
    // Placeholder for any confirmation handling if needed
  }

  const handleSuggestedResponseClick = (response) => {
    setInput(response)
    sendMessage(response)
  }

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return
    setLoading(true)
    setInput("")
    const userMessage = { role: "user", content: messageText, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])

    if (currentStep) {
      switch (currentStep) {
        case "leave_type":
          setLeaveData(prev => ({ ...prev, Leave_type: messageText.toUpperCase() }))
          setCurrentStep("start_date")
          setMessages(prev => [...prev, {
            role: "bot",
            content: { type: "date_picker", field: "startDate", message: "Select start date:" },
            timestamp: new Date().toISOString()
          }])
          break
        case "reason":
          setLeaveData(prev => ({ ...prev, reason: messageText }))
          setCurrentStep("half_day")
          setMessages(prev => [...prev, {
            role: "bot",
            content: "Is this a half day leave? (Y/N):",
            timestamp: new Date().toISOString()
          }])
          break
        case "half_day":
          const updatedLeaveData = { ...leaveData, half_day: messageText.toUpperCase() }
          setLeaveData(updatedLeaveData)
          setCurrentStep("confirm")
          setMessages(prev => [...prev, {
            role: "bot",
            content: {
              type: "leave_confirmation",
              details: JSON.stringify({
                ...updatedLeaveData,
                startDate: updatedLeaveData.startDate ? updatedLeaveData.startDate.toISOString().split('T')[0] : null,
                endDate: updatedLeaveData.endDate ? updatedLeaveData.endDate.toISOString().split('T')[0] : null
              }),
              message: "Please confirm your leave application (Y/N):"
            },
            timestamp: new Date().toISOString()
          }])
          break
        case "confirm":
          if (messageText.toLowerCase() === 'y' || messageText.toLowerCase() === 'yes') {
            const confirmationMessages = messages.filter(msg => msg.role === "bot" && msg.content?.type === "leave_confirmation")
            const latestConfirmationMessage = confirmationMessages[confirmationMessages.length - 1]
            let dataToSubmit = leaveData
            if (latestConfirmationMessage && latestConfirmationMessage.content.details) {
              try {
                dataToSubmit = JSON.parse(latestConfirmationMessage.content.details)
              } catch (e) {
                console.error("Error parsing confirmation details:", e)
              }
            }
            try {
              const response = await axios.post(`${API_URL}/apply_leave`, dataToSubmit)
              const botMessage = {
                role: "bot",
                content: { type: "leave_response", status: response.data.status === "success" ? "success" : "error", message: response.data.message },
                timestamp: new Date().toISOString()
              }
              setMessages(prev => [...prev, botMessage])
            } catch (error) {
              const errorMessage = {
                role: "bot",
                content: { type: "leave_response", status: "error", message: "Failed to submit leave application. Please try again." },
                timestamp: new Date().toISOString()
              }
              setMessages(prev => [...prev, errorMessage])
            } finally {
              setCurrentStep(null)
              setLeaveData({ startDate: null, endDate: null, user_id: "169", Leave_type: "", reason: "", half_day: "N" })
              setLoading(false)
            }
          } else if (messageText.toLowerCase() === 'n' || messageText.toLowerCase() === 'no') {
            setMessages(prev => [...prev, { role: "bot", content: "Leave application cancelled.", timestamp: new Date().toISOString() }])
            setCurrentStep(null)
            setLeaveData({ startDate: null, endDate: null, user_id: "169", Leave_type: "", reason: "", half_day: "N" })
            setLoading(false)
          }
          break
        case "balance_type":
          const leaveType = messageText.toUpperCase()
          if (["CL", "PL", "SL", ""].includes(leaveType)) {
            setLeaveData(prev => ({ ...prev, leave_type: leaveType }))
            await processLeaveBalance(leaveType)
          } else {
            setMessages(prev => [...prev, { role: "bot", content: "Invalid leave type. Please select from the options above.", timestamp: new Date().toISOString() }])
          }
          break
        default:
          break
      }
      setLoading(false)
    } else {
      try {
        const context = getConversationContext()
        setTypingIndicator(true)
        setTimeout(async () => {
          try {
            const response = await axios.post(`${API_URL}/chat`, { question: messageText, conversation_id: currentConversationId, context })
            const answerContent = response.data.answer
            if (!answerContent) {
              setMessages(prev => [...prev, { role: "bot", content: "Sorry, I did not receive a valid response. Please try again. 😕", timestamp: new Date().toISOString() }])
            } else {
              const botMessage = { role: "bot", content: answerContent, timestamp: new Date().toISOString() }
              setMessages(prev => [...prev, botMessage])
            }
          } catch (error) {
            const errorMessage = { role: "bot", content: `Sorry, I encountered an error: ${error.message}. Please try again. 😟`, timestamp: new Date().toISOString() }
            setMessages(prev => [...prev, errorMessage])
          } finally {
            setTypingIndicator(false)
            setLoading(false)
          }
        }, 800)
      } catch (error) {
        const errorMessage = { role: "bot", content: `Sorry, I encountered an error: ${error.message}. Please try again. 😟`, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, errorMessage])
        setLoading(false)
      }
    }
  }

  const selectConversation = (conversationId) => {
    const selectedConversation = conversations.find(conv => conv.id === conversationId)
    if (selectedConversation) {
      setCurrentConversationId(conversationId)
      setMessages(selectedConversation.messages)
      setShowHistory(false)
    }
  }

  const deleteConversation = (conversationId) => {
    const updatedConversations = conversations.filter(conv => conv.id !== conversationId)
    setConversations(updatedConversations)
    if (conversationId === currentConversationId && updatedConversations.length > 0) {
      const lastConversation = updatedConversations[updatedConversations.length - 1]
      setCurrentConversationId(lastConversation.id)
      setMessages(lastConversation.messages)
    } else if (updatedConversations.length === 0) {
      clearHistory()
    }
  }

  useEffect(() => {
    setConversations(prev => prev.map(conv => conv.id === currentConversationId ? { ...conv, messages } : conv))
  }, [messages])

  const toggleMinimized = () => setMinimized(!minimized)

  return (
    <div 
      className={`fixed bottom-4 right-4 z-[9999] transition-all duration-500 ${animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} 
      style={{ width: minimized ? "auto" : "450px", maxWidth: "95vw", maxHeight: "calc(100vh - 32px)" }}
    >
      {showTour && <WelcomeTour />}
      
      {/* Minimized chat bubble */}
      {minimized && (
        <div 
          onClick={toggleMinimized}
          className="bg-blue-500 rounded-full shadow-lg p-4 cursor-pointer hover:bg-blue-600 transition-all duration-300"
        >
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
      )}
      
      {/* Main chat interface */}
      {!minimized && (
        <>
          {!showChat ? (
            <div className="bg-white rounded-2xl shadow-xl p-6 transition-all duration-500 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={botBrandLogoPath} alt="Bot Logo" className="w-14 h-14 rounded-xl" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">How can I help you today?</h2>
                </div>
                <button 
                  onClick={toggleMinimized} 
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {QUICK_ACTIONS.map((action, index) => (
                  <QuickAction
                    key={index}
                    action={action}
                    onClick={() => {
                      setShowChat(true)
                      setTimeout(() => sendMessage(action.query), 100)
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setShowChat(true)}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-all duration-300 flex items-center justify-center space-x-2 mb-4"
              >
                <MessageSquare className="w-5 h-5 text-white" />
                <span>Start Chat</span>
              </button>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={clearHistory}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-200"
                >
                  <Trash2 className="w-4 h-4 text-gray-700" />
                  <span>New Chat</span>
                </button>

                <button
                  onClick={() => setShowHistory(true)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-200"
                >
                  <History className="w-4 h-4 text-gray-700" />
                  <span>History</span>
                </button>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button onClick={() => window.location.href="https://uknowva.com"} className="flex flex-col items-center text-gray-600 hover:text-blue-500 transition-colors">
                  <Home className="w-5 h-5 text-gray-600" />
                  <span className="text-xs mt-1">Home</span>
                </button>
                <button onClick={() => window.location.href="https://uknowva.com/contact-us"} className="flex flex-col items-center text-gray-600 hover:text-blue-500 transition-colors">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <span className="text-xs mt-1">Contact</span>
                </button>
                <button className="flex flex-col items-center text-gray-600 hover:text-blue-500 transition-colors">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-xs mt-1">Account</span>
                </button>
                <button className="flex flex-col items-center text-gray-600 hover:text-blue-500 transition-colors">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-xs mt-1">Help</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl w-full h-[700px] flex flex-col overflow-hidden">
              <div className="p-4 bg-blue-500 text-white rounded-t-2xl flex justify-between items-center">
                <button
                  onClick={() => setShowChat(false)}
                  className="hover:bg-blue-600 p-2 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center space-x-3">
                  <img src={botBrandLogoPath} alt="Bot Logo" className="w-8 h-8 rounded-lg" />
                  <h2 className="font-medium text-xl text-white">HR Assistant</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearHistory}
                    className="p-2 rounded-full hover:bg-blue-600 transition-colors"
                    aria-label="Clear chat history"
                  >
                    <Trash2 className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={toggleMinimized}
                    className="p-2 rounded-full hover:bg-blue-600 transition-colors"
                    aria-label="Minimize chat"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <img src={botBrandLogoPath} alt="Bot Logo" className="w-20 h-20 mb-4 animate-pulse" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Welcome to HR Assistant</h3>
                    <p className="text-gray-500 mb-6 text-lg">Ask me anything about your HR needs and I'll help you out!</p>
                    <div className="w-full max-w-sm">
                      {WELCOME_MESSAGES.length > 0 && (
                        <div className="bg-blue-100 p-3 rounded-2xl shadow-sm mb-4">
                          <p className="text-gray-700">{WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <Message
                    key={`${message.timestamp}-${index}`}
                    message={message}
                    onDateSelect={handleDateSelect}
                    onSend={handleConfirmation}
                    showTimestamp={true}
                  />
                ))}
                
                {typingIndicator && <TypingIndicator />}
                
                {showSuggestedResponses && messages.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {SUGGESTED_RESPONSES.map((response, index) => (
                      <button 
                        key={index}
                        onClick={() => handleSuggestedResponseClick(response)}
                        className="bg-white hover:bg-gray-100 text-gray-700 text-sm py-2 px-4 rounded-full border border-gray-300 shadow-sm transition-all duration-300"
                      >
                        {response}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-white rounded-b-2xl">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !input.trim()}
                  >
                    <Send className="w-6 h-6 text-white" />
                  </button>
                </form>
                <div className="text-sm text-center mt-3 text-gray-400">
                  Powered by Uknowva AI
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-60">
          <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-lg h-5/6 flex flex-col overflow-hidden">
            <div className="p-4 bg-blue-500 text-white rounded-t-2xl flex justify-between items-center">
              <h2 className="text-xl font-medium">Chat History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="hover:bg-blue-600 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ChatHistory 
                conversations={conversations} 
                currentConversationId={currentConversationId}
                onSelectConversation={selectConversation}
                onDeleteConversation={deleteConversation}
                onClose={() => setShowHistory(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}