/**
 * OPCALLS Phase 4: Call Analysis Service
 * 
 * Post-call AI analysis for sentiment, intent, quality scoring,
 * and improvement suggestions.
 */

import { createClient } from '@supabase/supabase-js'
import {
  CallAnalysis,
  CallAnalysisRecord,
  KeyMoment,
  ActionItem,
  RetellCallData,
} from './types'

// ============================================================================
// Initialize
// ============================================================================

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================================================
// Analysis Processing
// ============================================================================

/**
 * Process call analysis from Retell webhook
 */
export async function processCallAnalysis(
  callData: RetellCallData
): Promise<{ success: boolean; analysisId?: string; error?: string }> {
  const supabase = getSupabase()
  
  // Find the call record
  const { data: call, error: fetchError } = await supabase
    .from('calls')
    .select('id, org_id, agent_id')
    .eq('retell_call_id', callData.call_id)
    .single()
  
  if (fetchError || !call) {
    return { success: false, error: 'Call not found' }
  }
  
  // Check if analysis already exists
  const { data: existing } = await supabase
    .from('call_analysis')
    .select('id')
    .eq('call_id', call.id)
    .single()
  
  if (existing) {
    return { success: true, analysisId: existing.id }
  }
  
  // Extract analysis from Retell data
  const analysis = extractAnalysisFromRetell(callData)
  
  // Enhance with our own analysis if transcript available
  const enhancedAnalysis = callData.transcript
    ? await enhanceAnalysis(analysis, callData.transcript, callData.transcript_object)
    : analysis
  
  // Insert analysis record
  const { data: record, error: insertError } = await supabase
    .from('call_analysis')
    .insert({
      call_id: call.id,
      org_id: call.org_id,
      summary: enhancedAnalysis.summary,
      sentiment: enhancedAnalysis.sentiment,
      sentiment_score: enhancedAnalysis.sentimentScore,
      primary_intent: enhancedAnalysis.primaryIntent,
      secondary_intents: enhancedAnalysis.secondaryIntents,
      call_successful: enhancedAnalysis.callSuccessful,
      outcome_category: enhancedAnalysis.outcomeCategory,
      outcome_details: enhancedAnalysis.outcomeDetails,
      agent_performance_score: enhancedAnalysis.agentPerformanceScore,
      customer_satisfaction_score: enhancedAnalysis.customerSatisfactionScore,
      key_moments: enhancedAnalysis.keyMoments,
      action_items: enhancedAnalysis.actionItems,
      topics: enhancedAnalysis.topics,
      improvement_suggestions: enhancedAnalysis.improvementSuggestions,
      analyzed_at: new Date().toISOString(),
      analysis_model: 'retell-builtin',
    })
    .select()
    .single()
  
  if (insertError) {
    console.error('Failed to insert call analysis:', insertError)
    return { success: false, error: 'Failed to save analysis' }
  }
  
  // Update the call record with analysis summary
  await supabase
    .from('calls')
    .update({
      summary: enhancedAnalysis.summary,
      sentiment: enhancedAnalysis.sentiment,
      call_successful: enhancedAnalysis.callSuccessful,
      user_sentiment: enhancedAnalysis.sentiment,
      custom_analysis: {
        primary_intent: enhancedAnalysis.primaryIntent,
        agent_score: enhancedAnalysis.agentPerformanceScore,
        csat_score: enhancedAnalysis.customerSatisfactionScore,
      },
    })
    .eq('id', call.id)
  
  // Update prompt version stats
  await updatePromptStats(call.agent_id, enhancedAnalysis, callData.duration_ms)
  
  return { success: true, analysisId: record.id }
}

/**
 * Extract analysis from Retell call data
 */
function extractAnalysisFromRetell(callData: RetellCallData): CallAnalysis {
  const retellAnalysis = callData.call_analysis || {}
  
  // Map Retell sentiment to our format
  let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral'
  let sentimentScore = 0
  
  if (retellAnalysis.user_sentiment) {
    const s = retellAnalysis.user_sentiment.toLowerCase()
    if (s.includes('positive') || s.includes('happy') || s.includes('satisfied')) {
      sentiment = 'positive'
      sentimentScore = 0.7
    } else if (s.includes('negative') || s.includes('angry') || s.includes('frustrated')) {
      sentiment = 'negative'
      sentimentScore = -0.7
    } else if (s.includes('mixed')) {
      sentiment = 'mixed'
      sentimentScore = 0
    }
  }
  
  return {
    callId: callData.call_id,
    summary: retellAnalysis.call_summary || 'No summary available',
    sentiment,
    sentimentScore,
    primaryIntent: 'general_inquiry',
    secondaryIntents: [],
    callSuccessful: retellAnalysis.call_successful ?? true,
    outcomeCategory: determineOutcomeCategory(callData),
    outcomeDetails: retellAnalysis.custom_analysis_data || {},
    agentPerformanceScore: 0.75, // Default score
    customerSatisfactionScore: sentiment === 'positive' ? 0.8 : sentiment === 'negative' ? 0.3 : 0.6,
    keyMoments: [],
    actionItems: [],
    topics: [],
    improvementSuggestions: [],
  }
}

/**
 * Determine outcome category from call data
 */
function determineOutcomeCategory(callData: RetellCallData): string {
  const duration = callData.duration_ms || 0
  
  // Very short call - likely missed or voicemail
  if (duration < 10000) {
    return 'missed'
  }
  
  // Check if voicemail was detected
  if (callData.call_analysis?.custom_analysis_data?.voicemail_detected) {
    return 'voicemail'
  }
  
  // Check for booking keywords in summary
  const summary = (callData.call_analysis?.call_summary || '').toLowerCase()
  if (summary.includes('book') || summary.includes('appointment') || summary.includes('schedule')) {
    return 'booked'
  }
  
  if (summary.includes('transfer') || summary.includes('connect')) {
    return 'transferred'
  }
  
  // Default to info provided
  return 'info_provided'
}

/**
 * Enhance analysis with additional processing
 */
async function enhanceAnalysis(
  baseAnalysis: CallAnalysis,
  transcript: string,
  transcriptObject?: { role: string; content: string }[]
): Promise<CallAnalysis> {
  const enhanced = { ...baseAnalysis }
  
  // Extract topics from transcript
  enhanced.topics = extractTopics(transcript)
  
  // Detect key moments
  if (transcriptObject) {
    enhanced.keyMoments = detectKeyMoments(transcriptObject)
  }
  
  // Generate action items
  enhanced.actionItems = generateActionItems(transcript, enhanced.outcomeCategory)
  
  // Detect intent more precisely
  enhanced.primaryIntent = detectPrimaryIntent(transcript)
  
  // Calculate more accurate scores
  if (transcriptObject) {
    const scores = calculateQualityScores(transcriptObject)
    enhanced.agentPerformanceScore = scores.agentScore
    enhanced.customerSatisfactionScore = scores.csatScore
  }
  
  // Generate improvement suggestions
  enhanced.improvementSuggestions = generateImprovementSuggestions(
    enhanced,
    transcriptObject
  )
  
  return enhanced
}

/**
 * Extract topics from transcript
 */
function extractTopics(transcript: string): string[] {
  const topics: string[] = []
  const text = transcript.toLowerCase()
  
  // Common topic patterns
  const topicPatterns: Record<string, string[]> = {
    appointment: ['appointment', 'schedule', 'book', 'availability'],
    pricing: ['price', 'cost', 'fee', 'charge', 'payment'],
    hours: ['hours', 'open', 'close', 'available'],
    location: ['address', 'location', 'directions', 'where'],
    service: ['service', 'repair', 'fix', 'help', 'support'],
    emergency: ['emergency', 'urgent', 'immediately', 'asap'],
    insurance: ['insurance', 'coverage', 'plan'],
    cancellation: ['cancel', 'reschedule', 'change'],
  }
  
  for (const [topic, keywords] of Object.entries(topicPatterns)) {
    if (keywords.some(kw => text.includes(kw))) {
      topics.push(topic)
    }
  }
  
  return topics
}

/**
 * Detect key moments in conversation
 */
function detectKeyMoments(
  transcriptObject: { role: string; content: string }[]
): KeyMoment[] {
  const moments: KeyMoment[] = []
  let timestamp = 0
  
  for (const turn of transcriptObject) {
    const content = turn.content.toLowerCase()
    
    // Detect objections
    if (content.includes("don't") || content.includes("can't") || content.includes('too expensive')) {
      moments.push({
        timestamp,
        type: 'objection',
        content: turn.content,
      })
    }
    
    // Detect agreement/booking
    if (content.includes('yes') && (content.includes('book') || content.includes('schedule'))) {
      moments.push({
        timestamp,
        type: 'booking',
        content: turn.content,
      })
    }
    
    // Detect escalation requests
    if (content.includes('speak to') || content.includes('manager') || content.includes('human')) {
      moments.push({
        timestamp,
        type: 'escalation',
        content: turn.content,
      })
    }
    
    timestamp += 10 // Approximate timestamp
  }
  
  return moments.slice(0, 10) // Limit to 10 moments
}

/**
 * Generate action items
 */
function generateActionItems(
  transcript: string,
  outcomeCategory: string
): ActionItem[] {
  const items: ActionItem[] = []
  const text = transcript.toLowerCase()
  
  // Callback requested
  if (text.includes('call back') || text.includes('callback')) {
    items.push({
      type: 'callback',
      priority: 'high',
      details: 'Customer requested a callback',
    })
  }
  
  // Follow-up email
  if (text.includes('email') || text.includes('send')) {
    items.push({
      type: 'email',
      priority: 'medium',
      details: 'Send follow-up information via email',
    })
  }
  
  // Based on outcome
  if (outcomeCategory === 'transferred') {
    items.push({
      type: 'note',
      priority: 'medium',
      details: 'Call was transferred - verify resolution',
    })
  }
  
  if (outcomeCategory === 'missed') {
    items.push({
      type: 'callback',
      priority: 'high',
      details: 'Missed call - attempt callback',
    })
  }
  
  return items
}

/**
 * Detect primary intent
 */
function detectPrimaryIntent(transcript: string): string {
  const text = transcript.toLowerCase()
  
  const intentPatterns: Record<string, string[]> = {
    book_appointment: ['appointment', 'schedule', 'book', 'reserve'],
    get_info: ['information', 'tell me', 'what is', 'how much', 'hours'],
    complaint: ['complaint', 'problem', 'issue', 'frustrated', 'angry'],
    support: ['help', 'support', 'fix', 'repair', 'broken'],
    cancel: ['cancel', 'reschedule', 'change appointment'],
    pricing: ['price', 'cost', 'quote', 'estimate'],
    followup: ['following up', 'checking on', 'status'],
  }
  
  for (const [intent, keywords] of Object.entries(intentPatterns)) {
    if (keywords.some(kw => text.includes(kw))) {
      return intent
    }
  }
  
  return 'general_inquiry'
}

/**
 * Calculate quality scores
 */
function calculateQualityScores(
  transcriptObject: { role: string; content: string }[]
): { agentScore: number; csatScore: number } {
  let agentScore = 0.7 // Base score
  let csatScore = 0.6
  
  const agentTurns = transcriptObject.filter(t => t.role === 'agent')
  const userTurns = transcriptObject.filter(t => t.role === 'user')
  
  // Agent responsiveness (short, helpful responses)
  const avgAgentLength = agentTurns.reduce((sum, t) => sum + t.content.length, 0) / (agentTurns.length || 1)
  if (avgAgentLength < 200) agentScore += 0.1 // Concise
  if (avgAgentLength > 500) agentScore -= 0.1 // Too verbose
  
  // Check for positive agent language
  const agentText = agentTurns.map(t => t.content.toLowerCase()).join(' ')
  if (agentText.includes('happy to help') || agentText.includes('certainly')) agentScore += 0.1
  if (agentText.includes('unfortunately') || agentText.includes("can't")) agentScore -= 0.05
  
  // User satisfaction signals
  const userText = userTurns.map(t => t.content.toLowerCase()).join(' ')
  if (userText.includes('thank') || userText.includes('great') || userText.includes('perfect')) {
    csatScore += 0.2
  }
  if (userText.includes('frustrated') || userText.includes("doesn't help") || userText.includes('terrible')) {
    csatScore -= 0.3
  }
  
  // Clamp scores
  return {
    agentScore: Math.max(0, Math.min(1, agentScore)),
    csatScore: Math.max(0, Math.min(1, csatScore)),
  }
}

/**
 * Generate improvement suggestions
 */
function generateImprovementSuggestions(
  analysis: CallAnalysis,
  transcriptObject?: { role: string; content: string }[]
): string[] {
  const suggestions: string[] = []
  
  // Low CSAT
  if (analysis.customerSatisfactionScore < 0.5) {
    suggestions.push('Consider improving empathy and active listening in responses')
  }
  
  // Escalation happened
  if (analysis.keyMoments.some(m => m.type === 'escalation')) {
    suggestions.push('Add more knowledge base content to handle common escalation triggers')
  }
  
  // Long agent responses
  if (transcriptObject) {
    const agentTurns = transcriptObject.filter(t => t.role === 'agent')
    const avgLength = agentTurns.reduce((sum, t) => sum + t.content.length, 0) / (agentTurns.length || 1)
    if (avgLength > 400) {
      suggestions.push('Consider shortening agent responses for better conversation flow')
    }
  }
  
  // Missed booking opportunity
  if (analysis.topics.includes('appointment') && analysis.outcomeCategory !== 'booked') {
    suggestions.push('Review booking flow - customer showed interest but did not book')
  }
  
  return suggestions
}

/**
 * Update prompt version statistics
 */
async function updatePromptStats(
  agentId: string,
  analysis: CallAnalysis,
  durationMs?: number
): Promise<void> {
  const supabase = getSupabase()
  
  // Get active prompt version
  const { data: promptVersion } = await supabase
    .from('prompt_versions')
    .select('id')
    .eq('agent_id', agentId)
    .eq('is_active', true)
    .single()
  
  if (promptVersion) {
    await supabase.rpc('update_prompt_stats', {
      p_prompt_version_id: promptVersion.id,
      p_success: analysis.callSuccessful,
      p_sentiment: analysis.sentimentScore,
      p_duration_seconds: Math.round((durationMs || 0) / 1000),
    })
  }
}

// ============================================================================
// Analysis Queries
// ============================================================================

/**
 * Get analysis for a call
 */
export async function getCallAnalysis(
  callId: string
): Promise<CallAnalysis | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('call_analysis')
    .select('*')
    .eq('call_id', callId)
    .single()
  
  if (error || !data) return null
  
  return mapRecordToAnalysis(data)
}

/**
 * Get analysis summary for an organization
 */
export async function getOrgAnalysisSummary(
  orgId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalCalls: number
  avgSentiment: number
  avgAgentScore: number
  avgCsatScore: number
  successRate: number
  topIntents: { intent: string; count: number }[]
  topTopics: { topic: string; count: number }[]
}> {
  const supabase = getSupabase()
  
  let query = supabase
    .from('call_analysis')
    .select('*')
    .eq('org_id', orgId)
  
  if (dateRange) {
    query = query
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString())
  }
  
  const { data, error } = await query
  
  if (error || !data || data.length === 0) {
    return {
      totalCalls: 0,
      avgSentiment: 0,
      avgAgentScore: 0,
      avgCsatScore: 0,
      successRate: 0,
      topIntents: [],
      topTopics: [],
    }
  }
  
  // Calculate averages
  const totalCalls = data.length
  const avgSentiment = data.reduce((sum, d) => sum + (d.sentiment_score || 0), 0) / totalCalls
  const avgAgentScore = data.reduce((sum, d) => sum + (d.agent_performance_score || 0), 0) / totalCalls
  const avgCsatScore = data.reduce((sum, d) => sum + (d.customer_satisfaction_score || 0), 0) / totalCalls
  const successRate = data.filter(d => d.call_successful).length / totalCalls
  
  // Count intents
  const intentCounts: Record<string, number> = {}
  data.forEach(d => {
    const intent = d.primary_intent || 'unknown'
    intentCounts[intent] = (intentCounts[intent] || 0) + 1
  })
  const topIntents = Object.entries(intentCounts)
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  // Count topics
  const topicCounts: Record<string, number> = {}
  data.forEach(d => {
    (d.topics || []).forEach((topic: string) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1
    })
  })
  const topTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  return {
    totalCalls,
    avgSentiment,
    avgAgentScore,
    avgCsatScore,
    successRate,
    topIntents,
    topTopics,
  }
}

/**
 * Map database record to CallAnalysis
 */
function mapRecordToAnalysis(record: CallAnalysisRecord): CallAnalysis {
  return {
    callId: record.call_id,
    summary: record.summary || '',
    sentiment: (record.sentiment as 'positive' | 'neutral' | 'negative' | 'mixed') || 'neutral',
    sentimentScore: record.sentiment_score || 0,
    primaryIntent: record.primary_intent || 'unknown',
    secondaryIntents: record.secondary_intents || [],
    callSuccessful: record.call_successful ?? true,
    outcomeCategory: record.outcome_category || 'unknown',
    outcomeDetails: record.outcome_details || {},
    agentPerformanceScore: record.agent_performance_score || 0,
    customerSatisfactionScore: record.customer_satisfaction_score || 0,
    keyMoments: record.key_moments || [],
    actionItems: record.action_items || [],
    topics: record.topics || [],
    improvementSuggestions: record.improvement_suggestions || [],
  }
}
