import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Lock,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { PRIVACY_FORM_PRESETS } from '../data/sampleDataset';
import { PrivacyAnalysisResult } from '../types/trustlens';
import { SensitivityIndicator, UncertaintyTag } from './UncertaintyTag';

interface PrivacyAssessmentViewProps {
  inputValue: string;
  onChangeInput: (val: string) => void;
  result: PrivacyAnalysisResult | null;
  onAnalyzePrivacy: (text: string) => Promise<void> | void;
  onClearPrivacy: () => void;
  onGoToWhatIf: () => void;
}

export function PrivacyAssessmentView({
  inputValue,
  onChangeInput,
  result,
  onAnalyzePrivacy,
  onClearPrivacy,
  onGoToWhatIf,
}: PrivacyAssessmentViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    setIsModified(false);
  }, [result?.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setValidationError('Please paste text from a form, webpage, or privacy notice to analyze.');
      return;
    }

    if (trimmed.length < 10 || !/[a-zA-Z]{3,}/.test(trimmed)) {
      setValidationError('Please enter descriptive form fields or notice text (at least 10 characters with words).');
      return;
    }

    setValidationError(null);
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 360));
    await onAnalyzePrivacy(trimmed);
    setIsModified(false);
    setIsLoading(false);
  };

  const handlePreset = async (text: string) => {
    setValidationError(null);
    onChangeInput(text);
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await onAnalyzePrivacy(text);
    setIsModified(false);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-100">
              Privacy Risk Assessment
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Paste form field labels, webpage text, or a privacy notice to detect requested personal
              data categories and evaluate exposure using transparent scoring rules.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium shrink-0">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>No personal values stored</span>
          </div>
        </div>

        {/* Presets */}
        <div className="mt-5">
          <p className="text-xs font-medium text-slate-400 mb-2">
            Load sample form or notice text (DEMO DATA):
          </p>
          <div className="flex flex-wrap gap-2">
            {PRIVACY_FORM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={isLoading}
                onClick={() => handlePreset(preset.text)}
                className="inline-flex items-center rounded-lg border border-slate-700/90 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-500/50 hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="privacy-input" className="block text-xs font-medium text-slate-300 mb-1.5">
              Form Fields, Website Text, or Privacy Notice Excerpt
            </label>
            <textarea
              id="privacy-input"
              rows={5}
              value={inputValue}
              onChange={(e) => {
                onChangeInput(e.target.value);
                if (result) setIsModified(true);
                if (validationError) setValidationError(null);
              }}
              placeholder="Paste field labels or notice text here (e.g., Full Name, Email Address, Phone Number, Home Address, Government ID). Do not enter real ID numbers, passwords, OTPs, or bank numbers."
              className="w-full rounded-lg border border-slate-700 bg-[#0B1120] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
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

          {result && isModified && inputValue.trim() !== '' && !isLoading && (
            <p className="text-xs text-amber-300">
              Form text modified since last run. Click Assess Privacy Risk to update detected categories, What-If scenarios, and the Unified Report.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {isLoading
                    ? 'Assessing...'
                    : result && isModified
                      ? 'Re-Assess Privacy Risk'
                      : 'Assess Privacy Risk'}
                </span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setValidationError(null);
                  setIsModified(false);
                  onClearPrivacy();
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

      {/* Loading State */}
      {isLoading && (
        <section
          aria-busy="true"
          aria-label="Assessing privacy risks"
          className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 space-y-4"
        >
          <div className="h-5 w-52 rounded bg-slate-800 animate-pulse" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-20 rounded-lg bg-slate-900 animate-pulse" />
            <div className="h-20 rounded-lg bg-slate-900 animate-pulse" />
            <div className="h-20 rounded-lg bg-slate-900 animate-pulse" />
          </div>
          <div className="h-32 w-full rounded-lg bg-slate-900 animate-pulse" />
        </section>
      )}

      {/* Empty State */}
      {!isLoading && !result && (
        <section className="rounded-xl border border-dashed border-slate-800 bg-[#0E1629] px-6 py-12 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
          <h2 className="mt-3 font-display text-sm font-semibold text-slate-200">
            No Privacy Text Analyzed Yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-400">
            Paste any form description or privacy notice above to detect requested personal data
            categories (Name, Email, Phone, Address, Government ID, Financial, Location) and review
            actionable precautions.
          </p>
        </section>
      )}

      {/* Analysis Result */}
      {!isLoading && result && (
        <div className="space-y-6">
          {result.redactionTriggered && result.redactionNotice && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-200"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{result.redactionNotice}</span>
            </div>
          )}

          {/* Summary Strip */}
          <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6">
            <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>{result.id}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{result.rawCharCount} chars analyzed</span>
                </div>
                <h2 className="mt-1 font-display text-lg font-semibold text-slate-100">
                  Privacy Risk Summary
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Categories Detected</p>
                  <p className="font-mono text-sm font-semibold text-slate-100 tabular-nums">
                    {result.detectedCategories.length} / 7
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Weighted Risk Score</p>
                  <p className="font-mono text-sm font-semibold text-slate-100 tabular-nums">
                    {result.riskScore} / {result.maxPossibleScore}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400 mb-0.5">Aggregate Privacy Risk</p>
                  <SensitivityIndicator level={result.overallSensitivity} />
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">{result.summary}</p>

            {/* 7-Category Overview Matrix */}
            <div className="mt-5">
              <h3 className="text-xs font-medium text-slate-400 mb-3">
                7-Category Detection Checklist
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {[...result.detectedCategories, ...result.undetectedCategories].map((cat) => (
                  <div
                    key={cat.categoryId}
                    className={`rounded-lg border px-3.5 py-2.5 flex items-center justify-between gap-2 ${
                      cat.detected
                        ? 'border-violet-500/35 bg-violet-500/10'
                        : 'border-slate-800 bg-[#0B1120] opacity-70'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-100 truncate">{cat.label}</p>
                      <p className="font-mono text-[11px] text-slate-400">
                        {cat.detected ? `Weight ${cat.weight} · ${cat.sensitivity}` : 'Not detected'}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-medium shrink-0 ${
                        cat.detected ? 'text-violet-300' : 'text-slate-500'
                      }`}
                    >
                      {cat.detected ? 'FLAGGED' : 'CLEAR'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Detailed Breakdown for Detected Categories */}
          <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-base font-semibold text-slate-100">
                Detected Data Categories &amp; Precautions
              </h2>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                {result.detectedCategories.length} categories flagged
              </span>
            </div>

            {result.detectedCategories.length === 0 ? (
              <p className="text-xs text-slate-400">
                None of the 7 tracked personal data categories were matched in this text.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {result.detectedCategories.map((cat) => (
                  <div key={cat.categoryId} className="py-5 first:pt-2 last:pb-1 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-display text-sm font-semibold text-slate-100">
                          {cat.label}
                        </h3>
                        <SensitivityIndicator level={cat.sensitivity} />
                        <UncertaintyTag label={cat.uncertainty} />
                      </div>
                      <span className="font-mono text-xs text-slate-400">
                        Matched: {cat.matchedIndicators.slice(0, 3).join(', ')}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-300">
                      <span className="font-semibold text-slate-200">Why it may be risky: </span>
                      {cat.whyRisky}
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-800/90 bg-[#0B1120] p-3.5">
                        <p className="text-xs font-semibold text-rose-300 mb-1.5">
                          Potential Privacy Risks
                        </p>
                        <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                          {cat.potentialRisks.map((risk, idx) => (
                            <li key={idx}>{risk}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-slate-800/90 bg-[#0B1120] p-3.5">
                        <p className="text-xs font-semibold text-emerald-300 mb-1.5">
                          Suggested Precautions
                        </p>
                        <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                          {cat.precautions.map((precaution, idx) => (
                            <li key={idx}>{precaution}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Uncertainty Classification Findings */}
          <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-100">
              Transparent Rule &amp; Uncertainty Breakdown
            </h2>
            <div className="space-y-3">
              {result.findings.map((finding) => (
                <div
                  key={finding.id}
                  className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm text-slate-200">{finding.statement}</p>
                    <p className="text-xs text-slate-400">{finding.rationale}</p>
                  </div>
                  <UncertaintyTag label={finding.uncertainty} />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onGoToWhatIf}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap"
              >
                <span>Simulate What-If Scenarios</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
