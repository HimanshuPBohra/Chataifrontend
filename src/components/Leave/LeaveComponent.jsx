"use client"

import { useState } from "react"
import axios from "axios"
import { Calendar, Trash2 } from "lucide-react"

const API_URL = "http://127.0.0.1:5000"
const MAX_HISTORY_LENGTH = 50

export default function LeaveComponent({ onLeaveUpdated }) {
  const [leaveData, setLeaveData] = useState({
    startDate: null,
    endDate: null,
    user_id: "169",
    Leave_type: "",
    reason: "",
    half_day: "N",
  })
  const [currentStep, setCurrentStep] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleDateSelect = async (field, value) => {
    if (field === "leave_type") {
      setLeaveData(prev => ({ ...prev, leave_type: value }))
      await processLeaveBalance(value)
      return
    }
    setLeaveData(prev => ({ ...prev, [field]: value }))
    if (field === "startDate") {
      setCurrentStep("end_date")
      onLeaveUpdated({
        role: "bot",
        content: {
          type: "date_picker",
          field: "endDate",
          message: "Select end date:",
        },
        timestamp: new Date().toISOString(),
      })
    } else if (field === "endDate") {
      setCurrentStep("reason")
      onLeaveUpdated({
        role: "bot",
        content: "Please provide reason for leave:",
        timestamp: new Date().toISOString(),
      })
    }
  }

  const handleLeaveApplication = async () => {
    setCurrentStep("leave_type")
    onLeaveUpdated({
      role: "bot",
      content:
        "Please select the type of leave you wish to apply for: Casual Leave (CL), Privilege Leave (PL), or Sick Leave (SL).",
      timestamp: new Date().toISOString(),
    })
  }

  const handleLeaveBalance = async (leaveType = "") => {
    if (leaveType) {
      setLeaveData(prev => ({ ...prev, leave_type: leaveType }))
      await processLeaveBalance(leaveType)
    } else {
      setCurrentStep("balance_type")
      onLeaveUpdated({
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
      })
    }
  }

  const handleLeavePolicy = async () => {
    try {
      const response = await axios.get(`${API_URL}/leave_policy`)
      if (response.data.status) {
        const policyData = response.data.data
        const botMessage = {
          role: "bot",
          content: `Leave Policy:\n${policyData}`,
          timestamp: new Date().toISOString(),
        }
        onLeaveUpdated(botMessage)
      } else {
        const errorMessage = {
          role: "bot",
          content: "Failed to fetch leave policy. Please try again.",
          timestamp: new Date().toISOString(),
        }
        onLeaveUpdated(errorMessage)
      }
    } catch (error) {
      const errorMessage = {
        role: "bot",
        content: "Failed to fetch leave policy. Please try again.",
        timestamp: new Date().toISOString(),
      }
      onLeaveUpdated(errorMessage)
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
      onLeaveUpdated(botMessage)
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
      onLeaveUpdated(errorMessage)
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
        onLeaveUpdated(botMessage)
      } else {
        const errorMessage = {
          role: "bot",
          content: "Failed to fetch leave balance. Please try again.",
          timestamp: new Date().toISOString(),
        }
        onLeaveUpdated(errorMessage)
      }
    } catch (error) {
      const errorMessage = {
        role: "bot",
        content: "Failed to fetch leave balance. Please try again.",
        timestamp: new Date().toISOString(),
      }
      onLeaveUpdated(errorMessage)
    } finally {
      setCurrentStep(null)
      setLeaveData(prev => ({ ...prev, leave_type: "" }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Apply Leave Button */}
      <button
        onClick={handleLeaveApplication}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Apply Leave
      </button>

      {/* Leave Balance Button */}
      <button
        onClick={() => handleLeaveBalance()}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
      >
        Check Leave Balance
      </button>

      {/* Leave Policy Button */}
      <button
        onClick={handleLeavePolicy}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
      >
        View Leave Policy
      </button>

      {/* Additional UI based on currentStep */}
      {currentStep === "leave_type" && (
        <div className="mt-4">
          {/* Leave Type Selection UI */}
          {/* Implement leave type selection */}
        </div>
      )}

      {currentStep === "balance_type" && (
        <div className="mt-4">
          {/* Leave Balance Type Selection UI */}
          {/* Implement leave balance type selection */}
        </div>
      )}

      {/* Add more conditional UIs as needed */}
    </div>
  )
}
