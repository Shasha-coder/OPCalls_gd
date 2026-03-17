/**
 * OPCALLS Phase 4: AI Module
 * 
 * Central export for all AI/Retell functionality
 */

// Types
export * from './types'

// Retell Provider
export {
  RetellProvider,
  getRetellProvider,
  createRetellProvider,
} from './retell-provider'

// Agent Service
export {
  createAgent,
  updateAgent,
  updateAgentPrompt,
  deleteAgent,
  getOrgAgents,
  getAgent,
  getPromptTemplates,
  getAvailableVoices,
  syncAgentWithRetell,
  type CreateAgentResult,
  type AgentDetails,
} from './agent-service'

// Call Analysis
export {
  processCallAnalysis,
  getCallAnalysis,
  getOrgAnalysisSummary,
} from './call-analysis'

// Binding Service
export {
  bindPhoneToAgent,
  unbindPhone,
  suspendOrgBindings,
  resumeOrgBindings,
  getOrgBindings,
  getPhoneBinding,
  hasActiveBindings,
  type BindingResult,
} from './binding-service'
