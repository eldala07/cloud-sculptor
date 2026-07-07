import type { Creature, GenerationSource } from '../game/types';

interface CreatureCardProps {
  creature: Creature | null;
  generationSource: GenerationSource | null;
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  canSave: boolean;
}

export function CreatureCard({ creature, generationSource, name, onNameChange, onSave, canSave }: CreatureCardProps) {
  if (!creature) {
    return (
      <section className="panel-section creature-card empty-state">
        <p className="section-kicker">Cloud friend</p>
        <h2>Waiting for a shape</h2>
        <p>Draw a soft cloud in the sky, then bring it to life when it feels fluffy enough.</p>
      </section>
    );
  }

  return (
    <section className="panel-section creature-card">
      <p className="section-kicker">Cloud friend</p>
      <label className="name-field">
        <span>Name</span>
        <input value={name} onChange={(event) => onNameChange(event.target.value)} maxLength={32} />
      </label>
      <div className="creature-facts">
        <span>{creature.mood}</span>
        <span>{creature.size}</span>
        <span>{generationSource === 'ai' ? 'AI sparked' : 'Local magic'}</span>
      </div>
      <div className="trait-list" aria-label="Creature traits">
        {creature.traits.map((trait) => (
          <span key={`${trait.type}-${trait.label}`}>{trait.label}</span>
        ))}
      </div>
      <button className="primary-action full-width" type="button" onClick={onSave} disabled={!canSave}>
        Save friend
      </button>
    </section>
  );
}
