import { BookOpen, Database, Play, Shield } from 'lucide-react';
import {
  SAMPLE_EVIDENCE_DATASET,
  SCHOLARSHIP_DEMO_SCENARIO,
  UNCERTAINTY_DEFINITIONS,
} from '../data/sampleDataset';
import { UncertaintyTag } from './UncertaintyTag';

interface MethodologyViewProps {
  onRunScholarshipDemo: () => void;
}

export function MethodologyView({ onRunScholarshipDemo }: MethodologyViewProps) {
  return (
    <div className="space-y-6">
      {/* Uncertainty Classification Guide */}
      <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-100">
          <BookOpen className="h-5 w-5 text-blue-400 shrink-0" aria-hidden="true" />
          <h1 className="font-display text-xl font-bold">
            Uncertainty Labels &amp; Transparent Rule Methodology
          </h1>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">
          Every finding across TrustLens carries an explicit epistemic label so evaluators and
          non-technical users can distinguish verified evidence from rule-based inference and missing
          disclosures.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-2">
          {(['CONFIRMED', 'INFERRED', 'UNKNOWN'] as const).map((key) => {
            const def = UNCERTAINTY_DEFINITIONS[key];
            return (
              <div
                key={key}
                className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-2.5"
              >
                <UncertaintyTag label={key} />
                <p className="text-xs font-semibold text-slate-200">{def.shortDesc}</p>
                <p className="text-xs leading-relaxed text-slate-400">{def.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Fictional Scholarship Demo Blueprint */}
      <section className="rounded-xl border border-slate-800 bg-[#111A2E] p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" aria-hidden="true" />
              <h2 className="font-display text-base font-semibold text-slate-100">
                Fictional Scholarship Website Walkthrough (DEMO DATA)
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Demonstrates end-to-end claim verification, 5-field privacy assessment, What-If
              simulation, and unified reporting using synthetic data.
            </p>
          </div>
          <button
            type="button"
            onClick={onRunScholarshipDemo}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Load &amp; Run Scholarship Demo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-2">
            <p className="font-mono text-xs text-violet-300">DEMO DATA · Sample Claim</p>
            <p className="text-xs leading-relaxed text-slate-300">
              {SCHOLARSHIP_DEMO_SCENARIO.claimText}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#0B1120] p-4 space-y-2">
            <p className="font-mono text-xs text-violet-300">DEMO DATA · Sample Form Fields</p>
            <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">
              {SCHOLARSHIP_DEMO_SCENARIO.formAndNoticeText}
            </p>
          </div>
        </div>
      </section>

      {/* Built-In Sample Evidence Dataset Table */}
      <section className="rounded-xl border border-slate-800 bg-[#111A2E] overflow-hidden">
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-400" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-slate-100">
              Built-In Sample Evidence Dataset (DEMO DATA)
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            {SAMPLE_EVIDENCE_DATASET.length} synthetic records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-medium text-slate-400">
                <th className="py-3 px-6">Evidence ID</th>
                <th className="py-3 px-4">Title &amp; Source</th>
                <th className="py-3 px-4">Stance</th>
                <th className="py-3 px-6">Excerpt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {SAMPLE_EVIDENCE_DATASET.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="py-3.5 px-6 font-mono text-slate-200 whitespace-nowrap">
                    {item.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-100">{item.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {item.sourceLabel}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`font-mono font-medium ${
                        item.stance === 'Supports' ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {item.stance}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-300 leading-relaxed max-w-md">
                    {item.excerpt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
