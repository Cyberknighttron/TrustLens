import { SAMPLE_EVIDENCE_DATASET } from '../data/sampleDataset';
import {
  ClaimAnalysisResult,
  ClaimVerdict,
  EvidenceRelevance,
  SampleEvidenceItem,
  SubclaimEvaluation,
  SubclaimEvidenceMatch,
  UncertaintyLabel,
} from '../types/trustlens';

let claimSequence = 0;

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
  // when both sides represent independent assertions (>= 3 words each)
  const subclaims: string[] = [];
  for (const part of sentenceParts) {
    const clauses = part
      .split(/\s*(?:,\s+and\s+|\s+and\s+|\s+while\s+|\s+plus\s+|,\s+but\s+)\s*/i)
      .map((c) => c.trim())
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

  // Deduplicate identical subclaims while preserving order
  const unique: string[] = [];
  for (const item of restored) {
    if (!unique.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      unique.push(item);
    }
  }

  return unique.length > 0 ? unique : [trimmed];
}

function evaluateSubclaim(
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
      // Directly relevant to both the entity and this specific subclaim topic
      const primaryTopic = matchedTopics[0];
      evidenceMatches.push({
        evidence: item,
        relevance: primaryTopic.stance,
        matchReason: `Matches entity and subclaim topic (${primaryTopic.topicLabel}).`,
      });
    } else if (!hasEntityMatch && matchedTopics.length > 0) {
      // Topic matches a DEMO DATA record, but no matching entity/domain was named
      evidenceMatches.push({
        evidence: item,
        relevance: 'Partially Relevant',
        matchReason: `Topic overlap (${matchedTopics[0].topicLabel}), but the claim does not specify an entity/domain matching this DEMO DATA record.`,
      });
    } else if (hasEntityMatch && isUrlOnly) {
      // User submitted only a URL matching a DEMO DATA domain without a specific claim
      evidenceMatches.push({
        evidence: item,
        relevance: 'Partially Relevant',
        matchReason:
          'URL domain matches this DEMO DATA record, but no specific statement was provided to verify.',
      });
    }
  }

  // Fallback for entity-matched subclaim whose specific topic has no direct rule hit
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
    explanation = `Disputed by ${disputing.map((d) => d.evidence.id).join(', ')} (DEMO DATA): ${disputing[0].evidence.explanation}`;
  } else if (supporting.length > 0) {
    verdict = 'Supported';
    evidenceMatch = 'CONFIRMED';
    explanation = `Supported by ${supporting.map((s) => s.evidence.id).join(', ')} (DEMO DATA): ${supporting[0].evidence.explanation}`;
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

export function analyzeClaimAgainstDemoDataset(rawInput: string): ClaimAnalysisResult {
  const trimmed = rawInput.trim();
  const parentNormalized = normalizeText(trimmed);
  const inputType: 'claim' | 'url' = isUrlInput(trimmed) ? 'url' : 'claim';
  const isUrlOnly = inputType === 'url';

  const extractedTexts = decomposeClaims(trimmed);
  const subclaims = extractedTexts.map((text, idx) =>
    evaluateSubclaim(text, idx, parentNormalized, isUrlOnly)
  );

  // Aggregate unique matched evidence across subclaims, prioritizing direct stance over partial
  const evidenceMap = new Map<
    string,
    { evidence: SampleEvidenceItem; relevance: EvidenceRelevance; matchReason: string }
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
        ? 'No matching domain or entry was found in the local DEMO DATA sample evidence dataset. TrustLens does not fetch or inspect live websites, so verification returns Inconclusive.'
        : 'No matching record was found in the local DEMO DATA sample evidence dataset. Because TrustLens does not invent sources or perform live verification, this claim returns Inconclusive.';
  }

  return {
    id: `CLM-${Date.now().toString(36).toUpperCase()}-${(++claimSequence).toString(36).toUpperCase()}`,
    input: trimmed,
    inputType,
    verdict,
    uncertainty: evidenceMatchStatus,
    evidenceMatchStatus,
    explanation,
    verificationBoundary:
      inputType === 'url'
        ? 'URL Transparency Notice: TrustLens does NOT fetch, crawl, or inspect live websites. URL verification checks only the entered domain and text against the built-in DEMO DATA sample evidence dataset.'
        : 'Prototype Verification Notice: Statements are decomposed and checked strictly against the built-in DEMO DATA sample evidence dataset. This is not a live external fact-check.',
    subclaims,
    matchedEvidence,
    analyzedAt: new Date().toISOString(),
    isDemoMatch: matchedEvidence.length > 0,
  };
}
