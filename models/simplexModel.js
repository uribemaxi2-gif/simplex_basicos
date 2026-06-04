// ============================================================
// models/simplexModel.js
// ============================================================

export class SimplexModel {
  constructor() { this.reset(); }

  reset() {
    this.objective      = null;
    this.constraints    = [];
    this.variables      = [];
    this.tableauHistory = [];
    this.solution       = null;
  }

  parseObjective(expr, type) {
    this.objective = { coeffs: this._parseExpr(expr), type };
  }

  parseConstraint(expr, sign, rhs) {
    this.constraints.push({
      coeffs: this._parseExpr(expr),
      sign,
      rhs: parseFloat(rhs),
    });
  }

  _parseExpr(raw) {
    const norm   = raw.replace(/\s+/g, '').replace(/\*/g, '');
    const tokens = norm.match(/[+-]?[^+-]+/g) || [];
    const map    = {};
    for (const tok of tokens) {
      const m = tok.match(/^([+-]?\d*\.?\d*)([a-zA-Z]\w*)$/);
      if (!m) continue;
      let [, coeff, name] = m;
      if (coeff === '' || coeff === '+') coeff = 1;
      else if (coeff === '-')            coeff = -1;
      else                               coeff = parseFloat(coeff);
      if (!this.variables.includes(name)) this.variables.push(name);
      map[name] = (map[name] || 0) + coeff;
    }
    return map;
  }

  _coeff(map, v) { return map[v] || 0; }

  buildTableau() {
    const n = this.variables.length;
    const m = this.constraints.length;
    const BIG_M = 1e4;

    const extras = this.constraints.map((c, i) => {
      if (c.sign === '<=') return { slack: `s${i+1}`, surplus: false, art: null };
      if (c.sign === '>=') return { slack: `s${i+1}`, surplus: true,  art: `a${i+1}` };
      return { slack: null, surplus: false, art: `a${i+1}` };
    });

    const slackVars = extras.filter(e => e.slack).map(e => e.slack);
    const artVars   = extras.filter(e => e.art ).map(e => e.art);
    const allVars   = [...this.variables, ...slackVars, ...artVars];
    const cols      = allVars.length + 1;

    const artificialIndices = artVars.map(v => allVars.indexOf(v));
    const slackIndices      = slackVars.map(v => allVars.indexOf(v));

    const rows = this.constraints.map((c, i) => {
      const row = new Array(cols).fill(0);
      for (let j = 0; j < n; j++)
        row[j] = this._coeff(c.coeffs, this.variables[j]);
      const ex = extras[i];
      if (ex.slack) row[allVars.indexOf(ex.slack)] = ex.surplus ? -1 : 1;
      if (ex.art)   row[allVars.indexOf(ex.art)]   = 1;
      row[cols - 1] = c.rhs;
      return row;
    });

    const sign   = this.objective.type === 'min' ? -1 : 1;
    const objRow = new Array(cols).fill(0);
    for (let j = 0; j < n; j++)
      objRow[j] = -sign * this._coeff(this.objective.coeffs, this.variables[j]);
    artificialIndices.forEach(idx => { objRow[idx] = BIG_M; });

    const basis = extras.map(ex =>
      ex.art ? allVars.indexOf(ex.art) : allVars.indexOf(ex.slack)
    );

    // Inicialización Big-M: eliminar artificiales de la fila obj
    for (let i = 0; i < m; i++) {
      const bv = basis[i];
      if (artificialIndices.includes(bv) && Math.abs(objRow[bv]) > 1e-12) {
        const f = objRow[bv];
        for (let j = 0; j < cols; j++) objRow[j] -= f * rows[i][j];
      }
    }

    return { rows, objRow, allVars, basis, BIG_M, artificialIndices, slackIndices, cols };
  }

  // Deep-copy del estado actual del tableau para el historial
  snapshot(label, tableau) {
    const { rows, objRow, allVars, basis } = tableau;
    this.tableauHistory.push({
      label,
      headers: ['Base', ...allVars, 'RHS'],
      basis:   [...basis],
      // IMPORTANTE: copia profunda de cada fila
      rows:    rows.map(r => Float64Array.from(r)),
      objRow:  Float64Array.from(objRow),
      allVars: [...allVars],
    });
  }

  extractSolution(tableau) {
    const { rows, objRow, allVars, basis, cols } = tableau;
    const values = {};
    this.variables.forEach(v => values[v] = 0);
    for (let i = 0; i < rows.length; i++) {
      const bv = allVars[basis[i]];
      if (this.variables.includes(bv))
        values[bv] = rows[i][cols - 1];
    }
    this.solution = {
      status: 'optimal',
      values,
      objectiveValue: objRow[cols - 1],
      type: this.objective.type,
    };
    return this.solution;
  }

  setStatus(status) {
    this.solution = { status };
    return this.solution;
  }
}
