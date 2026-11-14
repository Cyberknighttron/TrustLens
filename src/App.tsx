import { useEffect, useMemo, useState } from 'react';
import { Menu, Play, RotateCcw } from 'lucide-react';
import { ClaimVerificationView } from './components/ClaimVerificationView';
import { DashboardView } from './components/DashboardView';
import { MethodologyView } from './components/MethodologyView';
import { PrivacyAssessmentView } from './components/PrivacyAssessmentView';
import { NavSection, Sidebar } from './components/Sidebar';
import { UnifiedReportView } from './components/UnifiedReportView';
import { WhatIfView } from './components/WhatIfView';
import { CLAIM_PRESETS, PRIVACY_FORM_PRESETS, SCHOLARSHIP_DEMO_SCENARIO } from './data/sampleDataset';
import { analyzeClaimAgainstDemoDataset, analyzeClaimWithLiveFallback } from './engine/claimVerifier';
import { analyzePrivacyText } from './engine/privacyAnalyzer';
import { buildUnifiedReport } from './engine/reportBuilder';
import { runWhatIfScenarios } from './engine/whatIfEngine';
import {
  AnalysisHistoryRecord,
  ClaimAnalysisResult,
  ClaimVerificationMode,
  DataCategoryId,
  PrivacyAnalysisResult,
  SensitivityLevel,
  UnifiedTrustLensReport,
} from './types/trustlens';

const STORAGE_KEY = 'trustlens_prototype_state_v4';

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard Overview',
  claim: 'Claim Verification',
  privacy: 'Privacy Risk Assessment',
  whatif: 'What-If Analysis',
  report: 'Unified TrustLens Report',
  methodology: 'Methodology & Sample Dataset',
};

function createInitialDemoBundle() {
  // 1. Primary Fictional Scholarship Demo (Disputed + 5 PII categories)
  const scholarshipClaim = analyzeClaimAgainstDemoDataset(SCHOLARSHIP_DEMO_SCENARIO.claimText);
  const scholarshipPrivacy = analyzePrivacyText(SCHOLARSHIP_DEMO_SCENARIO.formAndNoticeText);
  const scholarshipWhatIf = runWhatIfScenarios({
    detectedCategoryIds: scholarshipPrivacy.detectedCategories.map((c) => c.categoryId),
    overallSensitivity: scholarshipPrivacy.overallSensitivity,
    hasDeletionPolicyDisclosed: false,
    claimAnalysis: scholarshipClaim,
  });
  const scholarshipReport = buildUnifiedReport({
    title: SCHOLARSHIP_DEMO_SCENARIO.title,
    isDemoScenario: true,
    claimAnalysis: scholarshipClaim,
    privacyAnalysis: scholarshipPrivacy,
    whatIfOutcomes: scholarshipWhatIf,
  });

  // 2. Supported Community Grant Demo
  const grantClaim = analyzeClaimAgainstDemoDataset(CLAIM_PRESETS[1].input);
  const grantPrivacy = analyzePrivacyText(PRIVACY_FORM_PRESETS[2].text);
  const grantWhatIf = runWhatIfScenarios({
    detectedCategoryIds: grantPrivacy.detectedCategories.map((c) => c.categoryId),
    overallSensitivity: grantPrivacy.overallSensitivity,
    hasDeletionPolicyDisclosed: true,
    claimAnalysis: grantClaim,
  });
  const grantReport = buildUnifiedReport({
    title: 'BrightFuture Community Grant Check (DEMO DATA)',
    isDemoScenario: true,
    claimAnalysis: grantClaim,
    privacyAnalysis: grantPrivacy,
    whatIfOutcomes: grantWhatIf,
  });

  // 3. Inconclusive Fellowship Demo
  const fellowshipClaim = analyzeClaimAgainstDemoDataset(CLAIM_PRESETS[2].input);
  const fellowshipPrivacy = analyzePrivacyText(PRIVACY_FORM_PRESETS[1].text);
  const fellowshipWhatIf = runWhatIfScenarios({
    detectedCategoryIds: fellowshipPrivacy.detectedCategories.map((c) => c.categoryId),
    overallSensitivity: fellowshipPrivacy.overallSensitivity,
    hasDeletionPolicyDisclosed: false,
    claimAnalysis: fellowshipClaim,
  });
  const fellowshipReport = buildUnifiedReport({
    title: 'NovaTech Fellowship & Wallet Check (DEMO DATA)',
    isDemoScenario: true,
    claimAnalysis: fellowshipClaim,
    privacyAnalysis: fellowshipPrivacy,
    whatIfOutcomes: fellowshipWhatIf,
  });

  const initialHistory: AnalysisHistoryRecord[] = [
    {
      id: scholarshipReport.id,
      title: scholarshipReport.title,
      createdAt: scholarshipReport.generatedAt,
      claimVerdict: scholarshipClaim.verdict,
      privacyLevel: scholarshipPrivacy.overallSensitivity,
      detectedCategoryCount: scholarshipPrivacy.detectedCategories.length,
      isDemo: true,
      report: scholarshipReport,
    },
    {
      id: grantReport.id,
      title: grantReport.title,
      createdAt: grantReport.generatedAt,
      claimVerdict: grantClaim.verdict,
      privacyLevel: grantPrivacy.overallSensitivity,
      detectedCategoryCount: grantPrivacy.detectedCategories.length,
      isDemo: true,
      report: grantReport,
    },
    {
      id: fellowshipReport.id,
      title: fellowshipReport.title,
      createdAt: fellowshipReport.generatedAt,
      claimVerdict: fellowshipClaim.verdict,
      privacyLevel: fellowshipPrivacy.overallSensitivity,
      detectedCategoryCount: fellowshipPrivacy.detectedCategories.length,
      isDemo: true,
      report: fellowshipReport,
    },
  ];

  return {
    claimInput: SCHOLARSHIP_DEMO_SCENARIO.claimText,
    privacyInput: SCHOLARSHIP_DEMO_SCENARIO.formAndNoticeText,
    claimResult: scholarshipClaim,
    privacyResult: scholarshipPrivacy,
    selectedCategories: scholarshipPrivacy.detectedCategories.map((c) => c.categoryId),
    hasDeletionDisclosed: false,
    history: initialHistory,
  };
}

function computeSensitivityForCategories(ids: DataCategoryId[]): SensitivityLevel {
  const weights: Record<DataCategoryId, number> = {
    name: 1,
    email: 2,
    phone: 2,
    address: 3,
    location: 3,
    government_id: 5,
    financial: 5,
  };
  const score = ids.reduce((sum, id) => sum + weights[id], 0);
  const hasCritical = ids.includes('government_id') || ids.includes('financial');
  const hasHigh = ids.includes('address') || ids.includes('location');
  const hasModerate = ids.includes('email') || ids.includes('phone');

  if (
    (hasCritical && ids.length >= 3) ||
    (ids.includes('government_id') && ids.includes('financial'))
  ) {
    return 'Critical';
  }
  if (hasCritical || hasHigh || score >= 7) return 'High';
  if (hasModerate || score >= 3) return 'Moderate';
  return 'Low';
}

export default function App() {
  const initialDemo = useMemo(() => createInitialDemoBundle(), []);

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [claimInput, setClaimInput] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).claimInput ?? initialDemo.claimInput;
    } catch {
      // ignore storage errors
    }
    return initialDemo.claimInput;
  });

  const [privacyInput, setPrivacyInput] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).privacyInput ?? initialDemo.privacyInput;
    } catch {
      // ignore storage errors
    }
    return initialDemo.privacyInput;
  });

  const [claimResult, setClaimResult] = useState<ClaimAnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).claimResult ?? initialDemo.claimResult;
    } catch {
      // ignore storage errors
    }
    return initialDemo.claimResult;
  });

  const [privacyResult, setPrivacyResult] = useState<PrivacyAnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).privacyResult ?? initialDemo.privacyResult;
    } catch {
      // ignore storage errors
    }
    return initialDemo.privacyResult;
  });

  const [selectedCategories, setSelectedCategories] = useState<DataCategoryId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).selectedCategories ?? initialDemo.selectedCategories;
    } catch {
      // ignore storage errors
    }
    return initialDemo.selectedCategories;
  });

  const [hasDeletionDisclosed, setHasDeletionDisclosed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).hasDeletionDisclosed ?? initialDemo.hasDeletionDisclosed;
    } catch {
      // ignore storage errors
    }
    return initialDemo.hasDeletionDisclosed;
  });

  const [history, setHistory] = useState<AnalysisHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved).history;
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.map((item: AnalysisHistoryRecord, idx: number) => {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              return item;
            }
            const uniqueId = `${item.id}-${idx}`;
            seen.add(uniqueId);
            return { ...item, id: uniqueId, report: { ...item.report, id: uniqueId } };
          });
        }
      }
    } catch {
      // ignore storage errors
    }
    return initialDemo.history;
  });

  const [archivedReport, setArchivedReport] = useState<UnifiedTrustLensReport | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          claimInput,
          privacyInput,
          claimResult,
          privacyResult,
          selectedCategories,
          hasDeletionDisclosed,
          history,
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [
    claimInput,
    privacyInput,
    claimResult,
    privacyResult,
    selectedCategories,
    hasDeletionDisclosed,
    history,
  ]);

  useEffect(() => {
    if (!statusNotice) return;
    const timer = setTimeout(() => setStatusNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [statusNotice]);

  const activeWhatIfSensitivity = useMemo(
    () => computeSensitivityForCategories(selectedCategories),
    [selectedCategories]
  );

  const whatIfOutcomes = useMemo(() => {
    return runWhatIfScenarios({
      detectedCategoryIds: selectedCategories,
      overallSensitivity: activeWhatIfSensitivity,
      hasDeletionPolicyDisclosed: hasDeletionDisclosed,
      claimAnalysis: claimResult,
    });
  }, [selectedCategories, activeWhatIfSensitivity, hasDeletionDisclosed, claimResult]);

  const liveReport = useMemo(() => {
    const customTitle = claimResult
      ? `TrustLens Analysis — ${claimResult.input.slice(0, 48)}${
          claimResult.input.length > 48 ? '...' : ''
        }`
      : privacyResult
        ? 'TrustLens Privacy Risk Assessment Report'
        : 'TrustLens Workspace Report';

    const isDemo = Boolean(
      claimResult?.isDemoMatch ||
        privacyInput.includes('DEMO DATA') ||
        claimInput.includes('demo-')
    );

    return buildUnifiedReport({
      title: isDemo && claimInput === SCHOLARSHIP_DEMO_SCENARIO.claimText
        ? SCHOLARSHIP_DEMO_SCENARIO.title
        : customTitle,
      isDemoScenario: isDemo,
      claimAnalysis: claimResult,
      privacyAnalysis: privacyResult,
      whatIfOutcomes,
    });
  }, [claimResult, privacyResult, whatIfOutcomes, claimInput, privacyInput]);

  const appendReportToHistory = (
    nextClaim: ClaimAnalysisResult | null,
    nextPrivacy: PrivacyAnalysisResult | null,
    nextCats: DataCategoryId[],
    deletionDisclosed: boolean,
    customTitle?: string,
    isDemoFlag = false
  ) => {
    const outcomes = runWhatIfScenarios({
      detectedCategoryIds: nextCats,
      overallSensitivity: nextPrivacy?.overallSensitivity ?? computeSensitivityForCategories(nextCats),
      hasDeletionPolicyDisclosed: deletionDisclosed,
      claimAnalysis: nextClaim,
    });

    const title =
      customTitle ??
      (nextClaim
        ? `Analysis: ${nextClaim.input.slice(0, 46)}${nextClaim.input.length > 46 ? '...' : ''}`
        : 'Privacy Notice Assessment');

    const report = buildUnifiedReport({
      title,
      isDemoScenario: isDemoFlag,
      claimAnalysis: nextClaim,
      privacyAnalysis: nextPrivacy,
      whatIfOutcomes: outcomes,
    });

    const record: AnalysisHistoryRecord = {
      id: report.id,
      title: report.title,
      createdAt: report.generatedAt,
      claimVerdict: nextClaim ? nextClaim.verdict : 'Not Run',
      privacyLevel: nextPrivacy ? nextPrivacy.overallSensitivity : 'Not Run',
      detectedCategoryCount: nextPrivacy ? nextPrivacy.detectedCategories.length : nextCats.length,
      isDemo: isDemoFlag,
      report,
    };

    setHistory((prev) => [record, ...prev].slice(0, 12));
  };

  const handleAnalyzeClaim = async (input: string, mode: ClaimVerificationMode = 'auto') => {
    const res = await analyzeClaimWithLiveFallback(input, mode);
    setClaimResult(res);
    setArchivedReport(null);
    appendReportToHistory(
      res,
      privacyResult,
      selectedCategories,
      hasDeletionDisclosed,
      undefined,
      res.isDemoMatch
    );
    setStatusNotice(
      `Claim evaluated (${res.sourceMode}): ${res.verdict} · Evidence Match: ${res.evidenceMatchStatus}`
    );
  };

  const handleClearClaim = () => {
    setClaimInput('');
    setClaimResult(null);
    setArchivedReport(null);
  };

  const handleAnalyzePrivacy = (text: string) => {
    const res = analyzePrivacyText(text);
    const detectedIds = res.detectedCategories.map((c) => c.categoryId);
    const hasDeletion = !res.missingDisclosures.some((d) =>
      d.toLowerCase().includes('consent withdrawal')
    );

    setPrivacyResult(res);
    setSelectedCategories(detectedIds);
    setHasDeletionDisclosed(hasDeletion);
    setArchivedReport(null);

    appendReportToHistory(
      claimResult,
      res,
      detectedIds,
      hasDeletion,
      undefined,
      text.includes('DEMO DATA')
    );
    setStatusNotice(
      `Privacy assessed: ${res.overallSensitivity} (${res.detectedCategories.length} categories detected)`
    );
  };

  const handleClearPrivacy = () => {
    setPrivacyInput('');
    setPrivacyResult(null);
    setSelectedCategories([]);
    setArchivedReport(null);
  };

  const handleToggleCategory = (categoryId: DataCategoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
    setArchivedReport(null);
  };

  const handleSyncFromPrivacy = () => {
    if (!privacyResult) return;
    setSelectedCategories(privacyResult.detectedCategories.map((c) => c.categoryId));
    setHasDeletionDisclosed(
      !privacyResult.missingDisclosures.some((d) => d.toLowerCase().includes('consent withdrawal'))
    );
    setStatusNotice('What-If simulator synced with active Privacy Assessment.');
  };

  const handleRunScholarshipDemo = () => {
    const claimRes = analyzeClaimAgainstDemoDataset(SCHOLARSHIP_DEMO_SCENARIO.claimText);
    const privacyRes = analyzePrivacyText(SCHOLARSHIP_DEMO_SCENARIO.formAndNoticeText);
    const detectedIds = privacyRes.detectedCategories.map((c) => c.categoryId);

    setClaimInput(SCHOLARSHIP_DEMO_SCENARIO.claimText);
    setPrivacyInput(SCHOLARSHIP_DEMO_SCENARIO.formAndNoticeText);
    setClaimResult(claimRes);
    setPrivacyResult(privacyRes);
    setSelectedCategories(detectedIds);
    setHasDeletionDisclosed(false);
    setArchivedReport(null);

    appendReportToHistory(
      claimRes,
      privacyRes,
      detectedIds,
      false,
      SCHOLARSHIP_DEMO_SCENARIO.title,
      true
    );

    setActiveSection('report');
    setStatusNotice('Loaded Fictional Scholarship Demo (DEMO DATA) across all modules.');
  };

  const handleResetDemo = () => {
    const fresh = createInitialDemoBundle();
    setClaimInput(fresh.claimInput);
    setPrivacyInput(fresh.privacyInput);
    setClaimResult(fresh.claimResult);
    setPrivacyResult(fresh.privacyResult);
    setSelectedCategories(fresh.selectedCategories);
    setHasDeletionDisclosed(fresh.hasDeletionDisclosed);
    setHistory(fresh.history);
    setArchivedReport(null);
    setActiveSection('dashboard');
    setStatusNotice('Workspace reset to initial Scholarship & Sample Demo state.');
  };

  const handleSaveCurrentReport = () => {
    appendReportToHistory(
      claimResult,
      privacyResult,
      selectedCategories,
      hasDeletionDisclosed,
      liveReport.title,
      liveReport.isDemoScenario
    );
    setStatusNotice('Unified TrustLens Report saved to Recent Analysis Reports.');
  };

  const handleOpenReportFromHistory = (record: AnalysisHistoryRecord) => {
    setArchivedReport(record.report);
    setActiveSection('report');
  };

  return (
    <div className="min-h-screen flex bg-[#0B1120] text-slate-100">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          if (sec !== 'report') setArchivedReport(null);
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        hasClaimResult={claimResult !== null}
        hasPrivacyResult={privacyResult !== null}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Contextual Top Bar (Hidden when printing) */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-800/90 bg-[#0B1120]/95 backdrop-blur-xs px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="font-medium text-slate-400 hidden sm:inline">TrustLens</span>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-display font-semibold text-slate-100 truncate">
                {SECTION_TITLES[activeSection]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRunScholarshipDemo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-500/25 transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Scholarship Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Reset Demo</span>
            </button>
          </div>
        </header>

        {/* Subtle Non-blocking Status Notification */}
        {statusNotice && (
          <div className="no-print px-4 pt-4 sm:px-6 lg:px-8">
            <div
              role="status"
              className="mx-auto max-w-6xl rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs font-medium text-blue-200"
            >
              {statusNotice}
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {activeSection !== 'dashboard' && activeSection !== 'methodology' && (
              <nav
                aria-label="Connected Analysis Workflow"
                className="no-print grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-xl border border-slate-800 bg-[#111A2E] p-2"
              >
                {[
                  {
                    id: 'claim' as const,
                    step: '1. Claim Verification',
                    status: claimResult ? claimResult.verdict : 'Pending',
                  },
                  {
                    id: 'privacy' as const,
                    step: '2. Privacy Assessment',
                    status: privacyResult
                      ? `${privacyResult.detectedCategories.length} fields · ${privacyResult.overallSensitivity}`
                      : 'Pending',
                  },
                  {
                    id: 'whatif' as const,
                    step: '3. What-If Analysis',
                    status: `${selectedCategories.length} active · ${activeWhatIfSensitivity}`,
                  },
                  {
                    id: 'report' as const,
                    step: '4. Unified Report',
                    status: archivedReport
                      ? 'Archived View'
                      : claimResult || privacyResult
                        ? 'Live Synced'
                        : 'Waiting',
                  },
                ].map((stage) => {
                  const isCurrent = activeSection === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(stage.id);
                        if (stage.id !== 'report') setArchivedReport(null);
                      }}
                      className={`rounded-lg px-3 py-2 text-left transition-colors ${
                        isCurrent
                          ? 'bg-blue-600/20 border border-blue-500/40'
                          : 'border border-transparent hover:bg-slate-800/60'
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold truncate ${
                          isCurrent ? 'text-blue-200' : 'text-slate-200'
                        }`}
                      >
                        {stage.step}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400 truncate tabular-nums">
                        {stage.status}
                      </p>
                    </button>
                  );
                })}
              </nav>
            )}

            {activeSection === 'dashboard' && (
              <DashboardView
                history={history}
                activeClaim={claimResult}
                activePrivacy={privacyResult}
                activeWhatIf={whatIfOutcomes}
                onNavigate={setActiveSection}
                onRunScholarshipDemo={handleRunScholarshipDemo}
                onOpenReportFromHistory={handleOpenReportFromHistory}
              />
            )}

            {activeSection === 'claim' && (
              <ClaimVerificationView
                inputValue={claimInput}
                onChangeInput={setClaimInput}
                result={claimResult}
                onAnalyzeClaim={handleAnalyzeClaim}
                onClearClaim={handleClearClaim}
                onGoToPrivacy={() => setActiveSection('privacy')}
                onGoToReport={() => {
                  setArchivedReport(null);
                  setActiveSection('report');
                }}
              />
            )}

            {activeSection === 'privacy' && (
              <PrivacyAssessmentView
                inputValue={privacyInput}
                onChangeInput={setPrivacyInput}
                result={privacyResult}
                onAnalyzePrivacy={handleAnalyzePrivacy}
                onClearPrivacy={handleClearPrivacy}
                onGoToWhatIf={() => setActiveSection('whatif')}
              />
            )}

            {activeSection === 'whatif' && (
              <WhatIfView
                selectedCategories={selectedCategories}
                activeSensitivity={activeWhatIfSensitivity}
                onToggleCategory={handleToggleCategory}
                hasDeletionDisclosed={hasDeletionDisclosed}
                onToggleDeletionDisclosed={(val) => {
                  setHasDeletionDisclosed(val);
                  setArchivedReport(null);
                }}
                onSyncFromPrivacy={handleSyncFromPrivacy}
                privacyResult={privacyResult}
                claimResult={claimResult}
                outcomes={whatIfOutcomes}
                onGoToReport={() => {
                  setArchivedReport(null);
                  setActiveSection('report');
                }}
              />
            )}

            {activeSection === 'report' && (
              <UnifiedReportView
                report={archivedReport ?? liveReport}
                isViewingArchived={archivedReport !== null}
                onSaveToHistory={handleSaveCurrentReport}
                onReturnToLiveWorkspace={() => setArchivedReport(null)}
                onRunScholarshipDemo={handleRunScholarshipDemo}
              />
            )}

            {activeSection === 'methodology' && (
              <MethodologyView onRunScholarshipDemo={handleRunScholarshipDemo} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
