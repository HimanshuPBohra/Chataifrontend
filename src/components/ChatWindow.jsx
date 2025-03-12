"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import Message from "./Message"
import { ChevronLeft, Send, Calendar, Clock, FileText, Home, MessageSquare, Trash2 } from "lucide-react"
import "react-datepicker/dist/react-datepicker.css"
import botBrandLogo from "../assets/uknowva.png" // Import the bot logo
import ThemeToggle from "./ThemeToggle"
// Change this constant to your server's IP or domain as needed
const API_URL = "https://aichat.uknowva-stage.in";
const MAX_HISTORY_LENGTH = 50; // Maximum number of messages to keep in history

const QUICK_ACTIONS = [
  {
    label: "Apply Leave",
    icon: Calendar,
    query: "apply_leave",
    description: "Submit a new leave request"
  },
  {
    label: "Leave Balance",
    icon: Clock,
    query: "leave balance",
    description: "Check your available leave days"
  },
  {
    label: "Cancel Leave",
    icon: Trash2,
    query: "cancel leave",
    description: "Cancel an existing leave request"
  },
  {
    label: "Salary Slip",
    icon: FileText,
    query: "salary slip",
    description: "View your salary slip"
  }
]

const WELCOME_MESSAGES = [
  "Hi there! 👋 How can I assist you today? 😊",
  "Hello! 😊 I'm here to help you with your queries. 🙂",
  "Welcome! 🤗 What can I do for you today? 😀",
  "Greetings! 👋 How may I help you? 😃"
]

export default function Chatbot({
  botBrandLogoPath = botBrandLogo, // Use the imported bot logo
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [conversationId, setConversationId] = useState(null)
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
  const chatAreaRef = useRef(null)

  // Load conversation history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages")
    const savedConversationId = localStorage.getItem("conversationId")
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    } else {
      // Add random welcome message for new conversations
      const welcomeMessage = {
        role: "bot",
        content: WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)],
        timestamp: new Date().toISOString(),
      }
      setMessages([welcomeMessage])
    }
    
    if (savedConversationId) {
      setConversationId(savedConversationId)
    } else {
      const newConversationId = `conv_${Date.now()}`
      setConversationId(newConversationId)
      localStorage.setItem("conversationId", newConversationId)
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      // Keep only the last MAX_HISTORY_LENGTH messages
      const messageHistory = messages.slice(-MAX_HISTORY_LENGTH)
      localStorage.setItem("chatMessages", JSON.stringify(messageHistory))
    }
  }, [messages])

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedBefore")
    if (!hasVisited) {
      setShowTour(true)
      localStorage.setItem("hasVisitedBefore", "true")
    }
  }, [])

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Clear chat history
  const clearHistory = () => {
    setMessages([])
    localStorage.removeItem("chatMessages")
    const newConversationId = `conv_${Date.now()}`
    setConversationId(newConversationId)
    localStorage.setItem("conversationId", newConversationId)
    
    // Add welcome message
    const welcomeMessage = {
      role: "bot",
      content: "Hi! How can I help you today?",
      timestamp: new Date().toISOString(),
    }
    setMessages([welcomeMessage])
  }

  // Get conversation context for better responses
  const getConversationContext = () => {
    // Get last 5 messages for context, preserving emoji and line breaks
    const contextMessages = messages.slice(-5).map(msg => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : msg.content.message || "",
    }))
    
    return contextMessages
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
        {
          role: "bot",
          content: {
            type: "date_picker",
            field: "endDate",
            message: "Select end date:",
          },
          timestamp: new Date().toISOString(),
        },
      ])
    } else if (field === "endDate") {
      setCurrentStep("reason")
      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          content: "Please provide reason for leave:",
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }

  const handleLeaveApplication = async () => {
    setCurrentStep("leave_type")
    setMessages(prev => [
      ...prev,
      {
        role: "bot",
        content:
          "Please select the type of leave you wish to apply for: Casual Leave (CL), Privilege Leave (PL), or Sick Leave (SL).",
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
            message: "Select leave type to check:",
            options: [
              { label: "All Types", value: "" },
              { label: "Casual Leave (CL)", value: "CL" },
              { label: "Privilege Leave (PL)", value: "PL" },
              { label: "Sick Leave (SL)", value: "SL" },
            ],
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
        const policyData = response.data.data;
        const botMessage = {
          role: "bot",
          content: `Leave Policy:\n${policyData}`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          role: "bot",
          content: "Failed to fetch leave policy. Please try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        role: "bot",
        content: "Failed to fetch leave policy. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }

  const processLeaveApplication = async () => {
    try {
      const formattedData = {
        ...leaveData,
        startDate: leaveData.startDate ? leaveData.startDate.toISOString().split("T")[0] : null,
        endDate: leaveData.endDate ? leaveData.endDate.toISOString().split("T")[0] : null,
      }
      const response = await axios.post(`${API_URL}/apply_leave`, formattedData)
      const botMessage = {
        role: "bot",
        content: {
          type: "leave_response",
          status: response.data.status === "success" ? "success" : "error",
          message: response.data.message,
        },
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage = {
        role: "bot",
        content: {
          type: "leave_response",
          status: "error",
          message: "Failed to submit leave application. Please try again.",
        },
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
    setCurrentStep(null)
    setLeaveData({
      startDate: null,
      endDate: null,
      user_id: "169",
      Leave_type: "",
      reason: "",
      half_day: "N",
    })
  }

  const processLeaveBalance = async (selectedType) => {
    const leaveType = selectedType !== undefined ? selectedType : leaveData.leave_type || ""
    try {
      const payload = {
        user_id: leaveData.user_id,
        leave_type: leaveType,
      }
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
const botMessage = {
  role: "bot",
  content: combinedLeaveBalanceMessage,
  timestamp: new Date().toISOString(),
}
        setMessages(prev => [...prev, botMessage])
      } else {
        const errorMessage = {
          role: "bot",
          content: "Failed to fetch leave balance. Please try again.",
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage = {
        role: "bot",
        content: "Failed to fetch leave balance. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setCurrentStep(null)
      setLeaveData(prev => ({ ...prev, leave_type: "" }))
    }
  }

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return

    const userMessage = { role: "user", content: messageText, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    const normalizedMessage = messageText.toLowerCase().trim();
    if (normalizedMessage === "apply_leave") {
      handleLeaveApplication();
      setLoading(false);
      return;
    }
    if (normalizedMessage === "leave balance") {
      handleLeaveBalance();
      setLoading(false);
      return;
    }
    if (normalizedMessage === "leave policy") {
      handleLeavePolicy();
      setLoading(false);
      return;
    }

    // ADDED: currentStep handling logic from old Chatwindow.jsx
    if (currentStep) {
      switch (currentStep) {
        case "leave_type":
          setLeaveData(prev => ({ ...prev, Leave_type: messageText.toUpperCase() }));
          setCurrentStep("start_date");
          setMessages(prev => [...prev, {
            role: "bot",
            content: {
              type: "date_picker",
              field: "startDate",
              message: "Select start date:"
            },
            timestamp: new Date().toISOString()
          }]);
          break;

        case "reason":
          setLeaveData(prev => ({ ...prev, reason: messageText }));
          setCurrentStep("half_day");
          setMessages(prev => [...prev, {
            role: "bot",
            content: "Is this a half day leave? (Y/N):",
            timestamp: new Date().toISOString()
          }]);
          break;

        case "half_day":
          const updatedLeaveData = { ...leaveData, half_day: messageText.toUpperCase() };
          setLeaveData(updatedLeaveData);
          setCurrentStep("confirm");
          setMessages(prev => [...prev, {
            role: "bot",
            content: {
              type: "leave_confirmation",
              details: JSON.stringify({
                ...updatedLeaveData,
                startDate: updatedLeaveData.startDate ? leaveData.startDate.toISOString().split('T')[0] : null,
                endDate: updatedLeaveData.endDate ? leaveData.endDate.toISOString().split('T')[0] : null
              }),
              message: "Please confirm your leave application (Y/N):"
            },
            timestamp: new Date().toISOString()
          }]);
          break;

        case "confirm":
          if (messageText.toLowerCase() === 'y' || messageText.toLowerCase() === 'yes') {
            const confirmationMessages = messages.filter(
              msg => msg.role === "bot" && msg.content?.type === "leave_confirmation"
            );
            const latestConfirmationMessage = confirmationMessages[confirmationMessages.length - 1];

            let dataToSubmit = leaveData;
            if (latestConfirmationMessage && latestConfirmationMessage.content.details) {
              try {
                dataToSubmit = JSON.parse(latestConfirmationMessage.content.details);
              } catch (e) {
                console.error("Error parsing confirmation details:", e);
              }
            }

            try {
              const response = await axios.post(`${API_URL}/apply_leave`, dataToSubmit);
              const botMessage = {
                role: "bot",
                content: {
                  type: "leave_response",
                  status: response.data.status === "success" ? "success" : "error",
                  message: response.data.message
                },
                timestamp: new Date().toISOString()
              };
              setMessages(prev => [...prev, botMessage]);
            } catch (error) {
              const errorMessage = {
                role: "bot",
                content: {
                  type: "leave_response",
                  status: "error",
                  message: "Failed to submit leave application. Please try again."
                },
                timestamp: new Date().toISOString()
              };
              setMessages(prev => [...prev, errorMessage]);
            } finally {
              setCurrentStep(null);
              setLeaveData({
                startDate: null,
                endDate: null,
                user_id: "169",
                Leave_type: "",
                reason: "",
                half_day: "N"
              });
              setLoading(false);
            }
          } else if (messageText.toLowerCase() === 'n' || messageText.toLowerCase() === 'no') {
            setMessages(prev => [...prev, {
              role: "bot",
              content: "Leave application cancelled.",
              timestamp: new Date().toISOString()
            }]);
            setCurrentStep(null);
            setLeaveData({
              startDate: null,
              endDate: null,
              user_id: "169",
              Leave_type: "",
              reason: "",
              half_day: "N"
            });
            setLoading(false);
          }
          break;

        case "balance_type":
          const leaveType = messageText.toUpperCase();
          if (["CL", "PL", "SL", ""].includes(leaveType)) {
            setLeaveData(prev => ({ ...prev, leave_type: leaveType }));
            await processLeaveBalance(leaveType);
          } else {
            setMessages(prev => [...prev, {
              role: "bot",
              content: "Invalid leave type. Please select from the options above.",
              timestamp: new Date().toISOString()
            }]);
          }
          break;

        default:
          break;
      }
      setLoading(false);
    }
    // END ADDED: currentStep handling logic from old Chatwindow.jsx
    else { // Existing else block for general chat messages in new code
      try {
        const context = getConversationContext()
        const response = await axios.post(`${API_URL}/chat`, {
          question: messageText,
          conversation_id: conversationId,
          context: context
        })
        const answerContent = response.data.answer
        if (!answerContent) {
          setMessages(prev => [...prev, { role: "bot", content: "Sorry, I did not receive a valid response. Please try again. 😕", timestamp: new Date().toISOString() }])
        } else if (typeof answerContent === "object" && answerContent.type === "leave_confirmation") {
          const botMessage = {
            role: "bot",
            content: {
              type: "leave_confirmation",
              details: JSON.stringify(answerContent.details),
              message: "Please confirm your leave application (Y/N):",
            },
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, botMessage])
          setCurrentStep("confirm")
        } else {
          const botMessage = {
            role: "bot",
            content: answerContent,
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, botMessage])
        }
      } catch (error) {
        const errorMessage = {
          role: "bot",
          content: `Sorry, I encountered an error: ${error.message}. Please try again. 😟`,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setLoading(false)
      }
    }
  }

  const WelcomeTour = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md">
        <h2 className="text-2xl font-bold mb-4">Welcome to Your HR Assistant! 👋</h2>
        <div className="space-y-4">
          <p>Here's what you can do:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Apply for leave</li>
            <li>Check leave balance</li>
            <li>Cancel leave requests</li>
            <li>Get your salary slip</li>
            <li>Ask any HR-related questions</li>
          </ul>
        </div>
        <button
          onClick={() => setShowTour(false)}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  )

  const handleConfirmation = async (response) => {
    if(response.toLowerCase() === 'y' || response.toLowerCase() === 'yes') {
      const confirmationMessages = messages.filter(
        msg => msg.role === "bot" && msg.content?.type === "leave_confirmation"
      );
      const latestConfirmationMessage = confirmationMessages[confirmationMessages.length - 1];
      let dataToSubmit = leaveData;
      if (latestConfirmationMessage && latestConfirmationMessage.content.details) {
        try {
          dataToSubmit = JSON.parse(latestConfirmationMessage.content.details);
        } catch (e) {
          console.error("Error parsing confirmation details:", e);
        }
      }
      try {
        setLoading(true);
        const responseServer = await axios.post(`${API_URL}/apply_leave`, dataToSubmit);
        const botMessage = {
          role: "bot",
          content: {
            type: "leave_response",
            status: responseServer.data.status === "success" ? "success" : "error",
            message: responseServer.data.message
          },
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        const errorMessage = {
          role: "bot",
          content: {
            type: "leave_response",
            status: "error",
            message: "Failed to submit leave application. Please try again."
          },
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setCurrentStep(null);
        setLeaveData({
          startDate: null,
          endDate: null,
          user_id: "169",
          Leave_type: "",
          reason: "",
          half_day: "N"
        });
        setLoading(false);
      }
    } else if(response.toLowerCase() === 'n' || response.toLowerCase() === 'no') {
      setMessages(prev => [...prev, {
        role: "bot",
        content: "Leave application cancelled.",
        timestamp: new Date().toISOString()
      }]);
      setCurrentStep(null);
      setLeaveData({
        startDate: null,
        endDate: null,
        user_id: "169",
        Leave_type: "",
        reason: "",
        half_day: "N"
      });
      setLoading(false);
    }
  }

  // Enhanced typing indicator
  const TypingIndicator = () => (
    <div className="flex items-center space-x-2 p-4 bg-gray-100 rounded-2xl max-w-[200px]">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
      <span className="text-sm text-gray-500">Assistant is typing...</span>
    </div>
  )

  // Enhanced quick actions
  const QuickAction = ({ action, onClick }) => (
    <button
      onClick={onClick}
      className="group w-full flex items-center justify-between p-4 bg-white rounded-3xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
          <action.icon className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-left">
          <span className="block text-gray-800 font-medium group-hover:text-blue-600 transition-colors">{action.label}</span>
          <span className="text-sm text-gray-500">{action.description}</span>
        </div>
      </div>
      <ChevronLeft className="w-6 h-6 text-gray-400 transform rotate-180 transition-transform group-hover:translate-x-1" />
    </button>
  )

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showTour && <WelcomeTour />}
      {!showChat ? (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-2xl p-6 max-w-md transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="relative">
              <img src={botBrandLogoPath} alt="Bot Logo" className="w-12 h-12" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">How can I assist you? 😊</h2>
          </div>
          
          <div className="space-y-4 mb-6">
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
            className="w-full bg-blue-600 text-white py-4 rounded-2xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2 mb-6"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Start Chat</span>
          </button>

          <div className="flex justify-center space-x-8 pt-4 border-t border-gray-200">
            <button onClick={() => window.location.href="https://uknowva.com"} className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors">
              <Home className="w-6 h-6" />
              <span className="text-sm mt-1">Home</span>
            </button>
            <button onClick={() => window.location.href="https://uknowva.com/contact-us"} className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors">
              <MessageSquare className="w-6 h-6" />
              <span className="text-sm mt-1">Contact</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg md:max-w-xl h-[600px] flex flex-col">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-3xl flex justify-between items-center">
            <button 
              onClick={() => setShowChat(false)}
              className="hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <img src={botBrandLogoPath} alt="Bot Logo" className="w-8 h-8" />
              <h2 className="font-semibold text-xl">HR Assistant</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearHistory}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Clear chat history"
              >
                <Trash2 className="w-6 h-6" />
              </button>
              <ThemeToggle />
            </div>
          </div>

          <div
            ref={chatAreaRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.map((message, index) => (
              <Message
                key={`${message.timestamp}-${index}`}
                message={message}
                onDateSelect={handleDateSelect}
                onSend={handleConfirmation}
                showTimestamp={true}
              />
            ))}
            {loading && <TypingIndicator />}
          </div>

          <div className="p-4 border-t bg-white rounded-b-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-4 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                disabled={loading}
              />
              <button
                type="submit"
                className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.05]"
                disabled={loading || !input.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
