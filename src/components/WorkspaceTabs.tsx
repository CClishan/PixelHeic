interface WorkspaceTabsProps {
  activeLabel: string;
  getButtonClassName: (active: boolean) => string;
}

export function WorkspaceTabs({ activeLabel, getButtonClassName }: WorkspaceTabsProps) {
  return (
    <div className="tabs-shell">
      <div className="tabs-strip">
        <button type="button" className={getButtonClassName(true)} aria-current="page">
          {activeLabel}
        </button>
      </div>
    </div>
  );
}
