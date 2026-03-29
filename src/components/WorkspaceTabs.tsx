interface WorkspaceTabsProps {
  activeLabel: string;
}

export function WorkspaceTabs({ activeLabel }: WorkspaceTabsProps) {
  return (
    <div className="tabs-shell">
      <div className="tabs-strip">
        <button type="button" className="workspace-tab workspace-tab--active" aria-current="page">
          {activeLabel}
        </button>
      </div>
    </div>
  );
}
