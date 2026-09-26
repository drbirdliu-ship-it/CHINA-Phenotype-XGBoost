import { MODEL, METRICS } from './model.mjs?v=2026-09-26-age-corrected';

export const FEATURES = MODEL.features;
export const LABELS = MODEL.classes;
export { METRICS };
const f32 = Math.fround;
const trees = MODEL.trees.map(tree => ({ ...tree, v: new Float32Array(tree.v) }));

export function validateInputs(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Enter all 9 predictors.');
  }
  const values = FEATURES.map(name => {
    const value = input[name];
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isFinite(f32(value))) {
      throw new Error(`Enter a valid number for ${name}.`);
    }
    if (value < 0) throw new Error(`${name} cannot be negative.`);
    if (name === 'Age' && value < 18) throw new Error('This model is for adults aged 18 years and older.');
    if (name === 'SEX' && value !== 0 && value !== 1) throw new Error('Select Male (0) or Female (1) for sex.');
    return f32(value);
  });
  return values;
}

export function predict(input) {
  const values = validateInputs(input);
  const margins = MODEL.base.map(f32);
  for (const tree of trees) {
    let node = 0;
    while (tree.l[node] !== -1) {
      node = values[tree.f[node]] < tree.v[node] ? tree.l[node] : tree.r[node];
    }
    margins[tree.c] = f32(margins[tree.c] + tree.v[node]);
  }
  const max = Math.max(...margins);
  const exponentials = margins.map(value => f32(Math.exp(f32(value - max))));
  const sum = exponentials.reduce((a, b) => a + b, 0);
  const probabilities = exponentials.map(value => f32(value / sum));
  const winner = probabilities.indexOf(Math.max(...probabilities));
  return {
    predicted_code: winner + 1,
    predicted_symbol: LABELS[winner],
    probabilities,
    margins,
    outside_observed_range: FEATURES.filter(name => input[name] < METRICS.ranges[name].min || input[name] > METRICS.ranges[name].max),
  };
}
