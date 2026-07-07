import type { CSSProperties } from 'react';
import { CloudCreature } from './CloudCreature';
import type { SavedCreature } from '../game/types';

interface SkyParadeProps {
  creatures: SavedCreature[];
  onSelect: (creature: SavedCreature) => void;
}

export function SkyParade({ creatures, onSelect }: SkyParadeProps) {
  const paradeCreatures = creatures.slice(0, 6);

  if (paradeCreatures.length === 0) {
    return null;
  }

  return (
    <div className="sky-parade" aria-label="Saved cloud friend parade">
      {paradeCreatures.map((creature, index) => {
        const style = {
          top: `${12 + ((index * 17) % 58)}%`,
          animationDelay: `${index * -5.5}s`,
          animationDuration: `${34 + index * 5}s`,
        } satisfies CSSProperties;

        return (
          <button
            type="button"
            className="parade-friend"
            style={style}
            key={creature.id}
            onClick={() => onSelect(creature)}
            aria-label={`Load ${creature.name} from the sky parade`}
          >
            <CloudCreature creature={creature} compact />
          </button>
        );
      })}
    </div>
  );
}
