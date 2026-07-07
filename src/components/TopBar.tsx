interface TopBarProps {
  canBringToLife: boolean;
  onBringToLife: () => void;
  onClear: () => void;
}

export function TopBar({ canBringToLife, onBringToLife, onClear }: TopBarProps) {
  return (
    <header className="top-bar">
      <div>
        <p className="app-label">Relaxing sky canvas</p>
        <h1>Cloud Sculptor</h1>
      </div>
      <div className="top-actions">
        <button type="button" className="secondary-action" onClick={onClear}>
          Clear
        </button>
        <button type="button" className="primary-action" onClick={onBringToLife} disabled={!canBringToLife}>
          Bring to Life
        </button>
      </div>
    </header>
  );
}
