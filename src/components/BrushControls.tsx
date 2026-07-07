interface BrushControlsProps {
  brushSize: number;
  aiEnabled: boolean;
  paradeEnabled: boolean;
  onBrushSizeChange: (value: number) => void;
  onAiEnabledChange: (value: boolean) => void;
  onParadeEnabledChange: (value: boolean) => void;
}

export function BrushControls({
  brushSize,
  aiEnabled,
  paradeEnabled,
  onBrushSizeChange,
  onAiEnabledChange,
  onParadeEnabledChange,
}: BrushControlsProps) {
  return (
    <section className="panel-section brush-panel">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Brush</p>
          <h2>Fluff size</h2>
        </div>
        <span className="brush-size">{brushSize}px</span>
      </div>
      <input
        aria-label="Brush size"
        type="range"
        min="18"
        max="64"
        value={brushSize}
        onChange={(event) => onBrushSizeChange(Number(event.target.value))}
      />
      <label className="toggle-row">
        <span>
          <strong>AI images</strong>
          <small>{aiEnabled ? 'Generate a cloud-creature picture' : 'Use local procedural magic'}</small>
        </span>
        <input
          type="checkbox"
          checked={aiEnabled}
          onChange={(event) => onAiEnabledChange(event.target.checked)}
          aria-label="Enable AI image generation"
        />
      </label>
      <label className="toggle-row">
        <span>
          <strong>Cloud parade</strong>
          <small>{paradeEnabled ? 'Saved friends drift across the sky' : 'Keep saved friends in the gallery'}</small>
        </span>
        <input
          type="checkbox"
          checked={paradeEnabled}
          onChange={(event) => onParadeEnabledChange(event.target.checked)}
          aria-label="Enable saved cloud parade"
        />
      </label>
      <ol className="steps">
        <li>Draw a cloud</li>
        <li>Bring it to life</li>
        <li>Save your favorite cloud friends</li>
      </ol>
    </section>
  );
}
