// models/methods/graphic.js — Método Gráfico
export const meta = {
  id:        'graphic',
  label:     'Gráfico',
  icon:      '📈',
  badge:     'Método Gráfico',
  desc:      'Representación visual de la región factible. Solo para problemas con exactamente 2 variables de decisión.',
  inputMode: 'formula',
  hint:      'Solo funciona con 2 variables (x1 y x2). Grafica la región factible y encuentra el vértice óptimo.',
};

export function solve(tableau, model) {
  // El método gráfico no usa el tableau algebraico.
  // Guarda los datos en model.graphicData para que la vista los consuma.
  const vars = model.variables;
  if (vars.length !== 2) {
    return model.setStatus('infeasible'); // la vista muestra error específico
  }

  const obj   = model.objective;
  const cons  = model.constraints;
  const [v1, v2] = vars;

  // Calcular vértices de la región factible
  const vertices = _computeVertices(cons, vars);
  const feasible = vertices.filter(pt => _isFeasible(pt, cons, vars));

  if (feasible.length === 0) {
    model.graphicData = { vars, obj, constraints: cons, vertices: [], optimal: null, status: 'infeasible' };
    return model.setStatus('infeasible');
  }

  // Evaluar función objetivo en cada vértice
  const evaluated = feasible.map(pt => {
    const z = _evalObj(pt, obj, vars);
    return { ...pt, z };
  });

  const optimal = evaluated.reduce((best, pt) =>
    obj.type === 'max' ? (pt.z > best.z ? pt : best) : (pt.z < best.z ? pt : best)
  );

  // Guardar para renderizado gráfico
  model.graphicData = { vars, obj, constraints: cons, vertices: feasible, evaluated, optimal, status: 'optimal' };

  // También llenar solution normal para compatibilidad
  model.solution = {
    status: 'optimal',
    values: { [v1]: optimal.x, [v2]: optimal.y },
    objectiveValue: optimal.z,
    type: obj.type,
  };
  model.tableauHistory = []; // no hay tableaux
  return model.solution;
}

// ── Helpers ──────────────────────────────────────────────────

function _evalObj(pt, obj, vars) {
  const c1 = obj.coeffs[vars[0]] || 0;
  const c2 = obj.coeffs[vars[1]] || 0;
  return c1 * pt.x + c2 * pt.y;
}

function _isFeasible(pt, cons, vars) {
  const EPS = 1e-6;
  if (pt.x < -EPS || pt.y < -EPS) return false;
  return cons.every(c => {
    const lhs = (c.coeffs[vars[0]] || 0) * pt.x + (c.coeffs[vars[1]] || 0) * pt.y;
    if (c.sign === '<=') return lhs <= c.rhs + EPS;
    if (c.sign === '>=') return lhs >= c.rhs - EPS;
    return Math.abs(lhs - c.rhs) <= EPS;
  });
}

function _computeVertices(cons, vars) {
  const lines = _buildLines(cons, vars);
  // Añadir ejes: x=0, y=0
  lines.push({ a: 1, b: 0, c: 0 }); // x1 = 0
  lines.push({ a: 0, b: 1, c: 0 }); // x2 = 0

  const pts = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const pt = _intersect(lines[i], lines[j]);
      if (pt) pts.push(pt);
    }
  }
  return pts;
}

function _buildLines(cons, vars) {
  return cons.map(c => ({
    a: c.coeffs[vars[0]] || 0,
    b: c.coeffs[vars[1]] || 0,
    c: c.rhs,
  }));
}

function _intersect(l1, l2) {
  const det = l1.a * l2.b - l2.a * l1.b;
  if (Math.abs(det) < 1e-10) return null;
  const x = (l1.c * l2.b - l2.c * l1.b) / det;
  const y = (l1.a * l2.c - l2.a * l1.c) / det;
  if (!isFinite(x) || !isFinite(y)) return null;
  return { x: Math.round(x * 1e8) / 1e8, y: Math.round(y * 1e8) / 1e8 };
}