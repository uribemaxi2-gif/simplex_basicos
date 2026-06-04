// models/methods/primal.js — Primal Simplex con regla de Bland
import { pivot } from './_pivot.js';

export const meta = {
  id:        'primal',
  label:     'Primal',
  icon:      'P',
  badge:     'Primal Simplex',
  desc:      'Simplex primal con regla de Bland anti-ciclado. Documenta el ratio test en cada iteración.',
  inputMode: 'formula',
  hint:      'Usa la regla de Bland para evitar ciclado: en empate de ratio, entra la variable de menor índice.',
};

export function solve(tableau, model) {
  const { rows, objRow, allVars, basis, artificialIndices, cols } = tableau;
  for (let i = 0; i < rows.length; i++)
    if (rows[i][cols-1] < -1e-8) return model.setStatus('infeasible');
  model.snapshot('Tableau Inicial (Primal)', tableau);
  for (let iter = 1; iter <= 100; iter++) {
    let col = -1;
    for (let j = 0; j < cols-1; j++) { if (objRow[j] < -1e-8) { col = j; break; } }
    if (col === -1) break;
    let pr = -1, minR = Infinity;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][col] <= 1e-10) continue;
      const r = rows[i][cols-1] / rows[i][col];
      if (r < minR - 1e-10 || (Math.abs(r - minR) < 1e-10 && (pr === -1 || basis[i] < basis[pr])))
        { minR = r; pr = i; }
    }
    if (pr === -1) return model.setStatus('unbounded');
    const [en, le] = [allVars[col], allVars[basis[pr]]];
    basis[pr] = col;
    pivot(rows, objRow, pr, col);
    model.snapshot(`Iter ${iter} — Entra: ${en}, Sale: ${le} (ratio=${minR.toFixed(4)})`, tableau);
  }
  for (let i = 0; i < rows.length; i++)
    if (artificialIndices.includes(basis[i]) && Math.abs(rows[i][cols-1]) > 1e-6)
      return model.setStatus('infeasible');
  return model.extractSolution(tableau);
}
