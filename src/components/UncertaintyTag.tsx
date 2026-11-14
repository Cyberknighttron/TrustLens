import { AlertTriangle, CheckCircle2, HelpCircle, Info, ShieldAlert, XCircle } from 'lucide-react';
import { ClaimVerdict, ReversibilityLevel, SensitivityLevel, UncertaintyLabel } from '../types/trustlens';
import { UNCERTAINTY_DEFINITIONS } from '../data/sampleDataset';

interface UncertaintyTagProps {
  label: UncertaintyLabel;
  prefix?: string;
  showDescription?: boolean;
}

export function UncertaintyTag({
  label,
  prefix,
  showDescription = false,
}: UncertaintyTagProps) {
  const styles: Record<UncertaintyLabel, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
    CONFIRMED: {
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: CheckCircle2,
    },
    INFERRED: {
      color: 'text-blue-300',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: Info,
    },
    UNKNOWN: {
      color: 'text-amber-300',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: HelpCircle,
    },
  };

  const config = styles[label];
  const Icon = config.icon;
  const def = UNCERTAINTY_DEFINITIONS[label];

  return (
    <span
      title={def.shortDesc}
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide whitespace-nowrap shrink-0 ${config.bg} ${config.border} ${config.color}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{prefix ? `${prefix}: ${label}` : label}</span>
      {showDescription && <span className="font-sans font-normal text-slate-300">— {def.shortDesc}</span>}
    </span>
  );
}

export function VerdictIndicator({
  verdict,
  prefix,
}: {
  verdict: ClaimVerdict;
  prefix?: string;
}) {
  const text = prefix ? `${prefix}: ${verdict}` : verdict;
  if (verdict === 'Supported') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 whitespace-nowrap shrink-0">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{text}</span>
      </span>
    );
  }
  if (verdict === 'Disputed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 whitespace-nowrap shrink-0">
        <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{text}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 whitespace-nowrap shrink-0">
      <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}

export function SensitivityIndicator({ level }: { level: SensitivityLevel }) {
  const map: Record<SensitivityLevel, { cls: string; icon: typeof Info }> = {
    Low: {
      cls: 'border-slate-600/50 bg-slate-700/30 text-slate-200',
      icon: Info,
    },
    Moderate: {
      cls: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
      icon: Info,
    },
    High: {
      cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      icon: AlertTriangle,
    },
    Critical: {
      cls: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      icon: ShieldAlert,
    },
  };
  const cfg = map[level];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${cfg.cls}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{level}</span>
    </span>
  );
}

export function ReversibilityIndicator({ level }: { level: ReversibilityLevel }) {
  const map: Record<ReversibilityLevel, string> = {
    High: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    Moderate: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    Low: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    'Very Low': 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  };

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${map[level]}`}
    >
      Reversibility: {level}
    </span>
  );
}
