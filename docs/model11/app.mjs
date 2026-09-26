import { predict, validateInputs, FEATURES, LABELS, METRICS } from './engine.mjs?v=2026-09-26-age-corrected';

if (METRICS.version !== document.documentElement.dataset.modelVersion) throw new Error('Model version mismatch. Reload this page.');

const form = document.getElementById('predictor-form');
const byId = id => document.getElementById(id);
const names = ['Alpha', 'Beta', 'Gamma', 'Delta'];
const cards = [...document.querySelectorAll('.phenotype-card')];
let hasResult = false;

function clearResult(message = 'Complete the inputs and select Calculate.') {
  hasResult = false;
  byId('result-summary').classList.remove('complete');
  byId('result-symbol').textContent = '—';
  byId('summary-label').textContent = 'Ready when you are';
  byId('summary-detail').textContent = message;
  byId('result-status').textContent = 'Awaiting calculation';
  byId('range-note').hidden = true;
  byId('error').hidden = true;
  cards.forEach(card => {
    card.classList.remove('winner');
    card.querySelector('.probability').textContent = '—';
    card.querySelector('.bar').style.width = '0%';
    card.removeAttribute('aria-label');
  });
}

function showResult(result) {
  const winner = result.predicted_code - 1;
  const percentage = value => (value * 100).toFixed(1) + '%';
  cards.forEach((card, index) => {
    card.classList.toggle('winner', index === winner);
    card.querySelector('.probability').textContent = percentage(result.probabilities[index]);
    card.querySelector('.bar').style.width = percentage(result.probabilities[index]);
    card.setAttribute('aria-label', `${names[index]}: ${percentage(result.probabilities[index])}${index === winner ? ', selected phenotype' : ''}`);
  });
  byId('result-summary').classList.add('complete');
  byId('result-symbol').textContent = LABELS[winner];
  byId('summary-label').textContent = `${names[winner]} phenotype`;
  byId('summary-detail').textContent = `${percentage(result.probabilities[winner])} model probability · Code ${result.predicted_code}`;
  byId('result-status').textContent = 'Calculated';
  const rangeNote = byId('range-note');
  rangeNote.hidden = result.outside_observed_range.length === 0;
  rangeNote.textContent = `Outside the observed dataset range: ${result.outside_observed_range.join(', ')}. Check the values and units; predictions in this range have not been validated.`;
  hasResult = true;
}

function calculate(input) {
  const result = predict(input);
  byId('error').hidden = true;
  showResult(result);
  return result;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const input = Object.fromEntries(FEATURES.map(name => {
      const text = byId(name).value.trim();
      if (text === '') throw new Error(`Enter a value for ${name}.`);
      return [name, Number(text)];
    }));
    calculate(input);
    if (window.matchMedia('(max-width: 680px)').matches) {
      byId('result-heading').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  } catch (error) {
    clearResult();
    byId('error').textContent = error.message;
    byId('error').hidden = false;
  }
});
form.addEventListener('input', () => {
  if (hasResult) clearResult('Inputs changed. Select Calculate to update the result.');
  byId('input-status').textContent = 'Check the values and units before calculating.';
});
form.addEventListener('reset', () => {
  clearResult();
  byId('input-status').textContent = 'Enter all 11 values, or load an illustrative example.';
});
byId('example').addEventListener('click', () => {
  const example = { Glucose: 6, PaCO2: 35, Albumin: 40, Platelet: 200, Leukocyte: 8.5, Age: 50, BMI: 25, MAP: 95, LVEDD: 50, LVEF: 62, SEX: 0 };
  FEATURES.forEach(name => { byId(name).value = example[name]; });
  clearResult();
  byId('input-status').textContent = 'Illustrative example loaded. Select Calculate to try the model.';
});

byId('accuracy-value').textContent = (METRICS.test_accuracy * 100).toFixed(1);
byId('test-records').textContent = METRICS.test_size.toLocaleString('en-US');
byId('train-records').textContent = METRICS.train_size.toLocaleString('en-US');
byId('calculate').disabled = false;
byId('calculate-text').textContent = 'Calculate phenotype';
byId('example').disabled = false;

let installPrompt;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  byId('install').hidden = false;
});
byId('install').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  byId('install').hidden = true;
});
window.addEventListener('appinstalled', () => { byId('install').hidden = true; });
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(registration => registration.update()).catch(() => { /* Online inference remains available. */ });
}

const context = document.modelContext;
if (context?.registerTool) {
  const lifecycle = new AbortController();
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  try {
    Promise.resolve(context.registerTool({
      name: 'calculate_phenotype',
      title: 'Calculate phenotype',
      description: 'Fill all eleven predictors and calculate the phenotype, updating the visible calculator. No input values are sent to a server.',
      inputSchema: {
        type: 'object',
        properties: Object.fromEntries(FEATURES.map(name => [name, name === 'SEX' ? { type: 'number', enum: [0, 1], description: 'Sex: 0 = male, 1 = female.' } : { type: 'number', minimum: name === 'Age' ? 18 : 0, ...(name === 'LVEF' ? { maximum: 100 } : {}) }])),
        required: FEATURES,
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        validateInputs(input);
        FEATURES.forEach(name => { byId(name).value = input[name]; });
        const result = calculate(input);
        byId('input-status').textContent = 'All 11 predictor values were supplied for this calculation.';
        return { predicted_code: result.predicted_code, predicted_symbol: result.predicted_symbol, probabilities: result.probabilities, outside_observed_range: result.outside_observed_range };
      },
    }, { signal: lifecycle.signal })).catch(() => {});
  } catch (_) { /* Optional browser integration. */ }
}
