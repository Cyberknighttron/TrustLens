import { useState } from 'react';
import {
  ArrowRight,
  FileCheck2,
  FileText,
  GitBranch,
  Play,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  AnalysisHistoryRecord,
  ClaimAnalysisResult,
  PrivacyAnalysisResult,
  WhatIfScenarioOutcome,
} from '../types/trustlens';
import { NavSection } from './Sidebar';
import { SensitivityIndicator, VerdictIndicator } from './UncertaintyTag';

interface DashboardViewProps {
  history: AnalysisHistoryRecord[];
  activeClaim: ClaimAnalysisResult | null;
  activePrivacy: PrivacyAnalysisResult | null;
  activeWhatIf: WhatIfScenarioOutcome[];
  onNavigate: (section: NavSection) => void;
  onRunScholarshipDemo: () => void;
  onOpenReportFromHistory: (record: AnalysisHistoryRecord) => void;
}

export function DashboardView({
  history,
  activeClaim,
  activePrivacy,
  activeWhatIf,
  onNavigate,
  onRunScholarshipDemo,
  onOpenReportFromHistory,
}: DashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | 'Supported' | 'Disputed' | 'Inconclusive'>('ALL');

  const totalAnalyses = history.length;
  const totalPrivacyRisksDetected = history.reduce((acc, item) => acc + item.detectedCategoryCount, 0);
  const inconclusiveClaimsCount = history.filter((item) => item.claimVerdict === 'Inconclusive').length;

  // Compute uncertainty counts across active or latest report
  const referenceReport = history[0]?.report;
  const confirmedCount = referenceReport?.confirmedFindings.length ?? 0;
  const inferredCount = referenceReport?.inferredFindings.length ?? 0;
  const unknownCount = referenceReport?.unknownFindings.length ?? 0;
  const totalFindingsCount = Math.max(1, confirmedCount + inferredCount + unknownCount);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVerdict = verdictFilter === 'ALL' || item.claimVerdict === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  return (
    <div className="space-y-8">
      {/* Overview & Sample Demo Banner */}
      <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>Intelligent Claim Verification &amp; Privacy Risk Assessment</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-blue-300">Rule-Based Prototype</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl text-balance">
              Evaluate claims, inspect personal data exposure, and simulate disclosure outcomes
            </h1>
            <p className="text-sm leading-relaxed text-slate-300">
              TrustLens combines sample-evidence claim matching, transparent personal-data detection, and
              What-If scenario simulation—explicitly separating Confirmed facts, Inferred conclusions, and
              Unknown practices.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={onRunScholarshipDemo}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Play className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Explore Scholarship Demo</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>View Unified Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* Core Statistics Strip */}
      <section aria-label="Analysis Statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#111A2E] p-5">
          <p className="text-xs font-medium text-slate-400">Total Analyses</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-100 tabular-nums">
            {totalAnalyses}
          </p>
          <p className="mt-1 text-xs text-slate-400">Completed local evaluation runs</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111A2E] p-5">
          <p className="text-xs font-medium text-slate-400">Privacy Risks Detected</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-violet-300 tabular-nums">
            {totalPrivacyRisksDetected}
          </p>
          <p className="mt-1 text-xs text-slate-400">Personal data categories flagged</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111A2E] p-5">
          <p className="text-xs font-medium text-slate-400">Inconclusive Claims</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-amber-300 tabular-nums">
            {inconclusiveClaimsCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Unmatched against sample evidence</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111A2E] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Latest Uncertainty Mix</p>
            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
              {confirmedCount}/{inferredCount}/{unknownCount}
            </span>
          </div>
          <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800" role="img" aria-label="Uncertainty label distribution bar">
            <div
              style={{ width: `${(confirmedCount / totalFindingsCount) * 100}%` }}
              className="bg-emerald-500 transition-all duration-200"
              title={`CONFIRMED: ${confirmedCount}`}
            />
            <div
              style={{ width: `${(inferredCount / totalFindingsCount) * 100}%` }}
              className="bg-blue-500 transition-all duration-200"
              title={`INFERRED: ${inferredCount}`}
            />
            <div
              style={{ width: `${(unknownCount / totalFindingsCount) * 100}%` }}
              className="bg-amber-500 transition-all duration-200"
              title={`UNKNOWN: ${unknownCount}`}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="text-emerald-300">CONF {confirmedCount}</span>
            <span className="text-blue-300">INF {inferredCount}</span>
            <span className="text-amber-300">UNK {unknownCount}</span>
          </div>
        </div>
      </section>

      {/* Three Workflow Modules Overview */}
      <section aria-label="Active Workspace Modules" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Claim Verification Summary */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111A2E] p-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-100">
                <FileCheck2 className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold">Claim Verification</h2>
              </div>
              {activeClaim && <VerdictIndicator verdict={activeClaim.verdict} />}
            </div>

            {activeClaim ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-400 line-clamp-2">{activeClaim.input}</p>
                <p className="text-xs leading-relaxed text-slate-300 line-clamp-3">
                  {activeClaim.explanation}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                No active claim evaluated in the current session. Test a statement or URL against our
                clearly labeled sample evidence dataset.
              </p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => onNavigate('claim')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
            >
              <span>{activeClaim ? 'Inspect or run new claim' : 'Open Claim Verification'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Privacy Risk Assessment Summary */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111A2E] p-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-100">
                <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold">Privacy Assessment</h2>
              </div>
              {activePrivacy && <SensitivityIndicator level={activePrivacy.overallSensitivity} />}
            </div>

            {activePrivacy ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-300">
                  <span className="font-mono font-semibold tabular-nums text-slate-100">
                    {activePrivacy.detectedCategories.length}
                  </span>{' '}
                  of 7 personal data categories detected (score{' '}
                  <span className="font-mono tabular-nums">
                    {activePrivacy.riskScore}/{activePrivacy.maxPossibleScore}
                  </span>
                  ).
                </p>
                <p className="text-xs text-slate-400">
                  {activePrivacy.detectedCategories.length > 0
                    ? activePrivacy.detectedCategories.map((c) => c.label).join(' · ')
                    : 'No tracked categories matched.'}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Paste form fields or privacy notice text to detect Name, Email, Phone, Address,
                Government ID, Financial, and Location risks.
              </p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
            >
              <span>{activePrivacy ? 'Inspect detected fields' : 'Open Privacy Assessment'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* What-If Analysis Summary */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111A2E] p-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-100">
                <GitBranch className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold">What-If Analysis</h2>
              </div>
              <span className="font-mono text-xs text-slate-400 tabular-nums">3 Scenarios</span>
            </div>

            <div className="mt-3 space-y-2">
              {activeWhatIf.map((scenario) => (
                <div
                  key={scenario.optionId}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-b-0"
                >
                  <span className="text-slate-300 truncate pr-2">{scenario.promptQuestion}</span>
                  <span className="font-mono text-slate-400 shrink-0">
                    {scenario.reversibility} rev.
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => onNavigate('whatif')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
            >
              <span>Simulate Submit, Refuse &amp; Revoke</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Recent Analysis Reports Table */}
      <section className="rounded-xl border border-slate-800 bg-[#111A2E]">
        <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-100">
              Recent Analysis Reports
            </h2>
            <p className="text-xs text-slate-400">
              Select any completed evaluation to inspect its full Unified TrustLens Report.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports..."
                aria-label="Search recent analysis reports"
                className="w-48 rounded-lg border border-slate-700 bg-slate-900/80 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-900/80 p-1 border border-slate-800">
              {(['ALL', 'Supported', 'Disputed', 'Inconclusive'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setVerdictFilter(status)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    verdictFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-300">No matching analysis reports</p>
            <p className="mt-1 text-xs text-slate-400">
              {history.length > 0
                ? 'No reports match the current search or verdict filter.'
                : 'Run a Claim Verification or Privacy Assessment, or load the Fictional Scholarship Demo.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              {history.length > 0 && (searchQuery !== '' || verdictFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setVerdictFilter('ALL');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <span>Reset Filters</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRunScholarshipDemo}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Run Scholarship Demo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400">
                  <th className="py-3 px-6">Report Title</th>
                  <th className="py-3 px-4">Claim Verdict</th>
                  <th className="py-3 px-4">Privacy Risk</th>
                  <th className="py-3 px-4 text-right">Fields Flagged</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredHistory.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-800/35 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div className="font-medium text-slate-100">{record.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{record.id}</span>
                        {record.isDemo && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-violet-300">DEMO DATA</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {record.claimVerdict === 'Not Run' ? (
                        <span className="text-xs text-slate-500">Not Run</span>
                      ) : (
                        <VerdictIndicator verdict={record.claimVerdict} />
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {record.privacyLevel === 'Not Run' ? (
                        <span className="text-xs text-slate-500">Not Run</span>
                      ) : (
                        <SensitivityIndicator level={record.privacyLevel} />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-200 tabular-nums">
                      {record.detectedCategoryCount} / 7
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(record.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenReportFromHistory(record)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
                      >
                        <span>Open Report</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
