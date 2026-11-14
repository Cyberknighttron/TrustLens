import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  GitBranch,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  ClaimAnalysisResult,
  DataCategoryId,
  PrivacyAnalysisResult,
  SensitivityLevel,
  WhatIfOptionId,
  WhatIfScenarioOutcome,
} from '../types/trustlens';
import { ReversibilityIndicator, SensitivityIndicator, UncertaintyTag } from './UncertaintyTag';

interface WhatIfViewProps {
  selectedCategories: DataCategoryId[];
  activeSensitivity: SensitivityLevel;
  onToggleCategory: (categoryId: DataCategoryId) => void;
  hasDeletionDisclosed: boolean;
  onToggleDeletionDisclosed: (val: boolean) => void;
  onSyncFromPrivacy: () => void;
  privacyResult: PrivacyAnalysisResult | null;
  claimResult: ClaimAnalysisResult | null;
  outcomes: WhatIfScenarioOutcome[];
  onGoToReport: () => void;
}

const ALL_CATEGORIES: Array<{ id: DataCategoryId; label: string; weightLabel: string }> = [
  { id: 'name', label: 'Name', weightLabel: 'Low' },
  { id: 'email', label: 'Email', weightLabel: 'Moderate' },
  { id: 'phone', label: 'Phone number', weightLabel: 'Moderate' },
  { id: 'address', label: 'Address', weightLabel: 'High' },
  { id: 'location', label: 'Location information', weightLabel: 'High' },
  { id: 'government_id', label: 'Government ID', weightLabel: 'Critical' },
  { id: 'financial', label: 'Financial information', weightLabel: 'Critical' },
];

export function WhatIfView({
  selectedCategories,
  activeSensitivity,
  onToggleCategory,
  hasDeletionDisclosed,
  onToggleDeletionDisclosed,
  onSyncFromPrivacy,
  privacyResult,
  claimResult,
  outcomes,
  onGoToReport,
}: WhatIfViewProps) {
  const [activeOption, setActiveOption] = useState<WhatIfOptionId | 'all'>('submit');

  const detectedFromPrivacy = privacyResult?.detectedCategories.map((c) => c.categoryId) ?? [];
  const isSyncedWithPrivacy =
    privacyResult !== null &&
    detectedFromPrivacy.length === selectedCategories.length &&
    detectedFromPrivacy.every((id) => selectedCategories.includes(id));

  const visibleOutcomes =
    activeOption === 'all' ? outcomes : outcomes.filter((o) => o.optionId === activeOption);

  return (
    <div className="space-y-6">
      {/* Header & Interactive Parameters */}
      <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-100">
              <GitBranch className="h-5 w-5 text-blue-400 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold">
                What-If Scenario Simulation
              </h1>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Explore how submitting, refusing, or later revoking consent changes exposure,
              consequences, and reversibility under transparent decision rules.
            </p>
          </div>

          {privacyResult && (
            <button
              type="button"
              onClick={onSyncFromPrivacy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sync from Privacy Assessment</span>
            </button>
          )}
        </div>

        {/* Rule-Based Scope Disclaimer */}
        <div className="rounded-lg border border-blue-500/25 bg-blue-500/5 px-4 py-3 text-xs leading-relaxed text-slate-300 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong className="text-blue-200">Transparent Rule-Based Simulation:</strong> This engine
            models privacy lifecycle mechanics from the active data categories and visible policy
            disclosures. It does not predict actual company behavior or guarantee future outcomes.
          </span>
        </div>

        {/* Interactive Parameter Toggles */}
        <div className="space-y-3 border-t border-slate-800/80 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-xs font-medium text-slate-300">
                Active Data Categories in Simulation ({selectedCategories.length} of 7 selected):
              </p>
              {privacyResult && (
                <span className="font-mono text-[11px] text-slate-400">
                  {isSyncedWithPrivacy
                    ? '· Synced with Privacy Assessment'
                    : '· Custom toggle override'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <SensitivityIndicator level={activeSensitivity} />
              <span>
                Claim:{' '}
                <span className="font-mono text-slate-200">
                  {claimResult ? claimResult.verdict : 'None'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onToggleCategory(cat.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'border-violet-500/60 bg-violet-500/20 text-violet-100'
                      : 'border-slate-700/80 bg-[#0B1120] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="font-mono text-[10px] opacity-75">{cat.weightLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300">
              <input
                type="checkbox"
                checked={hasDeletionDisclosed}
                onChange={(e) => onToggleDeletionDisclosed(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Assume a deletion / consent-withdrawal process is disclosed in the privacy notice
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Scenario Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="What-If Scenario Options"
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-[#111A2E] p-1"
        >
          {[
            { id: 'submit' as const, label: 'A. Submit Data' },
            { id: 'refuse' as const, label: 'B. Refuse Data' },
            { id: 'revoke' as const, label: 'C. Revoke Consent Later' },
            { id: 'all' as const, label: 'Compare All 3' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeOption === tab.id}
              onClick={() => setActiveOption(tab.id)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeOption === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onGoToReport}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors whitespace-nowrap shrink-0"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          <span>View Unified Report</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Scenario Outcome Cards */}
      <div
        className={`grid grid-cols-1 gap-5 ${
          activeOption === 'all' ? 'xl:grid-cols-3' : 'grid-cols-1'
        }`}
      >
        {visibleOutcomes.map((scenario) => (
          <section
            key={scenario.optionId}
            className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <p className="font-mono text-xs text-blue-300">{scenario.title}</p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-slate-100">
                    {scenario.promptQuestion}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ReversibilityIndicator level={scenario.reversibility} />
                  <UncertaintyTag label={scenario.uncertainty} />
                </div>
              </div>

              {/* Possible Benefits */}
              <div className="space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Possible Benefits</span>
                </h3>
                <ul className="space-y-1.5 text-xs leading-relaxed text-slate-300 list-disc pl-5">
                  {scenario.possibleBenefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              {/* Possible Risks */}
              <div className="space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Possible Risks</span>
                </h3>
                <ul className="space-y-1.5 text-xs leading-relaxed text-slate-300 list-disc pl-5">
                  {scenario.possibleRisks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Potential Consequences */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-slate-200">Potential Consequences</h3>
                <ul className="space-y-1.5 text-xs leading-relaxed text-slate-300 list-disc pl-5">
                  {scenario.potentialConsequences.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Reversibility Rationale */}
              <div className="rounded-lg border border-slate-800/90 bg-[#0B1120] p-3.5 space-y-1">
                <p className="text-xs font-semibold text-slate-200">
                  Reversibility Assessment ({scenario.reversibility})
                </p>
                <p className="text-xs leading-relaxed text-slate-400">
                  {scenario.reversibilityRationale}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-3 text-[11px] font-mono text-slate-400">
              Rule Basis: {scenario.ruleBasis}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
