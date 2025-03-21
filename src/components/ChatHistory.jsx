"use client"

import { useState } from "react"
import { ChevronRight, MessageSquare, Trash2, Search, Calendar, Clock } from "lucide-react"

export default function ChatHistory({ 
  conversations = [], 
  currentConversationId, 
  onSelectConversation, 
  onDeleteConversation,
  onClose
}) {
  const [searchTerm, setSearchTerm] = useState("")
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    // If no search term, show all conversations
    if (!searchTerm.trim()) return true
    
    // Search in conversation title or first message
    const searchLower = searchTerm.toLowerCase()
    return (
      (conv.title && conv.title.toLowerCase().includes(searchLower)) || 
      (conv.messages && 
       conv.messages.length > 0 && 
       typeof conv.messages[0].content === 'string' && 
       conv.messages[0].content.toLowerCase().includes(searchLower))
    )
  })

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return ""
    
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString()
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  // Get conversation title or generate one from first message
  const getConversationTitle = (conversation) => {
    if (conversation.title && conversation.title !== "New Conversation") return conversation.title
    
    if (conversation.messages && conversation.messages.length > 0) {
      const firstMessage = conversation.messages.find(msg => msg.role === "user")
      if (firstMessage && typeof firstMessage.content === 'string') {
        // Truncate long messages
        const content = firstMessage.content
        return content.length > 30 ? content.substring(0, 30) + "..." : content
      }
    }
    
    return "New Conversation"
  }

  // Get time of the last message
  const getLastMessageTime = (conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1]
      return lastMessage.timestamp ? formatDate(lastMessage.timestamp) : formatDate(conversation.id)
    }
    return formatDate(conversation.id)
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full p-3 pl-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue bg-neutral-50 shadow-sm transition-all duration-300"
          />
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-neutral-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 animate-fadeIn">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-blue-light to-primary-green-light rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <p className="text-lg font-medium text-neutral-700">No conversations found</p>
            <p className="text-sm">Start a new chat to begin</p>
          </div>
        ) : (
          filteredConversations.map((conversation, index) => (
            <div 
              key={conversation.id}
              className={`p-3 rounded-xl cursor-pointer transition-all duration-300 flex justify-between group hover:shadow-md animate-fadeIn ${
                conversation.id === currentConversationId 
                  ? "bg-gradient-to-r from-primary-blue-light/20 to-primary-green-light/20 border border-primary-blue-light/40" 
                  : "bg-white hover:bg-neutral-50 border border-neutral-200"
              }`}
              onClick={() => onSelectConversation(conversation.id)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg mr-2 flex items-center justify-center ${
                    conversation.id === currentConversationId 
                      ? "bg-gradient-to-br from-primary-blue to-primary-green" 
                      : "bg-neutral-100"
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${
                      conversation.id === currentConversationId ? "text-white" : "text-neutral-500"
                    }`} />
                  </div>
                  <h3 className={`font-medium truncate ${
                    conversation.id === currentConversationId ? "text-primary-blue-dark" : "text-neutral-800"
                  }`}>
                    {getConversationTitle(conversation)}
                  </h3>
                </div>
                <div className="flex items-center mt-2 ml-10">
                  <Clock className="w-3 h-3 text-neutral-400 mr-1" />
                  <p className="text-xs text-neutral-500">
                    {getLastMessageTime(conversation)}
                  </p>
                </div>
                {conversation.messages && conversation.messages.length > 0 && (
                  <div className="flex items-center mt-1 ml-10">
                    <p className="text-xs px-1.5 py-0.5 bg-neutral-100 rounded-full text-neutral-500">
                      {conversation.messages.length} messages
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteConversation(conversation.id)
                }}
                className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                aria-label="Delete conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
