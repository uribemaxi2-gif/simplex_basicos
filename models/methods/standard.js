// models/methods/standard.js — Simplex Estándar
import { pivot, enteringColumn, leavingRow } from './_pivot.js';

export const meta = {
  id:        'standard',
  label:     'Estándar',
  icon:      'S',
  badge:     'Standard Simplex',
  desc:      'Forma canónica con variables de holgura. Solo restricciones ≤ y maximización. Base inicial factible directa.',
  inputMode: 'formula',
  hint:      null,
};

export function solve(tableau, model) {
  const { rows, objRow, allVars, basis } = tableau;
  model.snapshot('Tableau Inicial', tableau);
  for (let iter = 1; iter <= 100; iter++) {
    const col = enteringColumn(objRow); if (col === -1) break;
    const row = leavingRow(rows, col);  if (row === -1) return model.setStatus('unbounded');
    const [en, le] = [allVars[col], allVars[basis[row]]];
    basis[row] = col;
    pivot(rows, objRow, row, col);
    model.snapshot(`Iter ${iter} — Entra: ${en}, Sale: ${le}`, tableau);
  }
  return model.extractSolution(tableau);
}
