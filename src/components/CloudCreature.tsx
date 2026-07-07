import type { Creature, Point } from '../game/types';

interface CloudCreatureProps {
  creature?: Creature | null;
  points?: Point[];
  animated?: boolean;
  compact?: boolean;
}

function getViewBox(creature: Creature, compact: boolean) {
  const padding = compact ? 42 : 90;
  const { bounds, width, height } = creature.shape;

  return `${bounds.minX - padding} ${bounds.minY - padding} ${width + padding * 2} ${height + padding * 2}`;
}

function GeneratedImageCreature({ creature, compact }: { creature: Creature; compact: boolean }) {
  const { bounds, width, height } = creature.shape;
  const padding = compact ? 32 : 72;

  return (
    <image
      className={compact ? undefined : 'generated-creature-image'}
      href={creature.generatedImage?.dataUrl}
      x={bounds.minX - padding}
      y={bounds.minY - padding}
      width={width + padding * 2}
      height={height + padding * 2}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

function EyePair({ creature }: { creature: Creature }) {
  const { bounds, width, height } = creature.shape;
  const { eyes, asymmetry, blush } = creature.features;
  const centerX = bounds.minX + width / 2;
  const centerY = bounds.minY + height / 2;
  const eyeY = centerY - height * 0.08;
  const gap = Math.min(width * 0.2, 46);
  const eyeSize = Math.max(5, Math.min(width, height) * 0.08);
  const leftX = centerX - gap;
  const rightX = centerX + gap + asymmetry;

  if (eyes === 'sleepy') {
    return (
      <g className="creature-face">
        <path d={`M ${leftX - eyeSize} ${eyeY} Q ${leftX} ${eyeY + eyeSize * 0.75} ${leftX + eyeSize} ${eyeY}`} />
        <path d={`M ${rightX - eyeSize} ${eyeY} Q ${rightX} ${eyeY + eyeSize * 0.75} ${rightX + eyeSize} ${eyeY}`} />
        {blush ? <Blush leftX={leftX} rightX={rightX} y={eyeY + eyeSize * 2.1} /> : null}
      </g>
    );
  }

  if (eyes === 'happy') {
    return (
      <g className="creature-face">
        <path d={`M ${leftX - eyeSize} ${eyeY + 2} Q ${leftX} ${eyeY - eyeSize * 0.9} ${leftX + eyeSize} ${eyeY + 2}`} />
        <path d={`M ${rightX - eyeSize} ${eyeY + 2} Q ${rightX} ${eyeY - eyeSize * 0.9} ${rightX + eyeSize} ${eyeY + 2}`} />
        {blush ? <Blush leftX={leftX} rightX={rightX} y={eyeY + eyeSize * 2.1} /> : null}
      </g>
    );
  }

  const iris = eyes === 'big' ? eyeSize * 1.42 : eyes === 'tiny' ? eyeSize * 0.6 : eyeSize;

  return (
    <g>
      <circle className="eye-white" cx={leftX} cy={eyeY} r={iris} />
      <circle className="eye-white" cx={rightX} cy={eyeY} r={iris} />
      <circle className="eye-ink" cx={leftX + iris * 0.16} cy={eyeY + iris * 0.08} r={iris * 0.42} />
      <circle className="eye-ink" cx={rightX + iris * 0.16} cy={eyeY + iris * 0.08} r={iris * 0.42} />
      <circle className="eye-shine" cx={leftX - iris * 0.18} cy={eyeY - iris * 0.22} r={Math.max(1.5, iris * 0.18)} />
      <circle className="eye-shine" cx={rightX - iris * 0.18} cy={eyeY - iris * 0.22} r={Math.max(1.5, iris * 0.18)} />
      {blush ? <Blush leftX={leftX} rightX={rightX} y={eyeY + iris * 1.7} /> : null}
    </g>
  );
}

function Blush({ leftX, rightX, y }: { leftX: number; rightX: number; y: number }) {
  return (
    <g className="blush">
      <ellipse cx={leftX - 24} cy={y} rx="12" ry="6" />
      <ellipse cx={rightX + 24} cy={y} rx="12" ry="6" />
    </g>
  );
}

function Mouth({ creature }: { creature: Creature }) {
  const { bounds, width, height } = creature.shape;
  const centerX = bounds.minX + width / 2;
  const centerY = bounds.minY + height / 2;
  const y = centerY + height * 0.12;
  const size = Math.max(8, Math.min(width, height) * 0.08);

  if (creature.features.mouth === 'o') {
    return <ellipse className="mouth-fill" cx={centerX} cy={y} rx={size * 0.65} ry={size * 0.9} />;
  }

  if (creature.features.mouth === 'sleepy') {
    return <path className="mouth-line" d={`M ${centerX - size} ${y} L ${centerX + size} ${y}`} />;
  }

  if (creature.features.mouth === 'grin') {
    return <path className="mouth-line" d={`M ${centerX - size * 1.4} ${y} Q ${centerX} ${y + size * 1.8} ${centerX + size * 1.4} ${y}`} />;
  }

  return <path className="mouth-line" d={`M ${centerX - size * 1.15} ${y} Q ${centerX} ${y + size * 1.45} ${centerX + size * 1.15} ${y}`} />;
}

function Extras({ creature }: { creature: Creature }) {
  const { bounds, width, height } = creature.shape;
  const centerX = bounds.minX + width / 2;
  const top = bounds.minY;
  const bottom = bounds.maxY;
  const left = bounds.minX;
  const right = bounds.maxX;
  const extras = creature.features.extras;
  const legCount = extras.includes('many-legs') ? 7 : 3;

  return (
    <g className="creature-extras">
      {extras.includes('wings') ? (
        <g className="wings">
          <ellipse cx={left - width * 0.08} cy={top + height * 0.48} rx={width * 0.18} ry={height * 0.24} />
          <ellipse cx={right + width * 0.08} cy={top + height * 0.48} rx={width * 0.18} ry={height * 0.24} />
        </g>
      ) : null}
      {extras.includes('legs') || extras.includes('many-legs') ? (
        <g className="legs">
          {Array.from({ length: legCount }, (_, index) => {
            const x = left + (width / (legCount + 1)) * (index + 1);
            return <path key={x} d={`M ${x} ${bottom - 5} Q ${x - 6} ${bottom + 22} ${x + 6} ${bottom + 32}`} />;
          })}
        </g>
      ) : null}
      {extras.includes('tail') ? (
        <path className="tail" d={`M ${right - 8} ${top + height * 0.52} Q ${right + 44} ${top + height * 0.62} ${right + 25} ${top + height * 0.8}`} />
      ) : null}
      {extras.includes('raindrops') ? (
        <g className="raindrops">
          {[0.35, 0.5, 0.65].map((offset) => (
            <path key={offset} d={`M ${left + width * offset} ${bottom + 16} C ${left + width * offset - 8} ${bottom + 31} ${left + width * offset - 4} ${bottom + 42} ${left + width * offset} ${bottom + 42} C ${left + width * offset + 6} ${bottom + 42} ${left + width * offset + 9} ${bottom + 31} ${left + width * offset} ${bottom + 16} Z`} />
          ))}
        </g>
      ) : null}
      {extras.includes('sparkles') ? (
        <g className="sparkles">
          <path d={`M ${left + 18} ${top + 8} L ${left + 24} ${top + 24} L ${left + 40} ${top + 30} L ${left + 24} ${top + 36} L ${left + 18} ${top + 52} L ${left + 12} ${top + 36} L ${left - 4} ${top + 30} L ${left + 12} ${top + 24} Z`} />
          <path d={`M ${right - 10} ${bottom - 46} L ${right - 5} ${bottom - 34} L ${right + 8} ${bottom - 30} L ${right - 5} ${bottom - 25} L ${right - 10} ${bottom - 12} L ${right - 15} ${bottom - 25} L ${right - 28} ${bottom - 30} L ${right - 15} ${bottom - 34} Z`} />
        </g>
      ) : null}
      {creature.features.accessory === 'antennae' ? (
        <g className="antennae">
          <path d={`M ${centerX - 22} ${top + 12} Q ${centerX - 50} ${top - 34} ${centerX - 30} ${top - 58}`} />
          <path d={`M ${centerX + 22} ${top + 12} Q ${centerX + 50} ${top - 34} ${centerX + 30} ${top - 58}`} />
          <circle cx={centerX - 30} cy={top - 58} r="8" />
          <circle cx={centerX + 30} cy={top - 58} r="8" />
        </g>
      ) : null}
      {creature.features.accessory === 'horns' ? (
        <g className="horns">
          <path d={`M ${centerX - 44} ${top + 16} L ${centerX - 26} ${top - 28} L ${centerX - 7} ${top + 14} Z`} />
          <path d={`M ${centerX + 44} ${top + 16} L ${centerX + 26} ${top - 28} L ${centerX + 7} ${top + 14} Z`} />
        </g>
      ) : null}
      {creature.features.accessory === 'crown' ? (
        <path className="crown" d={`M ${centerX - 38} ${top - 8} L ${centerX - 20} ${top - 36} L ${centerX} ${top - 10} L ${centerX + 20} ${top - 36} L ${centerX + 38} ${top - 8} Z`} />
      ) : null}
      {creature.features.accessory === 'halo' ? <ellipse className="halo" cx={centerX} cy={top - 28} rx={width * 0.22} ry="10" /> : null}
      {creature.features.accessory === 'bow' ? (
        <g className="bow">
          <path d={`M ${centerX - 12} ${top + 12} C ${centerX - 60} ${top - 18} ${centerX - 62} ${top + 42} ${centerX - 12} ${top + 18} Z`} />
          <path d={`M ${centerX + 12} ${top + 12} C ${centerX + 60} ${top - 18} ${centerX + 62} ${top + 42} ${centerX + 12} ${top + 18} Z`} />
          <circle cx={centerX} cy={top + 16} r="9" />
        </g>
      ) : null}
    </g>
  );
}

export function CloudCreature({ creature, points = [], animated = false, compact = false }: CloudCreatureProps) {
  if (!creature) {
    return (
      <g className="draft-cloud">
        {points.map((point, index) => (
          <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={point.radius} />
        ))}
      </g>
    );
  }

  const cloud = (
    <g>
      {creature.generatedImage ? (
        <GeneratedImageCreature creature={creature} compact={compact} />
      ) : (
        <>
          <Extras creature={creature} />
          <g className="living-cloud">
            {creature.shape.points.map((point, index) => (
              <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={point.radius} />
            ))}
          </g>
          <EyePair creature={creature} />
          <Mouth creature={creature} />
        </>
      )}
    </g>
  );

  if (compact) {
    return (
      <svg className="creature-thumb" viewBox={getViewBox(creature, true)} role="img" aria-label={creature.name}>
        {cloud}
      </svg>
    );
  }

  return <g className={animated ? 'creature-float' : undefined}>{cloud}</g>;
}
