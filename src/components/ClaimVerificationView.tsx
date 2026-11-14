import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Database,
  FileCheck2,
  FileText,
  RotateCcw,
  Search,
} from 'lucide-react';
import { CLAIM_PRESETS } from '../data/sampleDataset';
import { ClaimAnalysisResult } from '../types/trustlens';
import { UncertaintyTag, VerdictIndicator } from './UncertaintyTag';

interface ClaimVerificationViewProps {
  inputValue: string;
  onChangeInput: (val: string) => void;
  result: ClaimAnalysisResult | null;
  onAnalyzeClaim: (input: string) => Promise<void> | void;
  onClearClaim: () => void;
  onGoToPrivacy: () => void;
  onGoToReport: () => void;
}

export function ClaimVerificationView({
  inputValue,
  onChangeInput,
  result,
  onAnalyzeClaim,
  onClearClaim,
  onGoToPrivacy,
  onGoToReport,
}: ClaimVerificationViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setValidationError('Please enter a claim statement or paste a URL before clicking Analyze.');
      return;
    }

    if (trimmed.length < 8 || !/[a-zA-Z0-9]{2,}/.test(trimmed)) {
      setValidationError('Please provide a meaningful claim or URL (at least 8 characters with words).');
      return;
    }

    // If user typed something starting with http/https, verify basic URL structure
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const parsed = new URL(trimmed);
        if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
          setValidationError('The pasted URL appears incomplete. Include a valid domain (e.g., https://example.com).');
          return;
        }
      } catch {
        setValidationError('The pasted URL appears malformed. Check the address format (e.g., https://example.com).');
        return;
      }
    }

    setValidationError(null);
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 380));
    await onAnalyzeClaim(trimmed);
    setIsLoading(false);
  };

  const handlePresetClick = async (presetText: string) => {
    setValidationError(null);
    onChangeInput(presetText);
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 320));
    await onAnalyzeClaim(presetText);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Input Form */}
      <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-100">
              Claim &amp; URL Verification
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Matches statements or URLs against TrustLens&apos;s built-in{' '}
              <span className="font-mono text-violet-300">DEMO DATA</span> sample evidence dataset.
              Unmatched claims return <span className="font-medium text-amber-300">Inconclusive</span>.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-400 shrink-0">
            Prototype Scope · Local Sample Dataset
          </span>
        </div>

        {/* Sample Presets */}
        <div className="mt-5">
          <p className="text-xs font-medium text-slate-400 mb-2">
            Try sample scenarios (DEMO DATA):
          </p>
          <div className="flex flex-wrap gap-2">
            {CLAIM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={isLoading}
                onClick={() => handlePresetClick(preset.input)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700/90 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-blue-500/50 hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="claim-input" className="block text-xs font-medium text-slate-300 mb-1.5">
              Claim Statement or Website URL
            </label>
            <textarea
              id="claim-input"
              rows={3}
              value={inputValue}
              onChange={(e) => {
                onChangeInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Paste a website URL (e.g. https://demo-meritbridge-scholarship.example/apply) or enter single/multi-part claims to verify..."
              className="w-full rounded-lg border border-slate-700 bg-[#0B1120] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              URL inputs are checked against the built-in DEMO DATA sample evidence dataset only. TrustLens does not fetch or inspect live external websites.
            </p>
          </div>

          {validationError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
            >
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}

          {result && inputValue.trim() !== '' && inputValue.trim() !== result.input && !isLoading && (
            <p className="text-xs text-amber-300">
              Input modified since last run. Click Analyze to update the verdict, What-If context, and Unified Report.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {isLoading
                    ? 'Analyzing...'
                    : result && inputValue.trim() !== result.input
                      ? 'Re-Analyze'
                      : 'Analyze'}
                </span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setValidationError(null);
                  onClearClaim();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>

            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {inputValue.trim().length} chars
            </span>
          </div>
        </form>
      </section>

      {/* Loading Skeleton State */}
      {isLoading && (
        <section
          aria-busy="true"
          aria-label="Analyzing claim"
          className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 rounded bg-slate-800 animate-pulse" />
            <div className="h-6 w-28 rounded bg-slate-800 animate-pulse" />
          </div>
          <div className="h-4 w-full rounded bg-slate-800 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-slate-800 animate-pulse" />
          <div className="h-24 w-full rounded-lg bg-slate-900/80 animate-pulse" />
        </section>
      )}

      {/* Empty State */}
      {!isLoading && !result && (
        <section className="rounded-xl border border-dashed border-slate-800 bg-[#0E1629] px-6 py-12 text-center">
          <FileCheck2 className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
          <h2 className="mt-3 font-display text-sm font-semibold text-slate-200">
            No Claim Analyzed Yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-400">
            Enter a claim or URL above, or choose one of the DEMO DATA presets to inspect how TrustLens
            verifies evidence and applies Uncertainty Labels.
          </p>
        </section>
      )}

      {/* Verification Output */}
      {!isLoading && result && (
        <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 space-y-6">
          <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                <span>{result.id}</span>
                <span aria-hidden="true">·</span>
                <span>Input Type: {result.inputType.toUpperCase()}</span>
                <span aria-hidden="true">·</span>
                <span>{result.isDemoMatch ? 'DEMO DATA MATCH' : 'NO SAMPLE MATCH'}</span>
              </div>
              <h2 className="font-display text-lg font-semibold text-slate-100">
                Overall Claim Verification Result
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <VerdictIndicator verdict={result.verdict} prefix="Claim Verdict" />
              <UncertaintyTag label={result.evidenceMatchStatus} prefix="Evidence Match" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-400">Original Claim / URL</p>
              <p className="mt-1 rounded-lg border border-slate-800/90 bg-[#0B1120] px-3.5 py-2.5 text-sm text-slate-200">
                {result.input}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">Overall Explanation</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">{result.explanation}</p>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
              <span className="font-semibold text-blue-300">Verification Boundary: </span>
              {result.verificationBoundary}
            </div>
          </div>

          {/* Decomposed Subclaims Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-100">
                Extracted Subclaims &amp; Individual Evaluation
              </h3>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                {result.subclaims.length} {result.subclaims.length === 1 ? 'subclaim' : 'subclaims'}
              </span>
            </div>

            <div className="space-y-3">
              {result.subclaims.map((sc) => (
                <div
                  key={sc.id}
                  className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <span className="font-mono text-[11px] text-blue-300">{sc.id}</span>
                      <p className="text-sm font-medium text-slate-100">{sc.text}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <VerdictIndicator verdict={sc.verdict} />
                      <UncertaintyTag label={sc.evidenceMatch} prefix="Evidence" />
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-300">{sc.explanation}</p>

                  {sc.evidenceMatches.length > 0 && (
                    <div className="border-t border-slate-800/80 pt-2.5 space-y-2">
                      <p className="text-[11px] font-medium text-slate-400">
                        Relevant Sample Evidence for {sc.id}:
                      </p>
                      {sc.evidenceMatches.map((match) => (
                        <div
                          key={`${sc.id}-${match.evidence.id}`}
                          className="rounded border border-slate-800/90 bg-[#111A2E]/70 px-3 py-2 text-xs space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-slate-200">
                              {match.evidence.id} — {match.evidence.title}
                            </span>
                            <span
                              className={`font-mono text-[11px] font-medium ${
                                match.relevance === 'Supports'
                                  ? 'text-emerald-300'
                                  : match.relevance === 'Disputes'
                                    ? 'text-rose-300'
                                    : 'text-amber-300'
                              }`}
                            >
                              {match.relevance} · DEMO DATA
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{match.matchReason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-violet-400" aria-hidden="true" />
                <h3 className="font-display text-sm font-semibold text-slate-100">
                  Sample Evidence Records
                </h3>
              </div>
              <span className="font-mono text-xs text-violet-300 tabular-nums">
                {result.matchedEvidence.length} matched · DEMO DATA
              </span>
            </div>

            {result.matchedEvidence.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 text-xs text-slate-400">
                No entries in the sample evidence dataset matched this query. Under TrustLens rules,
                unmatched claims always return <span className="text-amber-300 font-medium">Inconclusive</span>{' '}
                with <span className="font-mono text-amber-300">Evidence Match: UNKNOWN</span> rather
                than fabricating external citations.
              </div>
            ) : (
              <div className="space-y-3">
                {result.matchedEvidence.map((item) => (
                  <div
                    key={item.evidence.id}
                    className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-100">
                        {item.evidence.title}
                      </span>
                      <span
                        className={`font-mono text-xs font-medium ${
                          item.relevance === 'Supports'
                            ? 'text-emerald-300'
                            : item.relevance === 'Disputes'
                              ? 'text-rose-300'
                              : 'text-amber-300'
                        }`}
                      >
                        {item.relevance} · DEMO DATA
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>{item.evidence.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.evidence.sourceLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>Recorded {item.evidence.recordedDate}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">{item.evidence.excerpt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workflow Continuation Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onGoToReport}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>View in Unified Report</span>
            </button>
            <button
              type="button"
              onClick={onGoToPrivacy}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors whitespace-nowrap"
            >
              <span>Continue to Privacy Assessment</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
