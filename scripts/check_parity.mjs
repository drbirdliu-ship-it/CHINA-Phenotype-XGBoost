import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const reference = JSON.parse(fs.readFileSync(0, 'utf8'));
const { predict, FEATURES } = await import(pathToFileURL(reference.engine).href);
assert.deepEqual(FEATURES, reference.features);
let maxProbabilityError = 0, maxMarginError = 0, mismatches = 0;
for (let index = 0; index < reference.inputs.length; index++) {
  const input = Object.fromEntries(FEATURES.map((name, j) => [name, reference.inputs[index][j]]));
  const result = predict(input);
  for (let j = 0; j < 4; j++) {
    maxProbabilityError = Math.max(maxProbabilityError, Math.abs(result.probabilities[j] - reference.probabilities[index][j]));
    maxMarginError = Math.max(maxMarginError, Math.abs(result.margins[j] - reference.margins[index][j]));
  }
  const nativeClass = reference.probabilities[index].indexOf(Math.max(...reference.probabilities[index])) + 1;
  if (result.predicted_code !== nativeClass) mismatches++;
}
assert.equal(mismatches, 0, 'Browser/native classes differ.');
assert(maxProbabilityError < 1e-6, 'Probability error exceeds tolerance.');
assert(maxMarginError < 1e-6, 'Margin error exceeds tolerance.');
console.log(JSON.stringify({case_count:reference.inputs.length, class_mismatches:mismatches, max_absolute_probability_error:maxProbabilityError, max_absolute_margin_error:maxMarginError, probability_tolerance:1e-6}));
