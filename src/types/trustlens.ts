export type UncertaintyLabel = 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';

export type ClaimVerdict = 'Supported' | 'Disputed' | 'Inconclusive';

export type EvidenceRelevance = 'Supports' | 'Disputes' | 'Partially Relevant' | 'Unrelated';

export type EvidenceSourceMode = 'Live Evidence Retrieval' | 'Built-in Demo Dataset';

export type ClaimVerificationMode = 'auto' | 'demo_only';

export type DataCategoryId =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'government_id'
  | 'financial'
  | 'location';

export type SensitivityLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type WhatIfOptionId = 'submit' | 'refuse' | 'revoke';

export type ReversibilityLevel = 'High' | 'Moderate' | 'Low' | 'Very Low';

export interface SampleEvidenceTopicRule {
  topicId: string;
  topicLabel: string;
  stance: 'Supports' | 'Disputes';
  phrases: string[];
}

export interface EvidenceRecord {
  id: string;
  title: string;
  sourceLabel: string;
  excerpt: string;
  recordedDate: string;
  isDemoData: boolean;
  url?: string;
}

export interface SampleEvidenceItem extends EvidenceRecord {
  domainPattern: string;
  entityKeywords: string[];
  keywords: string[];
  topicRules: SampleEvidenceTopicRule[];
  stance: 'Supports' | 'Disputes';
  explanation: string;
  isDemoData: true;
}

export interface SubclaimEvidenceMatch {
  evidence: EvidenceRecord;
  relevance: EvidenceRelevance;
  matchReason: string;
}

export interface SubclaimEvaluation {
  id: string;
  text: string;
  verdict: ClaimVerdict;
  evidenceMatch: UncertaintyLabel;
  explanation: string;
  evidenceMatches: SubclaimEvidenceMatch[];
}

export interface ClaimAnalysisResult {
  id: string;
  input: string;
  inputType: 'claim' | 'url';
  verdict: ClaimVerdict;
  uncertainty: UncertaintyLabel;
  evidenceMatchStatus: UncertaintyLabel;
  sourceMode: EvidenceSourceMode;
  retrievalStatus: string;
  explanation: string;
  verificationBoundary: string;
  subclaims: SubclaimEvaluation[];
  matchedEvidence: Array<{
    evidence: EvidenceRecord;
    relevance: EvidenceRelevance;
    matchReason: string;
  }>;
  analyzedAt: string;
  isDemoMatch: boolean;
}

export interface DetectedCategoryItem {
  categoryId: DataCategoryId;
  label: string;
  detected: boolean;
  sensitivity: SensitivityLevel;
  weight: number;
  uncertainty: UncertaintyLabel;
  matchedIndicators: string[];
  potentialRisks: string[];
  whyRisky: string;
  precautions: string[];
}

export interface PrivacyFinding {
  id: string;
  statement: string;
  uncertainty: UncertaintyLabel;
  rationale: string;
}

export interface PrivacyAnalysisResult {
  id: string;
  rawCharCount: number;
  redactionTriggered: boolean;
  redactionNotice: string | null;
  overallSensitivity: SensitivityLevel;
  riskScore: number;
  maxPossibleScore: number;
  detectedCategories: DetectedCategoryItem[];
  undetectedCategories: DetectedCategoryItem[];
  findings: PrivacyFinding[];
  missingDisclosures: string[];
  summary: string;
  analyzedAt: string;
}

export interface WhatIfScenarioOutcome {
  optionId: WhatIfOptionId;
  title: string;
  promptQuestion: string;
  uncertainty: UncertaintyLabel;
  reversibility: ReversibilityLevel;
  reversibilityRationale: string;
  possibleBenefits: string[];
  possibleRisks: string[];
  potentialConsequences: string[];
  ruleBasis: string;
}

export interface ReportFindingItem {
  category: 'Claim' | 'Privacy' | 'Scenario';
  statement: string;
  uncertainty: UncertaintyLabel;
}

export interface UnifiedTrustLensReport {
  id: string;
  title: string;
  generatedAt: string;
  isDemoScenario: boolean;
  claimAnalysis: ClaimAnalysisResult | null;
  privacyAnalysis: PrivacyAnalysisResult | null;
  whatIfOutcomes: WhatIfScenarioOutcome[];
  confirmedFindings: ReportFindingItem[];
  inferredFindings: ReportFindingItem[];
  unknownFindings: ReportFindingItem[];
  recommendations: string[];
}

export interface AnalysisHistoryRecord {
  id: string;
  title: string;
  createdAt: string;
  claimVerdict: ClaimVerdict | 'Not Run';
  privacyLevel: SensitivityLevel | 'Not Run';
  detectedCategoryCount: number;
  isDemo: boolean;
  report: UnifiedTrustLensReport;
}
