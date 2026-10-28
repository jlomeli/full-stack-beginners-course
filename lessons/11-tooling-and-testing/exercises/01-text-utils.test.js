// Write your tests for 01-text-utils.js here.
//
// Read the comment above each function in 01-text-utils.js. It is the spec.
// Write at least one test for each function, and more where the spec has an edge case.
// Import only from 'vitest' and './01-text-utils.js'.
//
// 01-text-utils.mutants.test.js runs this file against copies of the module with one bug each.
// Every bug must make at least one of your tests fail.
import { describe, expect, test } from 'vitest';
import { chunk, formatPrice, pluralize, slugify, truncate } from './01-text-utils.js';

// TODO
