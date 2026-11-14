import {
  BookOpen,
  FileCheck2,
  FileText,
  GitBranch,
  LayoutDashboard,
  ShieldCheck,
  Shield,
  X,
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'claim'
  | 'privacy'
  | 'whatif'
  | 'report'
  | 'methodology';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  hasClaimResult: boolean;
  hasPrivacyResult: boolean;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'claim', label: 'Claim Verification', icon: FileCheck2 },
  { id: 'privacy', label: 'Privacy Assessment', icon: ShieldCheck },
  { id: 'whatif', label: 'What-If Analysis', icon: GitBranch },
  { id: 'report', label: 'Unified Report', icon: FileText },
  { id: 'methodology', label: 'Methodology & Demo', icon: BookOpen },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
  hasClaimResult,
  hasPrivacyResult,
}: SidebarProps) {
  const navContent = (
    <div className="flex h-full flex-col justify-between bg-[#0F172A] border-r border-slate-800/90 px-4 py-5">
      <div>
        <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 text-blue-400">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
              TrustLens
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary Navigation" className="mt-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            const completedMark =
              (item.id === 'claim' && hasClaimResult) ||
              (item.id === 'privacy' && hasPrivacyResult);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active
                    ? 'bg-blue-500/15 text-blue-200 border border-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`}
                    aria-hidden="true"
                  />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </span>
                {completedMark && (
                  <span className="font-mono text-[10px] text-emerald-400 shrink-0">Ready</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800/80 pt-4 px-2 space-y-2">
        <p className="text-xs font-medium text-slate-300">Local Prototype Mode</p>
        <p className="text-xs leading-relaxed text-slate-400">
          Rule-based evaluation runs strictly in your browser. No external APIs or personal data storage.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 no-print">{navContent}</aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] h-full">{navContent}</aside>
        </div>
      )}
    </>
  );
}
