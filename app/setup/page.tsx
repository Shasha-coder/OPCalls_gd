/**
 * /setup - Full onboarding with provisioning
 */

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export const metadata = {
  title: 'Complete Your Setup | OPCalls',
  description: 'Set up your AI receptionist - phone number, voice agent, and more',
}

export default function SetupPage() {
  return <OnboardingWizard />
}
