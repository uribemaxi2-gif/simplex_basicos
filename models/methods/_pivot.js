// ============================================================
// models/methods/_pivot.js
// Utilidad compartida: operación de pivote elemental.
// Todos los métodos la importan — ninguno la reimplementa.
// ============================================================

/**
 * Pivota el tableau sobre (pivotRow, pivotCol).
 * Modifica rows y objRow en lugar (in-place).
 */
export function pivot(rows, objRow, pivotRow, pivotCol) {
  const m    = rows.length;
  const cols = rows[0].length;
  const pv   = rows[pivotRow][pivotCol];

  // Normalizar fila pivote
  for (let j = 0; j < cols; j++) rows[pivotRow][j] /= pv;

  // Eliminar columna pivote en demás filas
  for (let i = 0; i < m; i++) {
    if (i === pivotRow) continue;
    const f = rows[i][pivotCol];
    if (Math.abs(f) < 1e-12) continue;
    for (let j = 0; j < cols; j++) rows[i][j] -= f * rows[pivotRow][j];
  }

  // Eliminar columna pivote en fila objetivo
  const fo = objRow[pivotCol];
  if (Math.abs(fo) >= 1e-12)
    for (let j = 0; j < cols; j++) objRow[j] -= fo * rows[pivotRow][j];
}

/**
 * Test de optimalidad: ¿hay algún coeficiente negativo
 * en la fila objetivo (excluyendo RHS)?
 */
export function isOptimal(objRow) {
  return !objRow.slice(0, -1).some(v => v < -1e-8);
}

/**
 * Columna pivote: índice del más negativo en la fila objetivo.
 * Regresa -1 si no hay candidato (solución óptima).
 */
export function enteringColumn(objRow) {
  let col = -1, best = -1e-8;
  for (let j = 0; j < objRow.length - 1; j++) {
    if (objRow[j] < best) { best = objRow[j]; col = j; }
  }
  return col;
}

/**
 * Fila pivote: regla del cociente mínimo (non-negative).
 * Regresa -1 si no hay candidato → problema no acotado.
 */
export function leavingRow(rows, pivotCol) {
  const cols = rows[0].length;
  let row = -1, minRatio = Infinity;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][pivotCol] <= 1e-8) continue;
    const ratio = rows[i][cols - 1] / rows[i][pivotCol];
    if (ratio < minRatio) { minRatio = ratio; row = i; }
  }
  return row;
}
