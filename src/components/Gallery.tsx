import { CloudCreature } from './CloudCreature';
import type { SavedCreature } from '../game/types';

interface GalleryProps {
  creatures: SavedCreature[];
  onSelect: (creature: SavedCreature) => void;
  onDelete: (id: string) => void;
}

export function Gallery({ creatures, onSelect, onDelete }: GalleryProps) {
  return (
    <section className="panel-section gallery-section">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Saved gallery</p>
          <h2>Favorite cloud friends</h2>
        </div>
        <span className="gallery-count">{creatures.length}</span>
      </div>
      {creatures.length === 0 ? (
        <p className="gallery-empty">Saved creatures will drift in here.</p>
      ) : (
        <div className="gallery-list">
          {creatures.map((creature) => (
            <article className="saved-creature" key={creature.id}>
              <CloudCreature creature={creature} compact />
              <div>
                <h3>{creature.name}</h3>
                <p>{creature.mood} · {creature.size}</p>
              </div>
              <div className="saved-actions">
                <button type="button" className="mini-button" onClick={() => onSelect(creature)}>
                  Load
                </button>
                <button type="button" className="icon-button" onClick={() => onDelete(creature.id)} aria-label={`Delete ${creature.name}`}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
