import {
  DataCategoryId,
  DetectedCategoryItem,
  PrivacyAnalysisResult,
  PrivacyFinding,
  SensitivityLevel,
} from '../types/trustlens';

let privacySequence = 0;

interface CategoryRuleDefinition {
  categoryId: DataCategoryId;
  label: string;
  sensitivity: SensitivityLevel;
  weight: number;
  explicitKeywords: string[];
  inferredKeywords: string[];
  potentialRisks: string[];
  whyRisky: string;
  precautions: string[];
}

const CATEGORY_RULES: CategoryRuleDefinition[] = [
  {
    categoryId: 'name',
    label: 'Name',
    sensitivity: 'Low',
    weight: 1,
    explicitKeywords: ['full name', 'legal name', 'first name', 'last name', 'student name', 'applicant name', 'your name', 'name'],
    inferredKeywords: ['signature', 'signed by', 'applicant identity'],
    potentialRisks: [
      'Enables personal identification when combined with contact or address fields.',
      'Can be used in targeted phishing or impersonation messages.',
    ],
    whyRisky:
      'While a name alone carries low standalone sensitivity, pairing a legal name with email, phone, or ID fields creates a linkable personal profile.',
    precautions: [
      'Confirm why legal name verification is required before submission.',
      'Avoid sharing full middle/legal names on unverified informal forms.',
    ],
  },
  {
    categoryId: 'email',
    label: 'Email',
    sensitivity: 'Moderate',
    weight: 2,
    explicitKeywords: ['email', 'e-mail', 'email address', 'mail id', 'contact email', 'university email'],
    inferredKeywords: ['electronic correspondence', 'inbox notification', 'unsubscribe'],
    potentialRisks: [
      'Exposure to spam, credential stuffing, or targeted phishing campaigns.',
      'Acts as a persistent cross-site identifier across third-party data brokers.',
    ],
    whyRisky:
      'Email addresses frequently serve as primary login identifiers across services; leaks increase account takeover and social-engineering exposure.',
    precautions: [
      'Use an alias or dedicated secondary email address for one-off applications.',
      'Check whether an unsubscribe or data deletion contact is provided.',
    ],
  },
  {
    categoryId: 'phone',
    label: 'Phone number',
    sensitivity: 'Moderate',
    weight: 2,
    explicitKeywords: ['phone', 'phone number', 'phone no', 'mobile', 'mobile number', 'mobile no', 'telephone', 'cell number', 'cell phone', 'cellphone', 'contact number', 'sms', 'whatsapp'],
    inferredKeywords: ['two-factor call', 'callback number', 'text message verification'],
    potentialRisks: [
      'Smishing (SMS phishing), unsolicited telemarketing, and SIM-swap targeting.',
      'Harder to rotate or replace compared to a disposable email address.',
    ],
    whyRisky:
      'Phone numbers are tightly linked to personal devices and SMS authentication channels, making unauthorized sharing difficult to contain.',
    precautions: [
      'Verify whether phone submission is strictly mandatory before providing it.',
      'Never rely solely on SMS if stronger authentication options exist elsewhere.',
    ],
  },
  {
    categoryId: 'address',
    label: 'Address',
    sensitivity: 'High',
    weight: 3,
    explicitKeywords: ['home address', 'street address', 'mailing address', 'residential address', 'physical address', 'postal code', 'zip code', 'city and state', 'address'],
    inferredKeywords: ['proof of residence', 'utility bill', 'physical mail delivery'],
    potentialRisks: [
      'Physical location exposure, unwanted postal solicitation, or household profiling.',
      'Frequently used as a knowledge-based verification question by financial institutions.',
    ],
    whyRisky:
      'A home address ties an online identity directly to a physical residence and cannot be easily changed.',
    precautions: [
      'Check if a campus P.O. Box or institutional office address is acceptable instead of a home street address.',
      'Verify retention policies before submitting physical residency details.',
    ],
  },
  {
    categoryId: 'government_id',
    label: 'Government ID',
    sensitivity: 'Critical',
    weight: 5,
    explicitKeywords: [
      'government id',
      'govt id',
      'gov id',
      'national id',
      'passport',
      'driver license',
      "driver's license",
      "driver's licence",
      'driving license',
      'id card',
      'id proof',
      'identification number',
      'ssn',
      'social security',
      'aadhaar',
      'pan card',
      'tax id',
      'tin',
      'state id',
      'voter id',
    ],
    inferredKeywords: ['official photo id', 'identity document upload', 'citizenship verification document'],
    potentialRisks: [
      'Severe identity theft, fraudulent account opening, and impersonation.',
      'Immutable identifier: unlike passwords, government ID numbers cannot be easily reset.',
    ],
    whyRisky:
      'Government identifiers are permanent, high-value credentials. Unauthorized exposure or onward sharing creates long-term identity fraud risk.',
    precautions: [
      'Never upload or type a Government ID unless the organization legitimacy and retention policy are independently verified.',
      'Ask if institutional student verification or redacted documentation can be used first.',
    ],
  },
  {
    categoryId: 'financial',
    label: 'Financial information',
    sensitivity: 'Critical',
    weight: 5,
    explicitKeywords: [
      'bank account',
      'bank details',
      'routing number',
      'credit card',
      'debit card',
      'card number',
      'cvv',
      'iban',
      'swift',
      'salary',
      'income',
      'tax return',
      'financial information',
      'financial details',
      'payment card',
      'payment details',
      'account number',
      'upi',
    ],
    inferredKeywords: ['direct deposit', 'payout method', 'stipend transfer details', 'billing details'],
    potentialRisks: [
      'Unauthorized financial transactions, account drain, or fraudulent credit applications.',
      'Sensitive economic profiling if income or tax records are retained.',
    ],
    whyRisky:
      'Financial credentials enable direct monetary loss and sensitive household income profiling when stored without strict safeguards.',
    precautions: [
      'Do not enter banking or card details on initial interest or eligibility screening forms.',
      'Confirm TLS encryption and verified institutional payment processors before any payout setup.',
    ],
  },
  {
    categoryId: 'location',
    label: 'Location information',
    sensitivity: 'High',
    weight: 3,
    explicitKeywords: [
      'location',
      'gps',
      'geolocation',
      'geo-location',
      'coordinates',
      'ip address',
      'precise location',
      'current location',
      'live location',
      'campus proximity',
      'track location',
    ],
    inferredKeywords: ['device telemetry', 'region tracking', 'nearby check-in'],
    potentialRisks: [
      'Behavioral pattern tracking, routine inference, and movement profiling.',
      'Continuous location telemetry may persist across sessions or SDK partners.',
    ],
    whyRisky:
      'Location metadata reveals daily habits, home/work routines, and physical presence over time.',
    precautions: [
      'Deny continuous or precise GPS access if a manual city/region selection suffices.',
      'Review browser or OS permission prompts and revoke location access after use.',
    ],
  },
];

// Detects accidental entry of sensitive numbers (SSN, credit card, long digit sequences) without storing them
function detectRawSensitiveValues(text: string): { triggered: boolean; notice: string | null } {
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
  const cardPattern = /\b(?:\d[ -]*?){13,16}\b/;
  const longIdPattern = /\b\d{9,12}\b/;

  if (ssnPattern.test(text) || cardPattern.test(text) || longIdPattern.test(text)) {
    return {
      triggered: true,
      notice:
        'Safety Guardrail: Numeric sequences resembling real IDs, phone numbers, or payment numbers were detected in your input. TrustLens does NOT store or transmit raw sensitive values—only field category keywords are analyzed. Avoid pasting real personal numbers.',
    };
  }

  return { triggered: false, notice: null };
}

export function analyzePrivacyText(rawText: string): PrivacyAnalysisResult {
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();
  const redactionCheck = detectRawSensitiveValues(trimmed);

  // Strip non-physical address phrases before checking standalone "address"
  const lowerWithoutTechnicalAddresses = lower.replace(
    /\b(email|e-mail|ip|mac|web|url|wallet|btc|eth)\s+address\b/g,
    ' '
  );
  // Strip non-personal name phrases before checking standalone "name"
  const lowerWithoutNonPersonalNames = lower.replace(
    /\b(domain|company|organization|organisation|file|folder|brand|product|project|portal|website|program|scholarship)\s+name\b/g,
    ' '
  );

  const detectedCategories: DetectedCategoryItem[] = [];
  const undetectedCategories: DetectedCategoryItem[] = [];

  for (const rule of CATEGORY_RULES) {
    const explicitHits = rule.explicitKeywords.filter((kw) => {
      if (kw === 'name') {
        return /\bname\b/.test(lowerWithoutNonPersonalNames);
      }
      if (kw === 'address') {
        return /\baddress\b/.test(lowerWithoutTechnicalAddresses);
      }
      if (kw === 'location') {
        return /\blocation\b/.test(lower);
      }
      return lower.includes(kw);
    });

    const inferredHits = rule.inferredKeywords.filter((kw) => lower.includes(kw));
    const detected = explicitHits.length > 0 || inferredHits.length > 0;

    const item: DetectedCategoryItem = {
      categoryId: rule.categoryId,
      label: rule.label,
      detected,
      sensitivity: rule.sensitivity,
      weight: rule.weight,
      uncertainty: explicitHits.length > 0 ? 'CONFIRMED' : inferredHits.length > 0 ? 'INFERRED' : 'UNKNOWN',
      matchedIndicators: explicitHits.length > 0 ? explicitHits : inferredHits,
      potentialRisks: rule.potentialRisks,
      whyRisky: rule.whyRisky,
      precautions: rule.precautions,
    };

    if (detected) {
      detectedCategories.push(item);
    } else {
      undetectedCategories.push(item);
    }
  }

  const rawScore = detectedCategories.reduce((sum, item) => sum + item.weight, 0);
  const maxPossibleScore = CATEGORY_RULES.reduce((sum, rule) => sum + rule.weight, 0);

  // Rule-based overall sensitivity calculation
  const hasCritical = detectedCategories.some((c) => c.sensitivity === 'Critical');
  const hasHigh = detectedCategories.some((c) => c.sensitivity === 'High');
  const hasModerate = detectedCategories.some((c) => c.sensitivity === 'Moderate');

  let overallSensitivity: SensitivityLevel = 'Low';
  if (
    (hasCritical && detectedCategories.length >= 3) ||
    (detectedCategories.some((c) => c.categoryId === 'government_id') &&
      detectedCategories.some((c) => c.categoryId === 'financial'))
  ) {
    overallSensitivity = 'Critical';
  } else if (hasCritical || hasHigh || rawScore >= 7) {
    overallSensitivity = 'High';
  } else if (hasModerate || rawScore >= 3) {
    overallSensitivity = 'Moderate';
  } else {
    overallSensitivity = 'Low';
  }

  // Check for standard privacy notice disclosures
  const missingDisclosures: string[] = [];
  if (!/(retention|retain|delete|deletion|storage period|kept for)/i.test(lower) || /not specified/i.test(lower)) {
    missingDisclosures.push('Data retention duration and deletion schedule');
  }
  if (!/(third-party|third party|partners|sell|shared with)/i.test(lower) || /not specified/i.test(lower)) {
    missingDisclosures.push('Third-party sharing and partner transfer scope');
  }
  if (!/(revoke|withdraw consent|opt out|opt-out|unsubscribe|erasure)/i.test(lower)) {
    missingDisclosures.push('Consent withdrawal and data erasure procedure');
  }
  if (!/(encrypt|tls|https|safeguard|security measure)/i.test(lower)) {
    missingDisclosures.push('Technical storage and transmission safeguards');
  }

  const findings: PrivacyFinding[] = [];

  if (detectedCategories.length > 0) {
    const categoryBreakdown = detectedCategories
      .map((c) => `${c.label} (${c.sensitivity})`)
      .join(', ');
    findings.push({
      id: 'PF-CONF-1',
      statement: `Detected ${detectedCategories.length} of 7 tracked personal data ${
        detectedCategories.length === 1 ? 'category' : 'categories'
      }: ${categoryBreakdown}.`,
      uncertainty: detectedCategories.every((c) => c.uncertainty === 'CONFIRMED') ? 'CONFIRMED' : 'INFERRED',
      rationale:
        'Each category retains its own individual sensitivity rating based on explicit or inferred field indicators.',
    });
  }

  findings.push({
    id: 'PF-INF-1',
    statement: `Aggregate privacy risk is rated ${overallSensitivity} (weighted score ${rawScore}/${maxPossibleScore} across ${detectedCategories.length} detected ${
      detectedCategories.length === 1 ? 'category' : 'categories'
    }).`,
    uncertainty: 'INFERRED',
    rationale:
      'Calculated from individual category weights (Low=1, Moderate=2, High=3, Critical=5) and multi-field aggregation; individual category levels remain distinct.',
  });

  if (missingDisclosures.length > 0) {
    findings.push({
      id: 'PF-UNK-1',
      statement: `The pasted text does not clarify: ${missingDisclosures.join('; ')}.`,
      uncertainty: 'UNKNOWN',
      rationale:
        'Cannot be determined from the visible text alone. TrustLens never assumes undisclosed backend practices.',
    });
  }

  const summary =
    detectedCategories.length === 0
      ? 'No tracked personal data categories were detected in the provided text. Ensure the full form fields or privacy policy excerpt are pasted.'
      : `Detected ${detectedCategories.length} of 7 categories (${detectedCategories
          .map((c) => `${c.label}: ${c.sensitivity}`)
          .join(', ')}). Aggregate privacy risk: ${overallSensitivity} (score ${rawScore}/${maxPossibleScore}). ${
          missingDisclosures.length > 0
            ? `${missingDisclosures.length} key privacy disclosures are absent and remain UNKNOWN.`
            : 'Core disclosure topics are referenced in the text.'
        }`;

  return {
    id: `PRV-${Date.now().toString(36).toUpperCase()}-${(++privacySequence).toString(36).toUpperCase()}`,
    rawCharCount: trimmed.length,
    redactionTriggered: redactionCheck.triggered,
    redactionNotice: redactionCheck.notice,
    overallSensitivity,
    riskScore: rawScore,
    maxPossibleScore,
    detectedCategories,
    undetectedCategories,
    findings,
    missingDisclosures,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}
