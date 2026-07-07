import { useEffect, useMemo, useRef, useState } from 'react';
import { BrushControls } from './components/BrushControls';
import { CloudCreature } from './components/CloudCreature';
import { CreatureCard } from './components/CreatureCard';
import { Gallery } from './components/Gallery';
import { TopBar } from './components/TopBar';
import { createCreatureFromPoints } from './game/generator';
import type { Creature, Point, SavedCreature } from './game/types';
import './styles/app.css';

const savedKey = 'cloud-sculptor.saved-creatures';
const minimumCloudPoints = 5;

function loadSavedCreatures(): SavedCreature[] {
  const rawValue = window.localStorage.getItem(savedKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as SavedCreature[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export default function App() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [brushSize, setBrushSize] = useState(34);
  const [isDrawing, setIsDrawing] = useState(false);
  const [creature, setCreature] = useState<Creature | null>(null);
  const [creatureName, setCreatureName] = useState('');
  const [savedCreatures, setSavedCreatures] = useState<SavedCreature[]>(() => loadSavedCreatures());

  useEffect(() => {
    window.localStorage.setItem(savedKey, JSON.stringify(savedCreatures));
  }, [savedCreatures]);

  const canBringToLife = points.length >= minimumCloudPoints;
  const canSave = Boolean(creature && creatureName.trim());
  const statusText = useMemo(() => {
    if (creature) {
      return `${creature.name} is gently floating.`;
    }

    if (points.length > 0) {
      return 'Keep sculpting or bring this cloud to life.';
    }

    return 'Draw a fluffy cloud anywhere in the sky.';
  }, [creature, points.length]);

  function getPoint(clientX: number, clientY: number): Point | null {
    const stage = stageRef.current;

    if (!stage) {
      return null;
    }

    const rect = stage.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      radius: brushSize,
    };
  }

  function addPoint(point: Point) {
    setPoints((currentPoints) => {
      const previousPoint = currentPoints.at(-1);

      if (previousPoint && Math.hypot(previousPoint.x - point.x, previousPoint.y - point.y) < brushSize * 0.34) {
        return currentPoints;
      }

      return [...currentPoints, point];
    });
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPoint(event.clientX, event.clientY);

    if (!point) {
      return;
    }

    if (creature) {
      setCreature(null);
      setCreatureName('');
      setPoints([point]);
    } else {
      addPoint(point);
    }

    setIsDrawing(true);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!isDrawing) {
      return;
    }

    const point = getPoint(event.clientX, event.clientY);

    if (point) {
      addPoint(point);
    }
  }

  function stopDrawing(event: React.PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDrawing(false);
  }

  function bringToLife() {
    if (!canBringToLife) {
      return;
    }

    const nextCreature = createCreatureFromPoints(points);
    setCreature(nextCreature);
    setCreatureName(nextCreature.name);
  }

  function clearCanvas() {
    setPoints([]);
    setCreature(null);
    setCreatureName('');
    setIsDrawing(false);
  }

  function saveCreature() {
    if (!creature || !creatureName.trim()) {
      return;
    }

    const savedCreature: SavedCreature = {
      ...creature,
      id: `${creature.id}-saved-${Date.now().toString(36)}`,
      name: creatureName.trim(),
      savedAt: new Date().toISOString(),
    };

    setSavedCreatures((currentCreatures) => [savedCreature, ...currentCreatures].slice(0, 12));
  }

  function deleteCreature(id: string) {
    setSavedCreatures((currentCreatures) => currentCreatures.filter((savedCreature) => savedCreature.id !== id));
  }

  return (
    <main className="app-shell" aria-label="Cloud Sculptor app">
      <div className="sky-decoration cloud-one" />
      <div className="sky-decoration cloud-two" />
      <TopBar canBringToLife={canBringToLife} onBringToLife={bringToLife} onClear={clearCanvas} />
      <section className="workspace">
        <div className="sky-stage" ref={stageRef}>
          <svg
            className="draw-surface"
            role="application"
            aria-label="Draw clouds here"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
          >
            <defs>
              <filter id="cloud-soft-shadow" x="-35%" y="-35%" width="170%" height="170%">
                <feDropShadow dx="0" dy="16" stdDeviation="11" floodColor="#6d93b4" floodOpacity="0.24" />
              </filter>
            </defs>
            <CloudCreature creature={creature} points={points} animated />
          </svg>
          <div className="sky-status">{statusText}</div>
        </div>
        <aside className="control-panel" aria-label="Cloud sculpting controls">
          <BrushControls brushSize={brushSize} onBrushSizeChange={setBrushSize} />
          <CreatureCard
            creature={creature}
            name={creatureName}
            onNameChange={setCreatureName}
            onSave={saveCreature}
            canSave={canSave}
          />
          <Gallery creatures={savedCreatures} onDelete={deleteCreature} />
        </aside>
      </section>
    </main>
  );
}
