import { SAMPLE_EVIDENCE_DATASET } from '../data/sampleDataset';
import {
  ClaimAnalysisResult,
  ClaimVerdict,
  ClaimVerificationMode,
  EvidenceRecord,
  EvidenceRelevance,
  SubclaimEvaluation,
  SubclaimEvidenceMatch,
  UncertaintyLabel,
} from '../types/trustlens';

let claimSequence = 0;

interface LiveApiItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  provider: string;
  retrievedAt: string;
}

interface LiveApiResponse {
  status: 'ok' | 'no_results' | 'unavailable' | 'error';
  message: string;
  items: LiveApiItem[];
}

const LIVE_STOPWORDS = new Set([
  'about',
  'after',
  'all',
  'also',
  'always',
  'and',
  'any',
  'are',
  'because',
  'been',
  'between',
  'both',
  'but',
  'can',
  'claim',
  'claims',
  'could',
  'does',
  'each',
  'every',
  'for',
  'from',
  'has',
  'have',
  'how',
  'into',
  'its',
  'may',
  'more',
  'most',
  'only',
  'our',
  'over',
  'some',
  'such',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'under',
  'use',
  'used',
  'uses',
  'using',
  'very',
  'was',
  'way',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'will',
  'with',
  'would',
  'you',
  'your',
  'not',
  'out',
  'off',
  'one',
  'two',
  'did',
  'does',
  'had',
  'her',
  'him',
  'his',
  'she',
  'now',
  'how',
  'why',
  'yes',
]);

const CONTRADICTION_MARKERS = [
  'disproven',
  'pseudoscientific',
  'pseudoscience',
  'scientifically false',
  'debunked',
  'conspiracy theory',
  'misconception',
  'unfounded',
  'false claim',
  'no evidence',
  'does not cure',
  'do not cure',
  'not effective',
  'cannot cure',
  'myth',
  'hoax',
  'incorrect',
  'refuted',
  'contradicted',
];

function isUrlInput(raw: string): boolean {
  const trimmed = raw.trim();
  return (
    (/^https?:\/\/\S+$/i.test(trimmed) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(trimmed)) &&
    !/\s/.test(trimmed)
  );
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.%\s/-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractContentKeywords(text: string): string[] {
  const words = normalizeText(text)
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !LIVE_STOPWORDS.has(w));
  return Array.from(new Set(words));
}

function hasDemoEntityReference(normalized: string): boolean {
  return SAMPLE_EVIDENCE_DATASET.some((item) =>
    item.entityKeywords.some((ek) => normalized.includes(ek.toLowerCase()))
  );
}

/**
 * Decomposes multi-statement input into individual subclaims while protecting URLs/domains
 * from being split on dots.
 */
export function decomposeClaims(rawInput: string): string[] {
  const trimmed = rawInput.trim();
  if (!trimmed) return [];
  if (isUrlInput(trimmed)) return [trimmed];

  // Protect domains/URLs so dots inside hostnames do not trigger sentence splits
  const protectedTokens: string[] = [];
  let working = trimmed.replace(
    /(?:https?:\/\/[^\s)]+|[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s)]*)?)/gi,
    (match) => {
      const token = `__URL_TOKEN_${protectedTokens.length}__`;
      protectedTokens.push(match);
      return token;
    }
  );

  // Strip a pure intro header like "MeritBridge Portal (__URL__): ..." while keeping context in parent input
  const colonIdx = working.indexOf(':');
  if (colonIdx > 0 && colonIdx < 95) {
    const beforeColon = working.slice(0, colonIdx).trim();
    const afterColon = working.slice(colonIdx + 1).trim();
    if (afterColon.length >= 10 && beforeColon.split(/\s+/).length <= 12) {
      working = afterColon;
    }
  }

  // Normalize bullet points and newlines into sentence breaks
  working = working
    .replace(/\r\n/g, '\n')
    .replace(/\n+\s*(?:[-*•]|\d+[.)])\s+/g, '. ')
    .replace(/\n+/g, '. ');

  // Split on sentence punctuation or semicolons
  const sentenceParts = working
    .split(/(?:[;!?]+|\.(?=\s|$))/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  // Further split compound sentences connected by ", and ", " and ", " while ", " plus "
  // while preserving prepositional pairs such as "between X and Y".
  const subclaims: string[] = [];
  for (const part of sentenceParts) {
    const protectedBetween = part.replace(
      /\bbetween\s+([^,;.]+?)\s+and\s+([^,;.]+)/gi,
      (_full, a: string, b: string) => `between ${a} __BETWEEN_AND__ ${b}`
    );
    const clauses = protectedBetween
      .split(/\s*(?:,\s+and\s+|\s+and\s+|\s+while\s+|\s+plus\s+|,\s+but\s+)\s*/i)
      .map((c) => c.replace(/__BETWEEN_AND__/g, 'and').trim())
      .filter(Boolean);

    if (clauses.length > 1 && clauses.every((c) => c.split(/\s+/).length >= 3)) {
      subclaims.push(...clauses);
    } else {
      subclaims.push(part);
    }
  }

  // Restore protected URL/domain tokens and clean trailing punctuation
  const restored = subclaims
    .map((s) => {
      let out = s;
      protectedTokens.forEach((orig, idx) => {
        out = out.replace(new RegExp(`__URL_TOKEN_${idx}__`, 'g'), orig);
      });
      return out.replace(/^[-•*\s]+/, '').replace(/[.,;:\s]+$/, '').trim();
    })
    .filter((s) => s.length >= 4);

  const unique: string[] = [];
  for (const item of restored) {
    if (!unique.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      unique.push(item);
    }
  }

  return unique.length > 0 ? unique : [trimmed];
}

function evaluateSubclaimAgainstDemo(
  subclaimText: string,
  index: number,
  parentNormalized: string,
  isUrlOnly: boolean
): SubclaimEvaluation {
  const subNorm = normalizeText(subclaimText);
  const evidenceMatches: SubclaimEvidenceMatch[] = [];

  for (const item of SAMPLE_EVIDENCE_DATASET) {
    const entityMatchedInSubclaim = item.entityKeywords.some((ek) =>
      subNorm.includes(ek.toLowerCase())
    );
    const entityMatchedInParent = item.entityKeywords.some((ek) =>
      parentNormalized.includes(ek.toLowerCase())
    );
    const hasEntityMatch = entityMatchedInSubclaim || entityMatchedInParent;

    const matchedTopics = item.topicRules.filter((rule) =>
      rule.phrases.some((phrase) => subNorm.includes(phrase.toLowerCase()))
    );

    if (hasEntityMatch && matchedTopics.length > 0) {
      const primaryTopic = matchedTopics[0];
      evidenceMatches.push({
        evidence: item,
        relevance: primaryTopic.stance,
        matchReason: `Matches entity and subclaim topic (${primaryTopic.topicLabel}).`,
      });
    } else if (!hasEntityMatch && matchedTopics.length > 0) {
      evidenceMatches.push({
        evidence: item,
        relevance: 'Partially Relevant',
        matchReason: `Topic overlap (${matchedTopics[0].topicLabel}), but the claim does not specify an entity/domain matching this DEMO DATA record.`,
      });
    } else if (hasEntityMatch && isUrlOnly) {
      evidenceMatches.push({
        evidence: item,
        relevance: 'Partially Relevant',
        matchReason:
          'URL domain matches this DEMO DATA record, but no specific statement was provided to verify.',
      });
    }
  }

  if (evidenceMatches.length === 0) {
    for (const item of SAMPLE_EVIDENCE_DATASET) {
      const hasEntityMatch = item.entityKeywords.some((ek) =>
        parentNormalized.includes(ek.toLowerCase())
      );
      if (hasEntityMatch) {
        evidenceMatches.push({
          evidence: item,
          relevance: 'Partially Relevant',
          matchReason:
            'Shares the referenced entity/domain in DEMO DATA, but this record does not address this specific subclaim assertion.',
        });
      }
    }
  }

  const disputing = evidenceMatches.filter((m) => m.relevance === 'Disputes');
  const supporting = evidenceMatches.filter((m) => m.relevance === 'Supports');
  const partial = evidenceMatches.filter((m) => m.relevance === 'Partially Relevant');

  let verdict: ClaimVerdict = 'Inconclusive';
  let evidenceMatch: UncertaintyLabel = 'UNKNOWN';
  let explanation = '';

  if (disputing.length > 0) {
    verdict = 'Disputed';
    evidenceMatch = 'CONFIRMED';
    const firstDispute = SAMPLE_EVIDENCE_DATASET.find((d) => d.id === disputing[0].evidence.id);
    explanation = `Disputed by ${disputing.map((d) => d.evidence.id).join(', ')} (DEMO DATA): ${
      firstDispute?.explanation ?? disputing[0].evidence.excerpt
    }`;
  } else if (supporting.length > 0) {
    verdict = 'Supported';
    evidenceMatch = 'CONFIRMED';
    const firstSupport = SAMPLE_EVIDENCE_DATASET.find((d) => d.id === supporting[0].evidence.id);
    explanation = `Supported by ${supporting.map((s) => s.evidence.id).join(', ')} (DEMO DATA): ${
      firstSupport?.explanation ?? supporting[0].evidence.excerpt
    }`;
  } else if (partial.length > 0) {
    verdict = 'Inconclusive';
    evidenceMatch = 'INFERRED';
    explanation = isUrlOnly
      ? 'The URL domain matches DEMO DATA records, but no specific claim statement was supplied to support or dispute.'
      : 'Only partially relevant DEMO DATA records were found (entity or topic overlap without direct confirmation/refutation of this subclaim). Verdict remains Inconclusive.';
  } else {
    verdict = 'Inconclusive';
    evidenceMatch = 'UNKNOWN';
    explanation =
      'No relevant records were found in the local DEMO DATA sample evidence dataset for this subclaim.';
  }

  return {
    id: `SC-${index + 1}`,
    text: subclaimText,
    verdict,
    evidenceMatch,
    explanation,
    evidenceMatches,
  };
}

export function analyzeClaimAgainstDemoDataset(
  rawInput: string,
  overrideRetrievalStatus?: string
): ClaimAnalysisResult {
  const trimmed = rawInput.trim();
  const parentNormalized = normalizeText(trimmed);
  const inputType: 'claim' | 'url' = isUrlInput(trimmed) ? 'url' : 'claim';
  const isUrlOnly = inputType === 'url';

  const extractedTexts = decomposeClaims(trimmed);
  const subclaims = extractedTexts.map((text, idx) =>
    evaluateSubclaimAgainstDemo(text, idx, parentNormalized, isUrlOnly)
  );

  const evidenceMap = new Map<
    string,
    { evidence: EvidenceRecord; relevance: EvidenceRelevance; matchReason: string }
  >();

  for (const sc of subclaims) {
    for (const m of sc.evidenceMatches) {
      const existing = evidenceMap.get(m.evidence.id);
      if (!existing) {
        evidenceMap.set(m.evidence.id, m);
      } else if (
        existing.relevance === 'Partially Relevant' &&
        (m.relevance === 'Supports' || m.relevance === 'Disputes')
      ) {
        evidenceMap.set(m.evidence.id, m);
      }
    }
  }

  const matchedEvidence = Array.from(evidenceMap.values());

  const disputedSubs = subclaims.filter((s) => s.verdict === 'Disputed');
  const supportedSubs = subclaims.filter((s) => s.verdict === 'Supported');
  const inconclusiveSubs = subclaims.filter((s) => s.verdict === 'Inconclusive');

  let verdict: ClaimVerdict = 'Inconclusive';
  let evidenceMatchStatus: UncertaintyLabel = 'UNKNOWN';
  let explanation = '';

  if (disputedSubs.length > 0) {
    verdict = 'Disputed';
    evidenceMatchStatus = 'CONFIRMED';
    explanation = `Overall verdict is Disputed: ${disputedSubs.length} of ${subclaims.length} subclaim(s) conflict with DEMO DATA sample evidence (${disputedSubs.map((s) => s.id).join(', ')})${
      supportedSubs.length > 0
        ? `, while ${supportedSubs.length} subclaim(s) (${supportedSubs.map((s) => s.id).join(', ')}) are supported`
        : ''
    }${
      inconclusiveSubs.length > 0
        ? ` and ${inconclusiveSubs.length} subclaim(s) remain Inconclusive`
        : ''
    }.`;
  } else if (subclaims.length > 0 && supportedSubs.length === subclaims.length) {
    verdict = 'Supported';
    evidenceMatchStatus = 'CONFIRMED';
    explanation =
      subclaims.length === 1
        ? supportedSubs[0].explanation
        : `All ${subclaims.length} extracted subclaims are directly supported by matching DEMO DATA sample evidence.`;
  } else if (supportedSubs.length > 0 && inconclusiveSubs.length > 0) {
    verdict = 'Inconclusive';
    evidenceMatchStatus = 'INFERRED';
    explanation = `${supportedSubs.length} subclaim(s) matched supporting DEMO DATA evidence (${supportedSubs.map((s) => s.id).join(', ')}), but ${inconclusiveSubs.length} subclaim(s) (${inconclusiveSubs.map((s) => s.id).join(', ')}) lack sufficient evidence. Overall claim verdict is Inconclusive.`;
  } else if (matchedEvidence.some((m) => m.relevance === 'Partially Relevant')) {
    verdict = 'Inconclusive';
    evidenceMatchStatus = 'INFERRED';
    explanation =
      inputType === 'url'
        ? 'The entered URL matches a domain in the local DEMO DATA dataset, but TrustLens does not fetch or inspect live external websites, and no specific verifiable claim statement was provided.'
        : 'Only partially relevant DEMO DATA records were found; insufficient direct evidence exists to support or dispute the claim.';
  } else {
    verdict = 'Inconclusive';
    evidenceMatchStatus = 'UNKNOWN';
    explanation =
      inputType === 'url'
        ? 'No matching domain or entry was found in the local DEMO DATA sample evidence dataset. TrustLens does not crawl arbitrary URLs, so verification returns Inconclusive.'
        : 'No matching record was found in the local DEMO DATA sample evidence dataset. Because TrustLens does not invent sources, this claim returns Inconclusive.';
  }

  return {
    id: `CLM-${Date.now().toString(36).toUpperCase()}-${(++claimSequence).toString(36).toUpperCase()}`,
    input: trimmed,
    inputType,
    verdict,
    uncertainty: evidenceMatchStatus,
    evidenceMatchStatus,
    sourceMode: 'Built-in Demo Dataset',
    retrievalStatus:
      overrideRetrievalStatus ??
      (matchedEvidence.length > 0
        ? `Matched ${matchedEvidence.length} record(s) in Built-in Demo Dataset`
        : 'No matching records in Built-in Demo Dataset'),
    explanation,
    verificationBoundary:
      inputType === 'url'
        ? 'Demo Dataset Mode: Checked entered URL against the built-in DEMO DATA sample evidence dataset. TrustLens does not crawl live website pages.'
        : 'Built-in Demo Dataset Mode: Statements are decomposed and checked against built-in DEMO DATA records rather than live web search.',
    subclaims,
    matchedEvidence,
    analyzedAt: new Date().toISOString(),
    isDemoMatch: matchedEvidence.length > 0,
  };
}

function evaluateSubclaimAgainstLiveItems(
  subclaimText: string,
  index: number,
  liveItems: LiveApiItem[]
): SubclaimEvaluation {
  const subNorm = normalizeText(subclaimText);
  const subKeywords = extractContentKeywords(subclaimText);
  const subHasNegation = /\b(not|never|no|none|cannot|can't|doesn't|don't|isn't|aren't)\b/.test(
    subNorm
  );

  const evidenceMatches: SubclaimEvidenceMatch[] = liveItems.map((item) => {
    const combinedText = `${item.title} ${item.summary}`.toLowerCase();
    const matchedWords = subKeywords.filter(
      (kw) => combinedText.includes(kw) || combinedText.includes(kw.slice(0, Math.max(4, kw.length - 1)))
    );
    const overlapRatio = subKeywords.length > 0 ? matchedWords.length / subKeywords.length : 0;

    const record: EvidenceRecord = {
      id: item.id,
      title: item.title,
      sourceLabel: item.provider,
      excerpt: item.summary,
      recordedDate: item.retrievedAt.slice(0, 10),
      isDemoData: false,
      url: item.url,
    };

    if (matchedWords.length < 2 || overlapRatio < 0.25) {
      return {
        evidence: record,
        relevance: 'Unrelated',
        matchReason:
          matchedWords.length === 0
            ? 'Retrieved article does not share key topic terms with this subclaim.'
            : `Low keyword overlap (${matchedWords.length}/${subKeywords.length} terms); treated as unrelated so it cannot skew the verdict.`,
      };
    }

    const hitContradictionMarker = CONTRADICTION_MARKERS.find((marker) =>
      combinedText.includes(marker)
    );

    // Also check opposite negation polarity when subclaim is affirmative
    const summaryHasNegation = /\b(not|never|no evidence|does not|do not|cannot|neither)\b/.test(
      combinedText
    );
    const polarityConflict = !subHasNegation && summaryHasNegation && hitContradictionMarker !== undefined;

    if (hitContradictionMarker && (!subHasNegation || polarityConflict)) {
      return {
        evidence: record,
        relevance: 'Disputes',
        matchReason: `Retrieved summary overlaps on [${matchedWords.slice(0, 4).join(', ')}] and contains contradicting language ("${hitContradictionMarker}").`,
      };
    }

    // Check strong contextual support (high topic overlap + matching affirmative/negative tone)
    if (matchedWords.length >= 3 || overlapRatio >= 0.45) {
      return {
        evidence: record,
        relevance: 'Supports',
        matchReason: `Contextual alignment across ${matchedWords.length} key terms [${matchedWords.slice(0, 4).join(', ')}] with no contradicting cues.`,
      };
    }

    return {
      evidence: record,
      relevance: 'Partially Relevant',
      matchReason: `Partial topic overlap [${matchedWords.slice(0, 3).join(', ')}]; summary does not directly confirm or refute the full subclaim.`,
    };
  });

  const disputing = evidenceMatches.filter((m) => m.relevance === 'Disputes');
  const supporting = evidenceMatches.filter((m) => m.relevance === 'Supports');
  const partial = evidenceMatches.filter((m) => m.relevance === 'Partially Relevant');

  let verdict: ClaimVerdict = 'Inconclusive';
  let evidenceMatch: UncertaintyLabel = 'UNKNOWN';
  let explanation = '';

  if (disputing.length > 0) {
    verdict = 'Disputed';
    evidenceMatch = 'INFERRED';
    explanation = `Retrieved public source "${disputing[0].evidence.title}" contains contradicting evidence regarding this statement. Public summaries indicate a dispute, though search snippets alone are not formal proof.`;
  } else if (supporting.length > 0) {
    verdict = 'Supported';
    evidenceMatch = 'INFERRED';
    explanation = `Retrieved public source "${supporting[0].evidence.title}" aligns contextually with this statement. Note: a public search summary provides supporting context and does not independently prove absolute truth.`;
  } else if (partial.length > 0) {
    verdict = 'Inconclusive';
    evidenceMatch = 'INFERRED';
    explanation =
      'Retrieved public summaries only partially overlap with this subclaim and are insufficient to support or dispute it.';
  } else {
    verdict = 'Inconclusive';
    evidenceMatch = 'UNKNOWN';
    explanation =
      'Retrieved public sources were unrelated to this specific subclaim. Insufficient reliable evidence is available.';
  }

  return {
    id: `SC-${index + 1}`,
    text: subclaimText,
    verdict,
    evidenceMatch,
    explanation,
    evidenceMatches,
  };
}

export async function analyzeClaimWithLiveFallback(
  rawInput: string,
  mode: ClaimVerificationMode = 'auto'
): Promise<ClaimAnalysisResult> {
  const trimmed = rawInput.trim();
  const parentNormalized = normalizeText(trimmed);
  const inputType: 'claim' | 'url' = isUrlInput(trimmed) ? 'url' : 'claim';

  // Use Built-in Demo Dataset when Demo Only mode is selected or input references fictional DEMO DATA entities
  if (mode === 'demo_only' || hasDemoEntityReference(parentNormalized)) {
    return analyzeClaimAgainstDemoDataset(
      trimmed,
      mode === 'demo_only'
        ? 'Demo Dataset Only mode selected — evaluated locally against DEMO DATA'
        : 'Matched fictional DEMO DATA entity — evaluated locally against Built-in Demo Dataset'
    );
  }

  const extractedTexts = decomposeClaims(trimmed);

  try {
    const response = await fetch('/api/evidence/retrieve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed, subclaims: extractedTexts }),
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return analyzeClaimAgainstDemoDataset(
        trimmed,
        `Live retrieval service returned HTTP ${response.status} — fell back to Built-in Demo Dataset`
      );
    }

    const data = (await response.json()) as LiveApiResponse;

    if (data.status === 'unavailable' || data.status === 'error') {
      return analyzeClaimAgainstDemoDataset(
        trimmed,
        `${data.message} (Fallback: Built-in Demo Dataset)`
      );
    }

    if (data.status === 'no_results' || !Array.isArray(data.items) || data.items.length === 0) {
      return {
        id: `CLM-${Date.now().toString(36).toUpperCase()}-${(++claimSequence).toString(36).toUpperCase()}`,
        input: trimmed,
        inputType,
        verdict: 'Inconclusive',
        uncertainty: 'UNKNOWN',
        evidenceMatchStatus: 'UNKNOWN',
        sourceMode: 'Live Evidence Retrieval',
        retrievalStatus: data.message || 'No matching public evidence found',
        explanation:
          'Live public retrieval (Wikipedia & DuckDuckGo) found no relevant sources for this query. Because reliable evidence is unavailable, the verdict is Inconclusive.',
        verificationBoundary:
          'Live Evidence Retrieval Notice: Queries public Wikipedia and DuckDuckGo summaries without paid APIs. TrustLens never fabricates sources or citations when retrieval returns no matches.',
        subclaims: extractedTexts.map((text, idx) => ({
          id: `SC-${idx + 1}`,
          text,
          verdict: 'Inconclusive',
          evidenceMatch: 'UNKNOWN',
          explanation: 'No relevant public sources retrieved for this subclaim.',
          evidenceMatches: [],
        })),
        matchedEvidence: [],
        analyzedAt: new Date().toISOString(),
        isDemoMatch: false,
      };
    }

    // Evaluate each subclaim against retrieved live items
    const subclaims = extractedTexts.map((text, idx) =>
      evaluateSubclaimAgainstLiveItems(text, idx, data.items)
    );

    // Aggregate unique retrieved evidence items, prioritizing Disputes > Supports > Partially Relevant > Unrelated
    const priority: Record<EvidenceRelevance, number> = {
      Disputes: 4,
      Supports: 3,
      'Partially Relevant': 2,
      Unrelated: 1,
    };

    const evidenceMap = new Map<
      string,
      { evidence: EvidenceRecord; relevance: EvidenceRelevance; matchReason: string }
    >();

    for (const sc of subclaims) {
      for (const m of sc.evidenceMatches) {
        const existing = evidenceMap.get(m.evidence.id);
        if (!existing || priority[m.relevance] > priority[existing.relevance]) {
          evidenceMap.set(m.evidence.id, m);
        }
      }
    }

    const matchedEvidence = Array.from(evidenceMap.values());
    const disputedSubs = subclaims.filter((s) => s.verdict === 'Disputed');
    const supportedSubs = subclaims.filter((s) => s.verdict === 'Supported');
    const inconclusiveSubs = subclaims.filter((s) => s.verdict === 'Inconclusive');

    let verdict: ClaimVerdict = 'Inconclusive';
    let evidenceMatchStatus: UncertaintyLabel = 'UNKNOWN';
    let explanation = '';

    if (disputedSubs.length > 0) {
      verdict = 'Disputed';
      evidenceMatchStatus = 'INFERRED';
      explanation = `Live Evidence Retrieval found contradicting public summary evidence for ${disputedSubs.length} of ${subclaims.length} subclaim(s) (${disputedSubs.map((s) => s.id).join(', ')}). Review the retrieved excerpts below—search summaries alone do not constitute formal verification.`;
    } else if (subclaims.length > 0 && supportedSubs.length === subclaims.length) {
      verdict = 'Supported';
      evidenceMatchStatus = 'INFERRED';
      explanation = `Retrieved public evidence contextually aligns with all ${subclaims.length} subclaim(s). Note: a search summary provides supporting context and does not independently prove a claim.`;
    } else if (supportedSubs.length > 0 && inconclusiveSubs.length > 0) {
      verdict = 'Inconclusive';
      evidenceMatchStatus = 'INFERRED';
      explanation = `${supportedSubs.length} subclaim(s) showed contextual alignment, while ${inconclusiveSubs.length} subclaim(s) lacked sufficient reliable evidence. Overall verdict remains Inconclusive.`;
    } else {
      verdict = 'Inconclusive';
      evidenceMatchStatus = matchedEvidence.some((m) => m.relevance === 'Partially Relevant')
        ? 'INFERRED'
        : 'UNKNOWN';
      explanation =
        'Retrieved public sources were only partially relevant or unrelated to the specific assertions. Insufficient reliable evidence is available to support or dispute the claim.';
    }

    return {
      id: `CLM-${Date.now().toString(36).toUpperCase()}-${(++claimSequence).toString(36).toUpperCase()}`,
      input: trimmed,
      inputType,
      verdict,
      uncertainty: evidenceMatchStatus,
      evidenceMatchStatus,
      sourceMode: 'Live Evidence Retrieval',
      retrievalStatus: data.message,
      explanation,
      verificationBoundary:
        inputType === 'url'
          ? 'Live Evidence Retrieval Notice: Public summaries were retrieved via Wikipedia & DuckDuckGo using domain/topic keywords. TrustLens does not crawl arbitrary live web pages, and search snippets alone do not prove a claim.'
          : 'Live Evidence Retrieval Notice: Public summaries were retrieved via Wikipedia & DuckDuckGo (free, no-key APIs). Search results provide contextual evidence only and do not independently prove a claim.',
      subclaims,
      matchedEvidence,
      analyzedAt: new Date().toISOString(),
      isDemoMatch: false,
    };
  } catch {
    return analyzeClaimAgainstDemoDataset(
      trimmed,
      'Live retrieval unavailable (offline or proxy unreachable) — fell back to Built-in Demo Dataset'
    );
  }
}
