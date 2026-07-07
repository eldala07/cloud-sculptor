import { useEffect, useMemo, useRef, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { BrushControls } from './components/BrushControls';
import { CloudCreature } from './components/CloudCreature';
import { CreatureCard } from './components/CreatureCard';
import { Gallery } from './components/Gallery';
import { SkyParade } from './components/SkyParade';
import { TopBar } from './components/TopBar';
import { createCreatureWithAi, type CreatureGenerationResult } from './game/ai';
import { createCreatureFromPoints } from './game/generator';
import type { Creature, Point, SavedCreature } from './game/types';
import './styles/app.css';

const savedKey = 'cloud-sculptor.saved-creatures';
const aiEnabledKey = 'cloud-sculptor.ai-enabled';
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
  const [aiEnabled, setAiEnabled] = useState(() => window.localStorage.getItem(aiEnabledKey) !== 'false');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<CreatureGenerationResult['source'] | null>(null);
  const [generationNote, setGenerationNote] = useState('');
  const [creature, setCreature] = useState<Creature | null>(null);
  const [creatureName, setCreatureName] = useState('');
  const [savedCreatures, setSavedCreatures] = useState<SavedCreature[]>(() => loadSavedCreatures());

  useEffect(() => {
    window.localStorage.setItem(savedKey, JSON.stringify(savedCreatures));
  }, [savedCreatures]);

  useEffect(() => {
    window.localStorage.setItem(aiEnabledKey, String(aiEnabled));
  }, [aiEnabled]);

  const canBringToLife = points.length >= minimumCloudPoints;
  const canSave = Boolean(creature && creatureName.trim());
  const statusText = useMemo(() => {
    if (isGenerating) {
      return aiEnabled ? 'Asking the sky for a generated cloud-creature picture...' : 'Shaping local cloud magic...';
    }

    if (creature) {
      if (generationSource === 'ai-image') {
        return `${creature.name} is floating as a generated cloud-creature image.`;
      }

      return generationSource === 'ai'
        ? `${creature.name} is gently floating with AI-sparked traits.`
        : generationNote || `${creature.name} is gently floating from local cloud magic.`;
    }

    if (points.length > 0) {
      return 'Keep sculpting or bring this cloud to life.';
    }

    return 'Draw a fluffy cloud anywhere in the sky.';
  }, [aiEnabled, creature, generationNote, generationSource, isGenerating, points.length]);

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
      setGenerationSource(null);
      setGenerationNote('');
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

  async function bringToLife() {
    if (!canBringToLife || isGenerating) {
      return;
    }

    if (!aiEnabled) {
      const localCreature = createCreatureFromPoints(points);
      setCreature(localCreature);
      setCreatureName(localCreature.name);
      setGenerationSource('procedural');
      setGenerationNote('AI images are off, so this friend was created locally.');
      return;
    }

    setIsGenerating(true);

    const result = await createCreatureWithAi(points);
    setCreature(result.creature);
    setCreatureName(result.creature.name);
    setGenerationSource(result.source);
    setGenerationNote(result.note ?? '');
    setIsGenerating(false);
  }

  function clearCanvas() {
    setPoints([]);
    setCreature(null);
    setCreatureName('');
    setGenerationSource(null);
    setGenerationNote('');
    setIsDrawing(false);
    setIsGenerating(false);
  }

  function saveCreature() {
    if (!creature || !creatureName.trim()) {
      return;
    }

    const savedCreature: SavedCreature = {
      ...creature,
      id: `${creature.id}-saved-${Date.now().toString(36)}`,
      name: creatureName.trim(),
      generationSource: generationSource ?? 'procedural',
      savedAt: new Date().toISOString(),
    };

    setSavedCreatures((currentCreatures) => [savedCreature, ...currentCreatures].slice(0, 12));
  }

  function loadSavedCreature(savedCreature: SavedCreature) {
    setCreature(savedCreature);
    setCreatureName(savedCreature.name);
    setPoints(savedCreature.shape.points);
    setGenerationSource(savedCreature.generationSource ?? null);
    setGenerationNote('');
    setIsDrawing(false);
    setIsGenerating(false);
  }

  function deleteCreature(id: string) {
    setSavedCreatures((currentCreatures) => currentCreatures.filter((savedCreature) => savedCreature.id !== id));
  }

  async function signOut() {
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.reload();
  }

  return (
    <AuthGate>
      <main className="app-shell" aria-label="Cloud Sculptor app">
        <div className="sky-decoration cloud-one" />
        <div className="sky-decoration cloud-two" />
        <TopBar
          canBringToLife={canBringToLife}
          isGenerating={isGenerating}
          onBringToLife={bringToLife}
          onClear={clearCanvas}
          onSignOut={signOut}
        />
        <section className="workspace">
          <div className="sky-stage" ref={stageRef}>
            <SkyParade creatures={savedCreatures} onSelect={loadSavedCreature} />
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
            <BrushControls
              brushSize={brushSize}
              aiEnabled={aiEnabled}
              onBrushSizeChange={setBrushSize}
              onAiEnabledChange={setAiEnabled}
            />
            <CreatureCard
              creature={creature}
              generationSource={generationSource}
              name={creatureName}
              onNameChange={setCreatureName}
              onSave={saveCreature}
              canSave={canSave}
            />
            <Gallery creatures={savedCreatures} onSelect={loadSavedCreature} onDelete={deleteCreature} />
          </aside>
        </section>
      </main>
    </AuthGate>
  );
}
