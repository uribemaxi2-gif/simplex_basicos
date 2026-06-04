// models/methods/dual.js — Dual Simplex
import { pivot } from './_pivot.js';

export const meta = {
  id:        'dual',
  label:     'Dual',
  icon:      'D',
  badge:     'Dual Simplex',
  desc:      'Parte de dual-factible / primal-infactible. Útil para análisis de sensibilidad y restricciones ≥.',
  inputMode: 'formula',
  hint:      'Este método requiere que el problema sea dual-factible (coef. objetivo ≥ 0 en forma estándar). Ideal para restricciones ≥.',
};

export function solve(tableau, model) {
  const { rows, objRow, allVars, basis, cols } = tableau;
  for (let i = 0; i < rows.length; i++)
    if (rows[i][cols-1] < -1e-10)
      for (let j = 0; j < cols; j++) rows[i][j] = -rows[i][j];
  model.snapshot('Tableau Inicial (Dual)', tableau);
  for (let iter = 1; iter <= 100; iter++) {
    let pr = -1, mostNeg = -1e-8;
    for (let i = 0; i < rows.length; i++)
      if (rows[i][cols-1] < mostNeg) { mostNeg = rows[i][cols-1]; pr = i; }
    if (pr === -1) break;
    let pc = -1, minR = Infinity;
    for (let j = 0; j < cols-1; j++) {
      if (rows[pr][j] >= -1e-10) continue;
      const r = Math.abs(objRow[j] / rows[pr][j]);
      if (r < minR) { minR = r; pc = j; }
    }
    if (pc === -1) return model.setStatus('infeasible');
    const [en, le] = [allVars[pc], allVars[basis[pr]]];
    basis[pr] = pc;
    pivot(rows, objRow, pr, pc);
    model.snapshot(`Iter ${iter} — Entra: ${en}, Sale: ${le}`, tableau);
  }
  return model.extractSolution(tableau);
}
