// models/methods/twoPhase.js — Dos Fases
import { pivot, enteringColumn, leavingRow } from './_pivot.js';

export const meta = {
  id:        'twophase',
  label:     'Dos Fases',
  icon:      'Ⅱ',
  badge:     'Two-Phase Method',
  desc:      'Fase 1 minimiza artificiales para hallar BFS; Fase 2 optimiza el objetivo real.',
  inputMode: 'formula',
  hint:      'Fase 1: minimiza Σaᵢ para encontrar solución básica factible. Fase 2: optimiza Z original. Ambas fases se muestran en los tableaux.',
};

export function solve(tableau, model) {
  const { rows, objRow, allVars, basis, artificialIndices, cols } = tableau;

  if (!artificialIndices.length) return _phase2(tableau, model, objRow);

  // ── Fase 1: minimizar suma de artificiales ─────────────────
  const ph1 = new Array(cols).fill(0);
  artificialIndices.forEach(idx => { ph1[idx] = 1; });

  // Eliminar artificiales básicas de la fila Ph1
  for (let i = 0; i < rows.length; i++) {
    if (artificialIndices.includes(basis[i])) {
      const f = ph1[basis[i]];
      if (Math.abs(f) > 1e-12)
        for (let j = 0; j < cols; j++) ph1[j] -= f * rows[i][j];
    }
  }

  // Negamos para maximizar internamente
  const ph1max = ph1.map(v => -v);
  model.snapshot('[Fase 1] Tableau Inicial', { ...tableau, objRow: ph1max });

  for (let iter = 1; iter <= 100; iter++) {
    const col = enteringColumn(ph1max); if (col === -1) break;
    const row = leavingRow(rows, col);  if (row === -1) break;
    const [en, le] = [allVars[col], allVars[basis[row]]];
    basis[row] = col;
    pivot(rows, ph1max, row, col);
    model.snapshot(`[Fase 1] Iter ${iter} — Entra: ${en}, Sale: ${le}`,
      { ...tableau, objRow: ph1max });
  }

  if (Math.abs(-ph1max[cols-1]) > 1e-6) return model.setStatus('infeasible');
  if (model.tableauHistory.length)
    model.tableauHistory[model.tableauHistory.length-1].label += ' ✓ Fase 1 OK';

  return _phase2(tableau, model, objRow);
}

function _phase2(tableau, model, origObj) {
  const { rows, allVars, basis, artificialIndices, cols } = tableau;
  const ph2 = [...origObj];

  // Re-eliminar artificiales básicas del objetivo original
  for (let i = 0; i < rows.length; i++) {
    if (artificialIndices.includes(basis[i])) {
      const f = ph2[basis[i]];
      if (Math.abs(f) > 1e-12)
        for (let j = 0; j < cols; j++) ph2[j] -= f * rows[i][j];
    }
  }

  model.snapshot('[Fase 2] Tableau Inicial', { ...tableau, objRow: ph2 });

  for (let iter = 1; iter <= 100; iter++) {
    let col = -1, best = -1e-8;
    for (let j = 0; j < cols-1; j++) {
      if (artificialIndices.includes(j)) continue;
      if (ph2[j] < best) { best = ph2[j]; col = j; }
    }
    if (col === -1) break;
    const row = leavingRow(rows, col); if (row === -1) return model.setStatus('unbounded');
    const [en, le] = [allVars[col], allVars[basis[row]]];
    basis[row] = col;
    pivot(rows, ph2, row, col);
    model.snapshot(`[Fase 2] Iter ${iter} — Entra: ${en}, Sale: ${le}`,
      { ...tableau, objRow: ph2 });
  }

  tableau.objRow = ph2;
  return model.extractSolution(tableau);
}
