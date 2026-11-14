import { DataCategoryId, SampleEvidenceItem } from '../types/trustlens';

export const UNCERTAINTY_DEFINITIONS = {
  CONFIRMED: {
    label: 'CONFIRMED',
    shortDesc: 'Directly supported by visible information or evidence.',
    detail:
      'Used when user-submitted text explicitly names a data field or when an evidence match is directly confirmed by a record in the sample evidence dataset. In Claim Verification, CONFIRMED refers to the evidence match status (even when the claim itself is Disputed).',
  },
  INFERRED: {
    label: 'INFERRED',
    shortDesc: 'A possible conclusion based on available information and rules.',
    detail:
      'Used when aggregate risk levels, indirect data exposure, partial evidence relevance, or What-If consequences are deduced through transparent rule-based logic rather than explicitly stated.',
  },
  UNKNOWN: {
    label: 'UNKNOWN',
    shortDesc: 'Cannot be determined from the available information.',
    detail:
      'Used when no matching evidence exists or when a form/notice omits critical details such as retention duration, encryption, or consent withdrawal.',
  },
} as const;

export const SAMPLE_EVIDENCE_DATASET: SampleEvidenceItem[] = [
  {
    id: 'EV-DEMO-01',
    title: 'MeritBridge Portal Fee & Program Registration Record (DEMO DATA)',
    sourceLabel: 'DEMO DATA · Fictional Academic Registry Archive',
    domainPattern: 'demo-meritbridge-scholarship.example',
    entityKeywords: ['meritbridge', 'demo-meritbridge-scholarship.example'],
    keywords: [
      'meritbridge',
      'application fee',
      'zero fee',
      'zero processing fee',
      'no fee',
      'fee-free',
      'free to apply',
      'stem undergraduate',
      'enrolled',
      'demo-meritbridge-scholarship.example',
    ],
    topicRules: [
      {
        topicId: 'meritbridge-no-fee',
        topicLabel: 'Zero Application Fee',
        stance: 'Supports',
        phrases: [
          'no fee',
          'zero fee',
          'zero application fee',
          'zero processing fee',
          'no application fee',
          'fee-free',
          'free to apply',
          '$0 application fee',
          'charges no fee',
        ],
      },
      {
        topicId: 'meritbridge-eligibility',
        topicLabel: 'STEM Undergraduate Eligibility',
        stance: 'Supports',
        phrases: [
          'stem undergraduate',
          'undergraduate stem',
          'institutional enrollment',
          'university registrar',
        ],
      },
    ],
    stance: 'Supports',
    excerpt:
      'Sample Registry Entry (DEMO DATA): MeritBridge STEM Scholarship lists a $0 application fee for eligible undergraduate applicants and requires institutional enrollment confirmation.',
    explanation:
      'The fictional registry record confirms that MeritBridge applications list a $0 application fee.',
    isDemoData: true,
    recordedDate: '2026-10-12',
  },
  {
    id: 'EV-DEMO-02',
    title: 'MeritBridge Disbursement & Privacy Notice Review (DEMO DATA)',
    sourceLabel: 'DEMO DATA · Fictional Consumer Watchdog Bulletin',
    domainPattern: 'demo-meritbridge-scholarship.example',
    entityKeywords: ['meritbridge', 'demo-meritbridge-scholarship.example'],
    keywords: [
      'meritbridge',
      'guaranteed',
      '100% approval',
      'instant approval',
      'never shares data',
      'never shared with third parties',
      'no third-party',
      'no third party',
      'deleted immediately',
      'immediate deletion',
      'no government id',
      'demo-meritbridge-scholarship.example',
    ],
    topicRules: [
      {
        topicId: 'meritbridge-guaranteed-award',
        topicLabel: 'Guaranteed Award / Disbursement',
        stance: 'Disputes',
        phrases: [
          'guaranteed',
          'guarantee',
          'guarantees',
          '100% approval',
          '100 approval',
          'instant approval',
          'all applicants receive',
        ],
      },
      {
        topicId: 'meritbridge-third-party-sharing',
        topicLabel: 'Third-Party Data Sharing Restriction',
        stance: 'Disputes',
        phrases: [
          'never shares data',
          'never share data',
          'never shared',
          'not shared with third',
          'no third-party',
          'no third party',
          'without third-party',
          'without third party',
          'third-party data sharing',
          'third party data sharing',
        ],
      },
      {
        topicId: 'meritbridge-immediate-deletion',
        topicLabel: 'Immediate Document Deletion',
        stance: 'Disputes',
        phrases: [
          'deleted immediately',
          'delete immediately',
          'immediate deletion',
          'immediate document deletion',
          'documents are deleted',
        ],
      },
      {
        topicId: 'meritbridge-no-gov-id',
        topicLabel: 'Government ID Requirement',
        stance: 'Disputes',
        phrases: ['no government id', 'never requests government id', 'without government id'],
      },
    ],
    stance: 'Disputes',
    excerpt:
      'Sample Review Note (DEMO DATA): MeritBridge STEM Scholarship does NOT guarantee award disbursement for all applicants, and the fictional portal notice lacks verifiable commitments regarding immediate deletion or third-party data restrictions.',
    explanation:
      'Claims promising guaranteed disbursement, immediate document deletion without retention disclosure, or zero third-party data sharing conflict with the sample review record.',
    isDemoData: true,
    recordedDate: '2026-10-28',
  },
  {
    id: 'EV-DEMO-03',
    title: 'BrightFuture Community Grant Eligibility Summary (DEMO DATA)',
    sourceLabel: 'DEMO DATA · Fictional Municipal Education Directory',
    domainPattern: 'demo-brightfuture.example',
    entityKeywords: ['brightfuture', 'demo-brightfuture.example'],
    keywords: [
      'brightfuture',
      'community grant',
      'first-year engineering',
      'fee-free',
      'no fee',
      'no application fee',
      'demo-brightfuture.example',
    ],
    topicRules: [
      {
        topicId: 'brightfuture-fee-free-eligibility',
        topicLabel: 'Fee-Free First-Year Engineering Grant',
        stance: 'Supports',
        phrases: [
          'fee-free',
          'no fee',
          'no application fee',
          'zero fee',
          'first-year engineering',
          'enrolled first-year engineering',
          'community grant',
        ],
      },
    ],
    stance: 'Supports',
    excerpt:
      'Sample Directory Entry (DEMO DATA): BrightFuture Community Grant is a fee-free municipal bursary open to enrolled first-year engineering students.',
    explanation:
      'Matches the fictional municipal directory entry confirming fee-free eligibility for first-year engineering students.',
    isDemoData: true,
    recordedDate: '2026-09-19',
  },
  {
    id: 'EV-DEMO-04',
    title: 'QuickLoan Student Relief Unverified Fee Warning (DEMO DATA)',
    sourceLabel: 'DEMO DATA · Fictional Student Consumer Advisory',
    domainPattern: 'demo-quickloan-relief.example',
    entityKeywords: ['quickloan', 'demo-quickloan-relief.example'],
    keywords: [
      'quickloan',
      'student relief',
      'processing deposit',
      'upfront deposit',
      'prepaid card',
      'wire transfer',
      'demo-quickloan-relief.example',
    ],
    topicRules: [
      {
        topicId: 'quickloan-upfront-deposit',
        topicLabel: 'Upfront Processing Deposit Requirement',
        stance: 'Disputes',
        phrases: [
          'processing deposit',
          'upfront deposit',
          'prepaid card',
          'wire transfer',
          'legitimate deposit',
          'required deposit',
        ],
      },
    ],
    stance: 'Disputes',
    excerpt:
      'Sample Advisory (DEMO DATA): Legitimate student relief programs listed in the sample archive do not require upfront processing deposits via prepaid cards or wire transfers.',
    explanation:
      'Conflicts with sample advisory guidance warning against upfront processing deposits.',
    isDemoData: true,
    recordedDate: '2026-11-02',
  },
];

export const SCHOLARSHIP_DEMO_SCENARIO = {
  id: 'demo-scholarship-scenario',
  title: 'Fictional Scholarship Portal Assessment (DEMO DATA)',
  url: 'https://demo-meritbridge-scholarship.example/apply',
  claimText:
    'MeritBridge STEM Scholarship Portal (demo-meritbridge-scholarship.example): All applicants receive guaranteed grant disbursement. The application has no fee. Personal data is never shared with third parties. Uploaded documents are deleted immediately.',
  formAndNoticeText: `DEMO DATA — Fictional Scholarship Application Form (MeritBridge National STEM Scholarship)

Required Applicant Fields:
1. Student Full Name (First and Last Legal Name)
2. Personal Email Address (for application status updates)
3. Mobile Phone Number (for SMS verification)
4. Home Street Address, City, and Postal Code
5. Government ID Number (National ID / Passport / Driver License upload required before eligibility review)

Notice excerpt: By submitting this form, you consent to application processing. Data retention duration and external partner sharing terms are not specified on this page.`,
  expectedCategories: ['name', 'email', 'phone', 'address', 'government_id'] as DataCategoryId[],
};

export const CLAIM_PRESETS = [
  {
    id: 'preset-scholarship-disputed',
    label: 'Scholarship Demo (Multi-Claim · Disputed)',
    badge: 'DEMO DATA',
    input: SCHOLARSHIP_DEMO_SCENARIO.claimText,
  },
  {
    id: 'preset-brightfuture-supported',
    label: 'Community Grant (Supported)',
    badge: 'DEMO DATA',
    input:
      'BrightFuture Community Grant (demo-brightfuture.example) is a fee-free program for enrolled first-year engineering students.',
  },
  {
    id: 'preset-unmatched-inconclusive',
    label: 'Unverified Fellowship (Inconclusive)',
    badge: 'DEMO DATA',
    input:
      'NovaTech Global Fellowship 2027 covers 100% of overseas housing and laboratory stipends for all applicants.',
  },
];

export const PRIVACY_FORM_PRESETS = [
  {
    id: 'preset-scholarship-form',
    label: 'Fictional Scholarship Form (DEMO DATA)',
    text: SCHOLARSHIP_DEMO_SCENARIO.formAndNoticeText,
  },
  {
    id: 'preset-fintech-form',
    label: 'Fictional Wallet Onboarding Notice (DEMO DATA)',
    text: `DEMO DATA — Fictional Campus Wallet Sign-Up Form
Please provide your Full Name, University Email, Bank Account & Routing Number for direct payouts, Government Tax ID, and enable continuous GPS Location tracking to verify campus proximity.`,
  },
  {
    id: 'preset-newsletter-form',
    label: 'Minimal Newsletter Notice (DEMO DATA)',
    text: `DEMO DATA — Fictional Research Digest Subscription
Enter your Name and Email address to receive monthly seminar announcements. We retain your email only until you click unsubscribe.`,
  },
];
