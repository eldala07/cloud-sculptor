interface BrushControlsProps {
  brushSize: number;
  onBrushSizeChange: (value: number) => void;
}

export function BrushControls({ brushSize, onBrushSizeChange }: BrushControlsProps) {
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
      <ol className="steps">
        <li>Draw a cloud</li>
        <li>Bring it to life</li>
        <li>Save your favorite cloud friends</li>
      </ol>
    </section>
  );
}
