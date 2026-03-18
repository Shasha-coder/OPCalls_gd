/**
 * Provisioning Step
 */

'use client'

import { useState, useEffect } from 'react'
import { useProvisioningProgress } from '@/hooks/useProvisioning'

interface Props {
  jobId: string | null
  onComplete: () => void
  checkStatus: () => Promise<{ status: string; progress?: number; error?: string }>
}

const STEP_LABELS: Record<string, { label: string; icon: string }> = {
  create_subaccount: { label: 'Setting up phone system', icon: '📡' },
  create_sip_trunk: { label: 'Configuring voice routing', icon: '🔗' },
  search_phone_number: { label: 'Finding available numbers', icon: '🔍' },
  purchase_phone_number: { label: 'Securing your number', icon: '📞' },
  create_agent: { label: 'Creating AI agent', icon: '🤖' },
  bind_agent_to_number: { label: 'Connecting everything', icon: '✨' },
}

export function ProvisioningStep({ jobId, onComplete, checkStatus }: Props) {
  const { job, steps, progress, isComplete, isFailed, currentStep, failedStep, retry } = useProvisioningProgress(jobId)
  const [retrying, setRetrying] = useState(false)
  
  // Check completion
  useEffect(() => {
    if (isComplete) {
      // Add a short delay for visual effect
      const timer = setTimeout(() => {
        onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isComplete, onComplete])
  
  const handleRetry = async () => {
    setRetrying(true)
    await retry()
    setRetrying(false)
  }
  
  const getStepInfo = (stepName: string) => {
    return STEP_LABELS[stepName] || { label: stepName, icon: '⚙️' }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      {!isFailed && !isComplete && (
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-blue-500 transition-all duration-500"
                style={{
                  strokeDasharray: 251.2,
                  strokeDashoffset: 251.2 - (251.2 * progress) / 100,
                }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
              {progress}%
            </span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Setting up your AI receptionist
          </h3>
          <p className="text-slate-400 text-sm">
            This usually takes about 30 seconds
          </p>
        </div>
      )}
      
      {/* Success */}
      {isComplete && (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            You're all set!
          </h3>
          <p className="text-slate-400">
            Your AI receptionist is ready to take calls.
          </p>
        </div>
      )}
      
      {/* Error */}
      {isFailed && (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">😕</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-slate-400 mb-4">
            {job?.lastError || 'An error occurred during setup'}
          </p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
          >
            {retrying ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      )}
      
      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const info = getStepInfo(step.stepName)
          const isActive = step.status === 'running'
          const isDone = step.status === 'completed'
          const isSkipped = step.status === 'skipped'
          const isFail = step.status === 'failed'
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                isActive
                  ? 'bg-blue-500/10 border-blue-500/50'
                  : isDone
                  ? 'bg-green-500/5 border-green-500/30'
                  : isFail
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-slate-800/30 border-slate-700/50'
              }`}
            >
              {/* Status Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                isDone
                  ? 'bg-green-500/20'
                  : isFail
                  ? 'bg-red-500/20'
                  : isActive
                  ? 'bg-blue-500/20'
                  : 'bg-slate-700/50'
              }`}>
                {isDone ? (
                  <span className="text-green-400">✓</span>
                ) : isFail ? (
                  <span className="text-red-400">✗</span>
                ) : isActive ? (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="opacity-50">{info.icon}</span>
                )}
              </div>
              
              {/* Label */}
              <div className="flex-1">
                <span className={`font-medium ${
                  isDone
                    ? 'text-green-400'
                    : isFail
                    ? 'text-red-400'
                    : isActive
                    ? 'text-blue-400'
                    : 'text-slate-400'
                }`}>
                  {info.label}
                </span>
                {step.durationMs && isDone && (
                  <span className="ml-2 text-xs text-slate-500">
                    {(step.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
                {isFail && step.errorMessage && (
                  <p className="text-xs text-red-400/80 mt-1">{step.errorMessage}</p>
                )}
              </div>
              
              {/* Step number */}
              <span className="text-xs text-slate-500 w-8 text-right">
                {index + 1}/{steps.length}
              </span>
            </div>
          )
        })}
      </div>
      
      {/* Output Info (on success) */}
      {isComplete && job?.output && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Your Setup Details</h4>
          <div className="space-y-2 text-sm">
            {typeof job.output.phoneNumber === 'string' && job.output.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-slate-400">Phone Number</span>
                <span className="text-white font-mono">{job.output.phoneNumber}</span>
              </div>
            )}
            {typeof job.output.agentId === 'string' && job.output.agentId && (
              <div className="flex justify-between">
                <span className="text-slate-400">Agent Created</span>
                <span className="text-green-400">Yes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
