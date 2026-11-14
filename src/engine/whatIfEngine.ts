import {
  ClaimAnalysisResult,
  DataCategoryId,
  ReversibilityLevel,
  SensitivityLevel,
  WhatIfScenarioOutcome,
} from '../types/trustlens';

export interface ScenarioSimulationInput {
  detectedCategoryIds: DataCategoryId[];
  overallSensitivity: SensitivityLevel;
  hasDeletionPolicyDisclosed: boolean;
  claimAnalysis: ClaimAnalysisResult | null;
}

const CATEGORY_LABELS: Record<DataCategoryId, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone number',
  address: 'Address',
  government_id: 'Government ID',
  financial: 'Financial information',
  location: 'Location information',
};

export function runWhatIfScenarios(input: ScenarioSimulationInput): WhatIfScenarioOutcome[] {
  const { detectedCategoryIds, overallSensitivity, hasDeletionPolicyDisclosed, claimAnalysis } = input;
  const hasCritical =
    detectedCategoryIds.includes('government_id') || detectedCategoryIds.includes('financial');
  const hasAddressOrLocation =
    detectedCategoryIds.includes('address') || detectedCategoryIds.includes('location');
  const hasContact =
    detectedCategoryIds.includes('email') || detectedCategoryIds.includes('phone');
  const categoryListText =
    detectedCategoryIds.length > 0
      ? detectedCategoryIds.map((id) => CATEGORY_LABELS[id]).join(', ')
      : 'No personal data categories selected';

  const isDisputedClaim = claimAnalysis?.verdict === 'Disputed';
  const isInconclusiveClaim = !claimAnalysis || claimAnalysis.verdict === 'Inconclusive';

  // Scenario A: What if I submit my data?
  const submitReversibility: ReversibilityLevel = hasCritical
    ? 'Very Low'
    : hasAddressOrLocation
      ? 'Low'
      : 'Moderate';

  const submitOutcome: WhatIfScenarioOutcome = {
    optionId: 'submit',
    title: 'Option A · Submit Requested Data',
    promptQuestion: 'What if I submit my data?',
    uncertainty: isDisputedClaim || hasCritical ? 'INFERRED' : 'INFERRED',
    reversibility: submitReversibility,
    reversibilityRationale: hasCritical
      ? 'Once immutable identifiers (Government ID or Financial credentials) are transmitted, copies cannot be recalled from external databases or potential downstream recipients.'
      : hasAddressOrLocation
        ? 'Physical address or location records persist after submission and cannot be un-seen even if later deleted.'
        : 'Contact details may be copied to logs or mailing lists, making full retraction uncertain without explicit deletion mechanisms.',
    possibleBenefits: [
      'Allows immediate completion of the application or service onboarding workflow.',
      hasCritical
        ? 'Satisfies strict identity or payout verification steps if the recipient organization is legitimate.'
        : 'Enables status notifications and direct communication regarding your request.',
    ],
    possibleRisks: [
      ...(detectedCategoryIds.length === 0
        ? ['Minimal personal exposure if no sensitive fields are actually submitted.']
        : [
            `Exposes ${detectedCategoryIds.length} personal data ${
              detectedCategoryIds.length === 1 ? 'category' : 'categories'
            } (${categoryListText}) with ${overallSensitivity} aggregate privacy risk.`,
          ]),
      ...(hasCritical
        ? ['High exposure to identity theft, credential abuse, or unauthorized financial activity if the form operator is compromised or untrustworthy.']
        : []),
      ...(hasContact
        ? ['Increased likelihood of unsolicited messages, spam, or targeted phishing using submitted contact channels.']
        : []),
      ...(isDisputedClaim
        ? ['Claim verification returned Disputed against sample records, elevating the risk that stated guarantees or privacy commitments are inaccurate.']
        : isInconclusiveClaim
          ? ['Claim verification is Inconclusive, meaning legitimacy and operator trustworthiness remain UNKNOWN.']
          : []),
    ],
    potentialConsequences: [
      hasDeletionPolicyDisclosed
        ? 'A deletion or opt-out mechanism is referenced in the text, though actual backend compliance cannot be verified client-side (UNKNOWN).'
        : 'Data retention duration and third-party sharing scope remain UNKNOWN because the notice omits explicit limits.',
      hasCritical
        ? 'Potential long-term exposure if Government ID or Financial details are breached or shared onward.'
        : 'Possible profile linkage across submitted contact or identity fields.',
    ],
    ruleBasis: `Rule-based model (not a behavioral prediction): evaluated ${detectedCategoryIds.length} active categories (${overallSensitivity} aggregate risk), claim verdict (${
      claimAnalysis?.verdict ?? 'None'
    }), and deletion disclosure (${hasDeletionPolicyDisclosed ? 'Referenced' : 'Not disclosed — outcome UNKNOWN'}).`,
  };

  // Scenario B: What if I refuse to share my data?
  const refuseOutcome: WhatIfScenarioOutcome = {
    optionId: 'refuse',
    title: 'Option B · Refuse to Share Data',
    promptQuestion: 'What if I refuse to share my data?',
    uncertainty: detectedCategoryIds.length > 0 ? 'CONFIRMED' : 'INFERRED',
    reversibility: 'High',
    reversibilityRationale:
      'Refusing before submission leaves zero personal records with the form operator. You retain full control and can still submit later if legitimacy is verified.',
    possibleBenefits: [
      'Zero exposure of personal, identity, contact, or financial data to an unverified portal.',
      'Preserves full reversibility—you keep the option to apply later after independent verification.',
      ...(hasCritical
        ? ['Completely prevents irreversible leakage of Government ID or Financial details.']
        : []),
    ],
    possibleRisks: [
      'Your application or registration will likely be blocked or remain incomplete if fields are mandatory.',
      'May miss time-sensitive deadlines if the program turns out to be legitimate and no alternative submission channel exists.',
    ],
    potentialConsequences: [
      'You must use an alternate verification path (such as contacting the institution directly via an official directory) to proceed.',
      'No third-party data footprint is created from this form interaction.',
    ],
    ruleBasis:
      'Refusal prevents initial data transfer. Benefit and reversibility are directly supported by local non-submission.',
  };

  // Scenario C: What if I revoke consent later?
  const revokeReversibility: ReversibilityLevel = hasDeletionPolicyDisclosed
    ? hasCritical
      ? 'Low'
      : 'Moderate'
    : 'Low';

  const revokeOutcome: WhatIfScenarioOutcome = {
    optionId: 'revoke',
    title: 'Option C · Revoke Consent Later',
    promptQuestion: 'What if I revoke consent later?',
    uncertainty: hasDeletionPolicyDisclosed ? 'INFERRED' : 'UNKNOWN',
    reversibility: revokeReversibility,
    reversibilityRationale: hasDeletionPolicyDisclosed
      ? 'While a deletion or opt-out reference appears in the text, technical propagation across backups and third-party processors cannot be independently confirmed.'
      : 'The pasted form/notice lacks a clear consent-withdrawal or erasure contact, making post-submission deletion effectiveness UNKNOWN.',
    possibleBenefits: [
      'Under applicable privacy regulations (where enforceable), withdrawing consent may halt future marketing or secondary processing.',
      'Establishes a formal record requesting cessation of non-essential data use.',
    ],
    possibleRisks: [
      'Data already shared with third-party partners or cached in archival backups may not be erased promptly.',
      ...(hasCritical
        ? ['Revoking consent does NOT invalidate a previously copied Government ID number or past financial record.']
        : []),
      ...(!hasDeletionPolicyDisclosed
        ? ['No clear erasure procedure is visible, so requests may go unanswered or require manual escalation.']
        : []),
    ],
    potentialConsequences: [
      'Active application or account access tied to mandatory fields may be suspended or terminated upon revocation.',
      'Actual deletion completion by the external operator remains UNKNOWN without verifiable audit confirmation.',
    ],
    ruleBasis: `Evaluated deletion disclosure (${
      hasDeletionPolicyDisclosed ? 'Referenced' : 'Not specified'
    }) and persistence of ${detectedCategoryIds.length} submitted categories.`,
  };

  return [submitOutcome, refuseOutcome, revokeOutcome];
}
