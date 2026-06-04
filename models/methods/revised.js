// models/methods/revised.js — Simplex Revisado
// inputMode: 'matrix' → la View pide A, b, c como grillas numéricas
import { pivot } from './_pivot.js';

export const meta = {
  id:        'revised',
  label:     'Revisado',
  icon:      'R',
  badge:     'Revised Simplex',
  desc:      'Mantiene B⁻¹ explícita. Ingresa A, b y c como matrices numéricas. Reporta ‖B⁻¹‖ por iteración.',
  inputMode: 'matrix',
  hint:      'Ingresa la matriz A de coeficientes, el vector b (RHS) y el vector c (costos). La base inicial se forma con las columnas de identidad.',
};

export function solve(tableau, model) {
  const { rows, objRow, allVars, basis, artificialIndices, cols } = tableau;
  const m = rows.length;

  let Binv = Array.from({ length: m }, (_, i) =>
    Array.from({ length: m }, (_, j) => i === j ? 1 : 0)
  );

  model.snapshot('Tableau Inicial (Revisado, B⁻¹=I)', tableau);

  for (let iter = 1; iter <= 100; iter++) {
    let col = -1, best = -1e-8;
    for (let j = 0; j < cols-1; j++)
      if (objRow[j] < best) { best = objRow[j]; col = j; }
    if (col === -1) break;

    const acol = rows.map(r => r[col]);
    let pr = -1, minR = Infinity;
    for (let i = 0; i < m; i++) {
      if (acol[i] <= 1e-10) continue;
      const r = rows[i][cols-1] / acol[i];
      if (r < minR) { minR = r; pr = i; }
    }
    if (pr === -1) return model.setStatus('unbounded');

    // Actualizar B⁻¹ con eta-vector
    const etaV = Binv[pr].map(v => v / acol[pr]);
    for (let i = 0; i < m; i++) {
      if (i === pr) continue;
      const f = acol[i];
      for (let j = 0; j < m; j++) Binv[i][j] -= f * etaV[j];
    }
    Binv[pr] = etaV;

    const [en, le] = [allVars[col], allVars[basis[pr]]];
    basis[pr] = col;
    pivot(rows, objRow, pr, col);

    const norm = Math.sqrt(Binv.flat().reduce((s, v) => s + v*v, 0)).toFixed(3);
    model.snapshot(`Iter ${iter} — Entra: ${en}, Sale: ${le} | ‖B⁻¹‖=${norm}`, tableau);
  }

  for (let i = 0; i < m; i++)
    if (artificialIndices.includes(basis[i]) && Math.abs(rows[i][cols-1]) > 1e-6)
      return model.setStatus('infeasible');

  return model.extractSolution(tableau);
}
