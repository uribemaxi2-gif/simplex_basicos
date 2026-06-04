// models/methods/bigM.js — Gran-M
import { pivot, enteringColumn, leavingRow } from './_pivot.js';

export const meta = {
  id:        'bigm',
  label:     'Gran-M',
  icon:      'M',
  badge:     'Big-M Method',
  desc:      'Penaliza variables artificiales con M → ∞. Una fase. Maneja ≤, ≥ y =.',
  inputMode: 'formula',
  hint:      'Puedes usar ≤, ≥ o =. Las variables artificiales se penalizan automáticamente con M=10000.',
};

export function solve(tableau, model) {
  const { rows, objRow, allVars, basis, artificialIndices, cols } = tableau;
  model.snapshot('Tableau Inicial (Big-M)', tableau);
  for (let iter = 1; iter <= 100; iter++) {
    const col = enteringColumn(objRow); if (col === -1) break;
    const row = leavingRow(rows, col);  if (row === -1) return model.setStatus('unbounded');
    const [en, le] = [allVars[col], allVars[basis[row]]];
    basis[row] = col;
    pivot(rows, objRow, row, col);
    model.snapshot(`Iter ${iter} — Entra: ${en}, Sale: ${le}`, tableau);
  }
  for (let i = 0; i < rows.length; i++)
    if (artificialIndices.includes(basis[i]) && Math.abs(rows[i][cols-1]) > 1e-6)
      return model.setStatus('infeasible');
  return model.extractSolution(tableau);
}
