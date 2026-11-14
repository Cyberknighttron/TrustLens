import {
  ClaimAnalysisResult,
  PrivacyAnalysisResult,
  ReportFindingItem,
  UnifiedTrustLensReport,
  WhatIfScenarioOutcome,
} from '../types/trustlens';

let reportSequence = 0;

export function buildUnifiedReport(params: {
  title: string;
  isDemoScenario: boolean;
  claimAnalysis: ClaimAnalysisResult | null;
  privacyAnalysis: PrivacyAnalysisResult | null;
  whatIfOutcomes: WhatIfScenarioOutcome[];
}): UnifiedTrustLensReport {
  const { title, isDemoScenario, claimAnalysis, privacyAnalysis, whatIfOutcomes } = params;

  const confirmedFindings: ReportFindingItem[] = [];
  const inferredFindings: ReportFindingItem[] = [];
  const unknownFindings: ReportFindingItem[] = [];

  if (claimAnalysis) {
    if (claimAnalysis.subclaims.length > 0) {
      for (const sc of claimAnalysis.subclaims) {
        const sourceTag =
          claimAnalysis.sourceMode === 'Live Evidence Retrieval'
            ? 'Live Evidence Retrieval'
            : 'DEMO DATA';
        const statement =
          sc.verdict === 'Disputed'
            ? `Subclaim ${sc.id} ("${sc.text}") has verdict Disputed (Evidence Match: ${sc.evidenceMatch} via ${sourceTag}).`
            : sc.verdict === 'Supported'
              ? `Subclaim ${sc.id} ("${sc.text}") has verdict Supported (Evidence Match: ${sc.evidenceMatch} via ${sourceTag}).`
              : `Subclaim ${sc.id} ("${sc.text}") is Inconclusive (Evidence Match: ${sc.evidenceMatch} via ${sourceTag}).`;

        const item: ReportFindingItem = {
          category: 'Claim',
          statement,
          uncertainty: sc.evidenceMatch,
        };
        if (sc.evidenceMatch === 'CONFIRMED') confirmedFindings.push(item);
        else if (sc.evidenceMatch === 'INFERRED') inferredFindings.push(item);
        else unknownFindings.push(item);
      }
    } else {
      const claimItem: ReportFindingItem = {
        category: 'Claim',
        statement: `Claim verdict is "${claimAnalysis.verdict}" (Evidence Match: ${claimAnalysis.evidenceMatchStatus}) — ${claimAnalysis.explanation}`,
        uncertainty: claimAnalysis.evidenceMatchStatus,
      };
      if (claimAnalysis.evidenceMatchStatus === 'CONFIRMED') confirmedFindings.push(claimItem);
      else if (claimAnalysis.evidenceMatchStatus === 'INFERRED') inferredFindings.push(claimItem);
      else unknownFindings.push(claimItem);
    }
  } else {
    unknownFindings.push({
      category: 'Claim',
      statement: 'No claim or URL has been analyzed yet.',
      uncertainty: 'UNKNOWN',
    });
  }

  if (privacyAnalysis) {
    for (const cat of privacyAnalysis.detectedCategories) {
      const catItem: ReportFindingItem = {
        category: 'Privacy',
        statement: `${cat.label} (${cat.sensitivity} individual sensitivity) detected via indicators: ${cat.matchedIndicators.join(', ')}.`,
        uncertainty: cat.uncertainty,
      };
      if (cat.uncertainty === 'CONFIRMED') confirmedFindings.push(catItem);
      else if (cat.uncertainty === 'INFERRED') inferredFindings.push(catItem);
      else unknownFindings.push(catItem);
    }

    inferredFindings.push({
      category: 'Privacy',
      statement: `Aggregate privacy risk rated ${privacyAnalysis.overallSensitivity} (score ${privacyAnalysis.riskScore}/${privacyAnalysis.maxPossibleScore} across ${privacyAnalysis.detectedCategories.length} detected categories).`,
      uncertainty: 'INFERRED',
    });

    if (privacyAnalysis.missingDisclosures.length > 0) {
      unknownFindings.push({
        category: 'Privacy',
        statement: `Undisclosed privacy practices in submitted text: ${privacyAnalysis.missingDisclosures.join('; ')}.`,
        uncertainty: 'UNKNOWN',
      });
    }
  } else {
    unknownFindings.push({
      category: 'Privacy',
      statement: 'No form or privacy notice text has been analyzed yet.',
      uncertainty: 'UNKNOWN',
    });
  }

  for (const scenario of whatIfOutcomes) {
    const item: ReportFindingItem = {
      category: 'Scenario',
      statement: `${scenario.title}: Reversibility is ${scenario.reversibility}. ${scenario.reversibilityRationale}`,
      uncertainty: scenario.uncertainty,
    };
    if (scenario.uncertainty === 'CONFIRMED') confirmedFindings.push(item);
    else if (scenario.uncertainty === 'INFERRED') inferredFindings.push(item);
    else unknownFindings.push(item);
  }

  // Generate tailored, actionable recommendations
  const recommendations: string[] = [];

  if (claimAnalysis?.verdict === 'Disputed') {
    recommendations.push(
      `Pause before trusting or submitting personal data: the analyzed claim conflicted with ${
        claimAnalysis.sourceMode === 'Live Evidence Retrieval'
          ? 'retrieved public evidence summaries'
          : 'DEMO DATA sample evidence entries'
      }.`
    );
  } else if (!claimAnalysis || claimAnalysis.verdict === 'Inconclusive') {
    recommendations.push(
      'Independently verify the organization through official institutional directories before trusting unverified claims.'
    );
  }

  if (privacyAnalysis?.detectedCategories.some((c) => c.categoryId === 'government_id')) {
    recommendations.push(
      'Do not upload or enter Government ID numbers on unverified web forms; request an accredited institutional verification alternative.'
    );
  }

  if (privacyAnalysis?.detectedCategories.some((c) => c.categoryId === 'financial')) {
    recommendations.push(
      'Withhold bank account, routing, or payment card information during initial eligibility screening.'
    );
  }

  if (privacyAnalysis && privacyAnalysis.missingDisclosures.length > 0) {
    recommendations.push(
      'Look for explicit retention limits, third-party sharing restrictions, and a consent-withdrawal contact before proceeding.'
    );
  }

  if (privacyAnalysis?.detectedCategories.some((c) => c.categoryId === 'email' || c.categoryId === 'phone')) {
    recommendations.push(
      'Use a dedicated secondary or alias email address to limit cross-service tracking and spam exposure.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Complete both Claim Verification and Privacy Risk Assessment to receive tailored risk-mitigation steps.'
    );
  }

  return {
    id: `RPT-${Date.now().toString(36).toUpperCase()}-${(++reportSequence).toString(36).toUpperCase()}`,
    title,
    generatedAt: new Date().toISOString(),
    isDemoScenario,
    claimAnalysis,
    privacyAnalysis,
    whatIfOutcomes,
    confirmedFindings,
    inferredFindings,
    unknownFindings,
    recommendations,
  };
}
