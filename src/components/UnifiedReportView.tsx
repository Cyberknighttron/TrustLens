import { CheckCircle2, FileText, Play, Printer, Save } from 'lucide-react';
import { UNCERTAINTY_DEFINITIONS } from '../data/sampleDataset';
import { UnifiedTrustLensReport } from '../types/trustlens';
import {
  ReversibilityIndicator,
  SensitivityIndicator,
  UncertaintyTag,
  VerdictIndicator,
} from './UncertaintyTag';

interface UnifiedReportViewProps {
  report: UnifiedTrustLensReport;
  isViewingArchived: boolean;
  onSaveToHistory: () => void;
  onReturnToLiveWorkspace: () => void;
  onRunScholarshipDemo: () => void;
}

export function UnifiedReportView({
  report,
  isViewingArchived,
  onSaveToHistory,
  onReturnToLiveWorkspace,
  onRunScholarshipDemo,
}: UnifiedReportViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const hasAnyAnalysis = report.claimAnalysis !== null || report.privacyAnalysis !== null;

  return (
    <div className="space-y-6 print-container">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="no-print flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#111A2E] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">
            {isViewingArchived ? 'Viewing Saved History Report' : 'Live Workspace Report'}
          </p>
          <p className="font-mono text-xs text-slate-300 tabular-nums">
            {report.id} · Generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isViewingArchived ? (
            <button
              type="button"
              onClick={onReturnToLiveWorkspace}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <span>Return to Live Workspace</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSaveToHistory}
              disabled={!hasAnyAnalysis}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save to Recent Reports</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Empty Prompt when neither Claim nor Privacy has been run */}
      {!hasAnyAnalysis && (
        <section className="no-print rounded-xl border border-dashed border-slate-800 bg-[#0E1629] px-6 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
          <h2 className="mt-3 font-display text-sm font-semibold text-slate-200">
            Workspace Report Is Empty
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-400">
            Run a Claim Verification or Privacy Risk Assessment first, or click below to populate a
            complete end-to-end report with the Fictional Scholarship Demo.
          </p>
          <button
            type="button"
            onClick={onRunScholarshipDemo}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Run Scholarship Demo</span>
          </button>
        </section>
      )}

      {/* Printable Report Document */}
      <article className="space-y-6">
        {/* Document Header */}
        <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 print-card">
          <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-xs text-blue-400 print-muted">
                TRUSTLENS UNIFIED ASSESSMENT REPORT
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-slate-100 print-heading">
                {report.title}
              </h1>
            </div>
            <div className="text-left sm:text-right font-mono text-xs text-slate-400 print-muted tabular-nums">
              <p>{report.id}</p>
              <p>{new Date(report.generatedAt).toLocaleString()}</p>
              {report.isDemoScenario && (
                <p className="mt-1 font-semibold text-violet-300">DEMO DATA SCENARIO</p>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-400 print-muted">
            Disclaimer: This report reflects transparent, rule-based evaluation inside the TrustLens
            browser prototype. Sample evidence matches are strictly from built-in DEMO DATA records,
            and What-If simulations do not guarantee external organizational behavior.
          </p>
        </section>

        {/* 1. Claim Verification & Evidence Summary */}
        <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 print-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h2 className="font-display text-base font-semibold text-slate-100 print-heading">
              1. Claim Verification &amp; Evidence Summary
            </h2>
            {report.claimAnalysis ? (
              <div className="flex flex-wrap items-center gap-2">
                <VerdictIndicator verdict={report.claimAnalysis.verdict} prefix="Claim Verdict" />
                <UncertaintyTag
                  label={report.claimAnalysis.evidenceMatchStatus}
                  prefix="Evidence Match"
                />
              </div>
            ) : (
              <UncertaintyTag label="UNKNOWN" prefix="Status" />
            )}
          </div>

          {report.claimAnalysis ? (
            <div className="space-y-4 text-xs leading-relaxed">
              <div>
                <p className="font-medium text-slate-400 print-muted">Original Statement / URL</p>
                <p className="mt-1 text-sm text-slate-200 print-heading">
                  {report.claimAnalysis.input}
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-400 print-muted">Overall Explanation</p>
                <p className="mt-1 text-slate-300 print-muted">{report.claimAnalysis.explanation}</p>
                <p className="mt-1 text-[11px] text-slate-400 print-muted">
                  {report.claimAnalysis.verificationBoundary}
                </p>
              </div>

              {/* Subclaim Evaluation Breakdown */}
              {report.claimAnalysis.subclaims.length > 0 && (
                <div>
                  <p className="font-medium text-slate-400 print-muted mb-2">
                    Extracted Subclaims ({report.claimAnalysis.subclaims.length})
                  </p>
                  <div className="space-y-2">
                    {report.claimAnalysis.subclaims.map((sc) => (
                      <div
                        key={sc.id}
                        className="rounded-lg border border-slate-800 bg-[#0B1120] p-3 print-card space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-200 print-heading">
                            {sc.id}: {sc.text}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <VerdictIndicator verdict={sc.verdict} />
                            <UncertaintyTag label={sc.evidenceMatch} prefix="Evidence" />
                          </div>
                        </div>
                        <p className="text-slate-400 print-muted">{sc.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-medium text-slate-400 print-muted">
                  Evidence Summary ({report.claimAnalysis.matchedEvidence.length} matched · DEMO DATA)
                </p>
                {report.claimAnalysis.matchedEvidence.length === 0 ? (
                  <p className="mt-1 text-slate-400 print-muted">
                    No matching entries found in the sample evidence dataset; verdict set to
                    Inconclusive.
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-2">
                    {report.claimAnalysis.matchedEvidence.map((item) => (
                      <li
                        key={item.evidence.id}
                        className="rounded-lg border border-slate-800 bg-[#0B1120] p-3 print-card"
                      >
                        <p className="font-semibold text-slate-200 print-heading">
                          {item.evidence.id} — {item.evidence.title} ({item.relevance} · DEMO DATA)
                        </p>
                        <p className="mt-1 text-slate-400 print-muted">{item.evidence.excerpt}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 print-muted">
              Claim verification was not executed for this report.
            </p>
          )}
        </section>

        {/* 2. Detected Personal Data & Privacy Risk Level */}
        <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 print-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h2 className="font-display text-base font-semibold text-slate-100 print-heading">
              2. Detected Personal Data &amp; Aggregate Privacy Risk
            </h2>
            {report.privacyAnalysis ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-slate-300 print-muted tabular-nums">
                  {report.privacyAnalysis.detectedCategories.length}/7 Categories · Score{' '}
                  {report.privacyAnalysis.riskScore}/{report.privacyAnalysis.maxPossibleScore}
                </span>
                <SensitivityIndicator level={report.privacyAnalysis.overallSensitivity} />
              </div>
            ) : (
              <UncertaintyTag label="UNKNOWN" prefix="Status" />
            )}
          </div>

          {report.privacyAnalysis ? (
            <div className="space-y-4 text-xs">
              <p className="leading-relaxed text-slate-300 print-muted">
                {report.privacyAnalysis.summary}
              </p>

              {report.privacyAnalysis.detectedCategories.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 print-muted">
                        <th className="py-2 pr-4">Category</th>
                        <th className="py-2 px-3">Individual Sensitivity</th>
                        <th className="py-2 px-3">Uncertainty</th>
                        <th className="py-2 pl-3">Primary Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {report.privacyAnalysis.detectedCategories.map((cat) => (
                        <tr key={cat.categoryId}>
                          <td className="py-2.5 pr-4 font-semibold text-slate-100 print-heading">
                            {cat.label}
                          </td>
                          <td className="py-2.5 px-3">
                            <SensitivityIndicator level={cat.sensitivity} />
                          </td>
                          <td className="py-2.5 px-3">
                            <UncertaintyTag label={cat.uncertainty} />
                          </td>
                          <td className="py-2.5 pl-3 text-slate-300 print-muted">
                            {cat.potentialRisks[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 print-muted">
              Privacy risk assessment was not executed for this report.
            </p>
          )}
        </section>

        {/* 3. What-If Scenario Outcomes & Reversibility Assessment */}
        <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 print-card space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-display text-base font-semibold text-slate-100 print-heading">
              3. What-If Scenario Outcomes &amp; Reversibility Assessment
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {report.whatIfOutcomes.map((scenario) => (
              <div
                key={scenario.optionId}
                className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 print-card space-y-3"
              >
                <div className="space-y-2">
                  <p className="font-mono text-[11px] text-blue-300 print-muted">{scenario.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ReversibilityIndicator level={scenario.reversibility} />
                    <UncertaintyTag label={scenario.uncertainty} />
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-300 print-muted">
                  <strong className="text-slate-200 print-heading">Reversibility: </strong>
                  {scenario.reversibilityRationale}
                </p>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-200 print-heading">Key Risk:</p>
                  <p className="text-slate-400 print-muted">{scenario.possibleRisks[0]}</p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-200 print-heading">Key Consequence:</p>
                  <p className="text-slate-400 print-muted">{scenario.potentialConsequences[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Confirmed, Inferred, and Unknown Findings */}
        <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 print-card space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-display text-base font-semibold text-slate-100 print-heading">
              4. Findings by Uncertainty Classification
            </h2>
            <p className="mt-1 text-xs text-slate-400 print-muted">
              CONFIRMED: {UNCERTAINTY_DEFINITIONS.CONFIRMED.shortDesc} · INFERRED:{' '}
              {UNCERTAINTY_DEFINITIONS.INFERRED.shortDesc} · UNKNOWN:{' '}
              {UNCERTAINTY_DEFINITIONS.UNKNOWN.shortDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-500/25 bg-[#0B1120] p-4 print-card space-y-2.5">
              <UncertaintyTag label="CONFIRMED" />
              {report.confirmedFindings.length === 0 ? (
                <p className="text-xs text-slate-400 print-muted">No confirmed findings yet.</p>
              ) : (
                <ul className="space-y-2 text-xs text-slate-300 print-muted list-disc pl-4">
                  {report.confirmedFindings.map((item, idx) => (
                    <li key={idx}>{item.statement}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-blue-500/25 bg-[#0B1120] p-4 print-card space-y-2.5">
              <UncertaintyTag label="INFERRED" />
              {report.inferredFindings.length === 0 ? (
                <p className="text-xs text-slate-400 print-muted">No inferred findings yet.</p>
              ) : (
                <ul className="space-y-2 text-xs text-slate-300 print-muted list-disc pl-4">
                  {report.inferredFindings.map((item, idx) => (
                    <li key={idx}>{item.statement}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-amber-500/25 bg-[#0B1120] p-4 print-card space-y-2.5">
              <UncertaintyTag label="UNKNOWN" />
              {report.unknownFindings.length === 0 ? (
                <p className="text-xs text-slate-400 print-muted">No unknown gaps recorded.</p>
              ) : (
                <ul className="space-y-2 text-xs text-slate-300 print-muted list-disc pl-4">
                  {report.unknownFindings.map((item, idx) => (
                    <li key={idx}>{item.statement}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* 5. Actionable Recommendations */}
        <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 print-card space-y-3">
          <h2 className="font-display text-base font-semibold text-slate-100 print-heading">
            5. Recommended Next Actions
          </h2>
          <ul className="space-y-2 text-sm text-slate-200 print-heading">
            {report.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="h-4 w-4 text-blue-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="text-xs leading-relaxed text-slate-300 print-muted">{rec}</span>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
