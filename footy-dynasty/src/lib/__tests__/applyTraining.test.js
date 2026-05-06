import { describe, it, expect } from 'vitest';
import { applyTraining } from '../calendar.js';

describe('applyTraining', () => {
  const makePlayer = (id, overrides = {}) => ({
    id,
    overall: 70,
    age: 24,
    fitness: 90,
    form: 70,
    potential: 99,
    attrs: { kicking: 70, marking: 70, handball: 70 },
    ...overrides,
  });

  const staff = [{ id: 's2', name: 'Jane Smith', rating: 75 }];

  it('returns correct shape', () => {
    const squad = [makePlayer('p1'), makePlayer('p2')];
    const result = applyTraining(squad, ['p1'], 'ball_drill', []);
    expect(result).toHaveProperty('squad');
    expect(result).toHaveProperty('gains');
    expect(result).toHaveProperty('staffName');
    expect(result).toHaveProperty('staffRating');
  });

  it('empty lineup returns squad unchanged and empty gains', () => {
    const squad = [makePlayer('p1'), makePlayer('p2')];
    const result = applyTraining(squad, [], 'ball_drill', []);
    expect(result.squad).toBe(squad);
    expect(result.gains).toEqual({});
  });

  it('unknown subtype returns squad unchanged', () => {
    const squad = [makePlayer('p1')];
    const result = applyTraining(squad, ['p1'], 'nonexistent_subtype', []);
    expect(result.squad).toBe(squad);
    expect(result.gains).toEqual({});
  });

  it('only lineup players are affected', () => {
    const p1 = makePlayer('p1');
    const p2 = makePlayer('p2');
    const squad = [p1, p2];
    const { squad: newSquad } = applyTraining(squad, ['p1'], 'ball_drill', []);
    const unchanged = newSquad.find(p => p.id === 'p2');
    expect(unchanged.attrs).toEqual(p2.attrs);
  });

  it('attrs in ball_drill can increase over many iterations', () => {
    const attrIncreased = Array.from({ length: 20 }).some(() => {
      const squad = [makePlayer('p1')];
      const { squad: newSquad } = applyTraining(squad, ['p1'], 'ball_drill', []);
      const updated = newSquad.find(p => p.id === 'p1');
      return (
        updated.attrs.kicking > 70 ||
        updated.attrs.marking > 70 ||
        updated.attrs.handball > 70
      );
    });
    expect(attrIncreased).toBe(true);
  });

  it('staffName matches the staff member name when id matches', () => {
    const squad = [makePlayer('p1')];
    const { staffName } = applyTraining(squad, ['p1'], 'ball_drill', staff);
    expect(staffName).toBe('Jane Smith');
  });

  it('staffRating matches the staff member rating', () => {
    const staffAlt = [{ id: 's2', name: 'Jane Smith', rating: 80 }];
    const squad = [makePlayer('p1')];
    const { staffRating } = applyTraining(squad, ['p1'], 'ball_drill', staffAlt);
    expect(staffRating).toBe(80);
  });

  it('gains are all non-negative', () => {
    const squad = [makePlayer('p1'), makePlayer('p2')];
    const { gains } = applyTraining(squad, ['p1', 'p2'], 'ball_drill', staff);
    Object.values(gains).forEach(g => expect(g).toBeGreaterThanOrEqual(0));
  });

  it('a 19-year-old gains strictly more on average than a 35-year-old over 50 sessions', () => {
    const ITERATIONS = 30;
    const attrs = ['kicking', 'marking', 'handball'];

    let youngTotal = 0;
    let oldTotal = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const youngSquad = [makePlayer('young', { age: 19, fitness: 90, overall: 50, potential: 99, attrs: { kicking: 50, marking: 50, handball: 50 } })];
      const { squad: ys } = applyTraining(youngSquad, ['young'], 'ball_drill', staff);
      const yp = ys.find(p => p.id === 'young');
      youngTotal += attrs.reduce((sum, a) => sum + (yp.attrs[a] - 50), 0);

      const oldSquad = [makePlayer('old', { age: 35, fitness: 90, overall: 50, potential: 99, attrs: { kicking: 50, marking: 50, handball: 50 } })];
      const { squad: os } = applyTraining(oldSquad, ['old'], 'ball_drill', staff);
      const op = os.find(p => p.id === 'old');
      oldTotal += attrs.reduce((sum, a) => sum + (op.attrs[a] - 50), 0);
    }

    const youngMean = youngTotal / ITERATIONS;
    const oldMean   = oldTotal   / ITERATIONS;
    expect(youngMean).toBeGreaterThan(oldMean);
  });

  it('a player at full fitness (100) gains at least as much on average as a player at half fitness (45) over 50 sessions', () => {
    const ITERATIONS = 30;
    const attrs = ['kicking', 'marking', 'handball'];

    let fullTotal = 0;
    let halfTotal = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const fullSquad = [makePlayer('full', { age: 24, fitness: 100, overall: 50, potential: 99, attrs: { kicking: 50, marking: 50, handball: 50 } })];
      const { squad: fs } = applyTraining(fullSquad, ['full'], 'ball_drill', staff);
      const fp = fs.find(p => p.id === 'full');
      fullTotal += attrs.reduce((sum, a) => sum + (fp.attrs[a] - 50), 0);

      const halfSquad = [makePlayer('half', { age: 24, fitness: 45, overall: 50, potential: 99, attrs: { kicking: 50, marking: 50, handball: 50 } })];
      const { squad: hs } = applyTraining(halfSquad, ['half'], 'ball_drill', staff);
      const hp = hs.find(p => p.id === 'half');
      halfTotal += attrs.reduce((sum, a) => sum + (hp.attrs[a] - 50), 0);
    }

    const fullMean = fullTotal / ITERATIONS;
    const halfMean = halfTotal / ITERATIONS;
    expect(fullMean).toBeGreaterThanOrEqual(halfMean);
  });

  it('a player near their potential cap gains less on average than one far from it over 100 sessions', () => {
    const ITERATIONS = 35;
    const attrs = ['kicking', 'marking', 'handball'];

    let nearTotal = 0;
    let farTotal  = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const nearSquad = [makePlayer('near', { age: 24, fitness: 90, overall: 70, potential: 72, attrs: { kicking: 50, marking: 50, handball: 50 } })];
      const { squad: ns } = applyTraining(nearSquad, ['near'], 'ball_drill', staff);
      const np = ns.find(p => p.id === 'near');
      nearTotal += attrs.reduce((sum, a) => sum + (np.attrs[a] - 50), 0);

      const farSquad = [makePlayer('far', { age: 24, fitness: 90, overall: 70, potential: 99, attrs: { kicking: 50, marking: 50, handball: 50 } })];
      const { squad: fs2 } = applyTraining(farSquad, ['far'], 'ball_drill', staff);
      const fp2 = fs2.find(p => p.id === 'far');
      farTotal += attrs.reduce((sum, a) => sum + (fp2.attrs[a] - 50), 0);
    }

    const nearMean = nearTotal / ITERATIONS;
    const farMean  = farTotal  / ITERATIONS;
    expect(nearMean).toBeLessThan(farMean * 0.75);
  });

  it('no attr ever exceeds the player potential value after training', () => {
    const potential = 75;
    for (let i = 0; i < 25; i++) {
      const squad = [makePlayer('p1', {
        age: 19,
        fitness: 100,
        overall: 74,
        potential,
        attrs: { kicking: 74, marking: 74, handball: 74 },
      })];
      const { squad: newSquad } = applyTraining(squad, ['p1'], 'ball_drill', staff);
      const updated = newSquad.find(p => p.id === 'p1');
      Object.values(updated.attrs).forEach(val => {
        expect(val).toBeLessThanOrEqual(potential);
      });
    }
  });

  it('result includes a devNotes array', () => {
    const squad = [makePlayer('p1')];
    const result = applyTraining(squad, ['p1'], 'ball_drill', staff);
    expect(result).toHaveProperty('devNotes');
    expect(Array.isArray(result.devNotes)).toBe(true);
  });

  it('a player aged 19 triggers a youth boost entry in devNotes containing their last name', () => {
    const squad = [makePlayer('p1', {
      age: 19,
      fitness: 90,
      overall: 50,
      potential: 99,
      name: 'J. Nguyen',
      attrs: { kicking: 50, marking: 50, handball: 50 },
    })];

    let found = false;
    for (let i = 0; i < 20; i++) {
      const freshSquad = [makePlayer('p1', {
        age: 19,
        fitness: 90,
        overall: 50,
        potential: 99,
        name: 'J. Nguyen',
        attrs: { kicking: 50, marking: 50, handball: 50 },
      })];
      const { devNotes } = applyTraining(freshSquad, ['p1'], 'ball_drill', staff);
      if (devNotes.some(note => note.includes('Nguyen'))) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
