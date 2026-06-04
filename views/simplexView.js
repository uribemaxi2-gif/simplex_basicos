// ============================================================
// views/simplexView.js
// ============================================================

import { METHODS, REGISTRY } from '../models/methodRegistry.js';

export class SimplexView {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.onMethodSelected = null;
    this.onSolve          = null;
    this.onReset          = null;
    this.onAddConstraint  = null;
    // Para el modo matrix: dimensiones actuales
    this._matrixVars = 2;
    this._matrixCons = 2;
  }

  // ── Screen 1: Selector ────────────────────────────────────

  renderMethodSelector() {
    const cards = METHODS.map(m => `
      <button class="method-card" data-method="${m.id}">
        <div class="method-icon">${m.icon}</div>
        <h2>${m.label}</h2>
        <p>${m.desc}</p>
        <div class="method-badge">${m.badge}</div>
      </button>`).join('');

    this.root.innerHTML = `
      <div class="screen method-screen">
        <div class="logo-area">
          <div class="logo-icon">∑</div>
          <h1 class="logo-title">SimplexLAB</h1>
          <p class="logo-sub">v2 · 6 métodos · MVC modular</p>
        </div>
        <div class="method-cards">${cards}</div>
        <p class="method-hint">Selecciona un método para continuar →</p>
      </div>`;

    this.root.querySelectorAll('.method-card').forEach(btn =>
      btn.addEventListener('click', () => this.onMethodSelected?.(btn.dataset.method))
    );
  }

  // ── Screen 2: Input — dispatch por inputMode ──────────────

  renderInputPanel(methodId) {
    const method = REGISTRY[methodId];
    if (method.inputMode === 'matrix') {
      this._renderMatrixInput(method);
    } else {
      this._renderFormulaInput(method);
    }
  }

  // ── Input modo fórmula (formula) ──────────────────────────

  _renderFormulaInput(method) {
    const hintHTML = method.hint
      ? `<div class="method-hint-box"><span class="nonneg-icon">💡</span>${method.hint}</div>`
      : '';

    this.root.innerHTML = `
      <div class="screen input-screen">
        <header class="input-header">
          <button class="back-btn" id="backBtn">← Inicio</button>
          <div class="method-tag">${method.label}</div>
          <h2>Definir Problema</h2>
        </header>
        <div class="input-panel">
          ${hintHTML}

          <section class="form-section">
            <label class="section-label">Nombre del Problema <span class="field-optional">(opcional)</span></label>
            <input type="text" id="problemName" class="func-input"
              placeholder="Ej: Producción de mesas y sillas…" maxlength="80" spellcheck="true"/>
          </section>

          <section class="form-section">
            <label class="section-label">Función Objetivo</label>
            <div class="obj-row">
              <select class="obj-type-sel" id="objType">
                <option value="max">Maximizar</option>
                <option value="min">Minimizar</option>
              </select>
              <span class="section-hint">Z =</span>
              <input type="text" id="objInput" class="func-input"
                placeholder="3x1 + 5x2" spellcheck="false"/>
            </div>
            <p class="field-hint">Ej: <code>3x1 + 5x2</code> · <code>2x1 - x2 + 4x3</code></p>
          </section>

          <section class="form-section">
            <div class="section-header-row">
              <label class="section-label">Restricciones</label>
              <button class="add-btn" id="addConstraintBtn">+ Agregar</button>
            </div>
            <div id="constraintsList" class="constraints-list"></div>
            <p class="field-hint">Ej: <code>x1 + 2x2</code> ≤ <code>14</code></p>
          </section>

          <div class="nonneg-notice">
            <span class="nonneg-icon">ℹ</span>
            Se asumen restricciones de no negatividad: x<sub>i</sub> ≥ 0
          </div>

          <button class="solve-btn" id="solveBtn">▶ Resolver</button>
        </div>
      </div>`;

    document.getElementById('backBtn').addEventListener('click', () => this.onReset?.());
    document.getElementById('addConstraintBtn').addEventListener('click', () => this.onAddConstraint?.());

    document.getElementById('solveBtn').addEventListener('click', () => {
      const obj  = document.getElementById('objInput').value.trim();
      const type = document.getElementById('objType').value;

      const constraints = [];
      document.querySelectorAll('.constraint-row').forEach(row => {
        const expr = row.querySelector('.c-expr').value.trim();
        const sign = row.querySelector('.c-sign').value;
        // BUG FIX: leer como texto, no como number, para no perder el valor
        const rhsRaw = row.querySelector('.c-rhs').value.trim();
        // Aceptar la fila si tiene expresión y RHS (aunque RHS sea "0")
        if (expr && rhsRaw !== '') {
          constraints.push({ expr, sign, rhs: rhsRaw });
        }
      });

      const name = document.getElementById('problemName').value.trim();
      this.onSolve?.({ obj, type, constraints, name });
    });

    this.onAddConstraint?.();
    this.onAddConstraint?.();
  }

  addConstraintRow() {
    const list = document.getElementById('constraintsList');
    if (!list) return;
    const idx = list.children.length + 1;
    const row = document.createElement('div');
    row.className = 'constraint-row';
    row.innerHTML = `
      <span class="c-num">${idx}</span>
      <input type="text" class="func-input c-expr" placeholder="x1 + 2x2" spellcheck="false"/>
      <select class="c-sign">
        <option value="<=">≤</option>
        <option value=">=">≥</option>
        <option value="="> = </option>
      </select>
      <input type="text" class="c-rhs" placeholder="0" inputmode="decimal"/>
      <button class="remove-btn" title="Eliminar">✕</button>`;
    // BUG FIX: type="text" con inputmode="decimal" para que
    // el valor siempre esté disponible como string en .value
    row.querySelector('.remove-btn').addEventListener('click', () => {
      row.remove();
      document.querySelectorAll('.constraint-row .c-num')
        .forEach((el, i) => el.textContent = i + 1);
    });
    list.appendChild(row);
  }

  // ── Input modo matriz (matrix) ────────────────────────────

  _renderMatrixInput(method) {
    this.root.innerHTML = `
      <div class="screen input-screen">
        <header class="input-header">
          <button class="back-btn" id="backBtn">← Inicio</button>
          <div class="method-tag">${method.label}</div>
          <h2>Ingresar como Matriz</h2>
        </header>
        <div class="input-panel">
          <div class="method-hint-box">
            <span class="nonneg-icon">💡</span>${method.hint}
          </div>

          <!-- Dimensiones -->
          <section class="form-section">
            <label class="section-label">Dimensiones</label>
            <div class="dim-row">
              <div class="dim-group">
                <label class="dim-label">Variables (n)</label>
                <div class="dim-ctrl">
                  <button class="dim-btn" id="varMinus">−</button>
                  <span class="dim-val" id="varCount">${this._matrixVars}</span>
                  <button class="dim-btn" id="varPlus">+</button>
                </div>
              </div>
              <div class="dim-group">
                <label class="dim-label">Restricciones (m)</label>
                <div class="dim-ctrl">
                  <button class="dim-btn" id="conMinus">−</button>
                  <span class="dim-val" id="conCount">${this._matrixCons}</span>
                  <button class="dim-btn" id="conPlus">+</button>
                </div>
              </div>
              <div class="dim-group">
                <label class="dim-label">Objetivo</label>
                <select class="obj-type-sel" id="objType">
                  <option value="max">Maximizar</option>
                  <option value="min">Minimizar</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Nombre del problema -->
          <section class="form-section">
            <label class="section-label">Nombre del Problema <span class="field-optional">(opcional)</span></label>
            <input type="text" id="problemName" class="func-input"
              placeholder="Ej: Producción de mesas y sillas…" maxlength="80" spellcheck="true"/>
          </section>

          <!-- Matrices -->
          <div id="matrixInputArea"></div>

          <button class="solve-btn" id="solveBtn">▶ Resolver</button>
        </div>
      </div>`;

    document.getElementById('backBtn').addEventListener('click', () => this.onReset?.());

    const updateDim = (varDelta, conDelta) => {
      this._matrixVars = Math.max(1, this._matrixVars + varDelta);
      this._matrixCons = Math.max(1, this._matrixCons + conDelta);
      document.getElementById('varCount').textContent = this._matrixVars;
      document.getElementById('conCount').textContent = this._matrixCons;
      this._renderMatrixGrids();
    };

    document.getElementById('varPlus') .addEventListener('click', () => updateDim(1, 0));
    document.getElementById('varMinus').addEventListener('click', () => updateDim(-1, 0));
    document.getElementById('conPlus') .addEventListener('click', () => updateDim(0, 1));
    document.getElementById('conMinus').addEventListener('click', () => updateDim(0, -1));

    document.getElementById('solveBtn').addEventListener('click', () => {
      this._submitMatrixInput();
    });

    this._renderMatrixGrids();
  }

  _renderMatrixGrids() {
    const n = this._matrixVars;
    const m = this._matrixCons;
    const area = document.getElementById('matrixInputArea');
    if (!area) return;

    const varHeaders = Array.from({ length: n }, (_, i) => `<th>x${i+1}</th>`).join('');

    // Matriz A + signos + b
    const aRows = Array.from({ length: m }, (_, i) => {
      const cells = Array.from({ length: n }, (_, j) =>
        `<td><input class="mat-cell" data-mat="A" data-r="${i}" data-c="${j}"
          type="text" inputmode="decimal" value="0" placeholder="0"/></td>`
      ).join('');
      return `<tr>
        <td class="mat-row-label">R${i+1}</td>
        ${cells}
        <td class="mat-sign-cell">
          <select class="c-sign mat-sign" data-row="${i}">
            <option value="<=">≤</option>
            <option value=">=">≥</option>
            <option value="="> = </option>
          </select>
        </td>
        <td><input class="mat-cell mat-b" data-mat="b" data-r="${i}"
          type="text" inputmode="decimal" value="0" placeholder="0"/></td>
      </tr>`;
    }).join('');

    // Vector c
    const cCells = Array.from({ length: n }, (_, j) =>
      `<td><input class="mat-cell mat-c" data-mat="c" data-c="${j}"
        type="text" inputmode="decimal" value="0" placeholder="0"/></td>`
    ).join('');

    area.innerHTML = `
      <section class="form-section">
        <label class="section-label">Matriz A · Signos · Vector b (RHS)</label>
        <div class="table-scroll">
          <table class="matrix-table">
            <thead>
              <tr>
                <th></th>${varHeaders}<th>signo</th><th>b</th>
              </tr>
            </thead>
            <tbody>${aRows}</tbody>
          </table>
        </div>
      </section>

      <section class="form-section">
        <label class="section-label">Vector c (coeficientes función objetivo)</label>
        <div class="table-scroll">
          <table class="matrix-table">
            <thead><tr><th></th>${varHeaders}</tr></thead>
            <tbody><tr><td class="mat-row-label">c</td>${cCells}</tr></tbody>
          </table>
        </div>
        <p class="field-hint">Se asumen x<sub>i</sub> ≥ 0</p>
      </section>`;
  }

  _submitMatrixInput() {
    const n = this._matrixVars;
    const m = this._matrixCons;
    const type = document.getElementById('objType').value;

    // Leer c
    const cVec = Array.from({ length: n }, (_, j) => {
      const el = document.querySelector(`[data-mat="c"][data-c="${j}"]`);
      return parseFloat(el?.value || 0) || 0;
    });

    // Construir función objetivo como string para el parser existente
    const objExpr = cVec.map((v, j) => `${v}x${j+1}`).join('+').replace(/\+-/g, '-');

    // Leer A, signos y b — construir restricciones como strings
    const constraints = Array.from({ length: m }, (_, i) => {
      const aRow = Array.from({ length: n }, (_, j) => {
        const el = document.querySelector(`[data-mat="A"][data-r="${i}"][data-c="${j}"]`);
        return parseFloat(el?.value || 0) || 0;
      });
      const sign = document.querySelector(`.mat-sign[data-row="${i}"]`)?.value || '<=';
      const b    = document.querySelector(`[data-mat="b"][data-r="${i}"]`);
      const rhs  = b?.value.trim() ?? '0';

      const expr = aRow.map((v, j) => `${v}x${j+1}`).join('+').replace(/\+-/g, '-');
      return { expr, sign, rhs };
    });

    const nameEl = document.getElementById('problemName');
    const name = nameEl ? nameEl.value.trim() : '';
    this.onSolve?.({ obj: objExpr, type, constraints, name });
  }

  showInputError(msg) {
    let el = document.getElementById('inputError');
    if (!el) {
      el = document.createElement('div');
      el.id = 'inputError';
      el.className = 'error-toast';
      document.querySelector('.input-panel')?.prepend(el);
    }
    el.textContent = `⚠ ${msg}`;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 4000);
  }

  // ── Screen 3: Resultado ───────────────────────────────────

  renderSolution(model, methodId, problemName = '') {
    if (methodId === 'graphic') {
      return this._renderGraphicSolution(model, problemName);
    }
    const { label: methodLabel } = REGISTRY[methodId] || { label: methodId };
    const sol  = model.solution;
    const hist = model.tableauHistory

    let statusHTML = '';
    if (sol.status === 'optimal') {
      const vars = Object.entries(sol.values)
        .map(([k, v]) => `<span class="sol-var"><strong>${k}</strong> = ${this._fmt(v)}</span>`)
        .join('');
      statusHTML = `
        <div class="sol-card optimal">
          <div class="sol-status">✓ Solución Óptima · ${methodLabel}</div>
          <div class="sol-obj">Z* = <span class="sol-zval">${this._fmt(sol.objectiveValue)}</span></div>
          <div class="sol-vars">${vars}</div>
        </div>`;
    } else if (sol.status === 'unbounded') {
      statusHTML = `<div class="sol-card unbounded">⚠ Problema no acotado (Unbounded)</div>`;
    } else {
      statusHTML = `<div class="sol-card infeasible">✕ Problema infactible (Infeasible)</div>`;
    }

    const tableauxHTML = hist.map((t, i) => this._renderTableau(t, i)).join('');

    this.root.innerHTML = `
      <div class="screen result-screen">
        <header class="input-header">
          <button class="back-btn" id="backBtn">← Inicio</button>
          <div class="method-tag">${methodLabel}</div>
          <h2>Resultados</h2>
        </header>
        <div class="result-body">
          ${problemName ? `<div class="problem-name-display">📋 ${problemName}</div>` : ''}
          ${statusHTML}
          <div class="tableaux-section">
            <h3 class="tableaux-title">
              Tableaux Simplex
              <span class="tableaux-count">${hist.length} tableau(x)</span>
            </h3>
            <div class="tableaux-wrapper">${tableauxHTML}</div>
          </div>
          <button class="solve-btn secondary" id="newBtn">↩ Resolver otro problema</button>
        </div>
      </div>`;

    document.getElementById('backBtn').addEventListener('click', () => this.onReset?.());
    document.getElementById('newBtn').addEventListener('click', () => this.onReset?.());
  }

  _renderTableau(t, idx) {
    const { label, headers, basis, rows, objRow, allVars } = t;

    const hCells = headers.map((h, i) => {
      const isBasis = i > 0 && i <= allVars.length && basis.includes(i - 1);
      return `<th class="${isBasis ? 'basis-col' : ''}">${h}</th>`;
    }).join('');

    // rows puede ser Float64Array o Array — ambos iterables
    const bRows = Array.from(rows).map((row, ri) => {
      const bv = allVars[basis[ri]] || '?';
      const cells = Array.from(row).map((v, ci) =>
        `<td class="${ci === row.length - 1 ? 'rhs-cell' : ''}">${this._fmt(v)}</td>`
      ).join('');
      return `<tr><td class="basis-label">${bv}</td>${cells}</tr>`;
    }).join('');

    const oCells = Array.from(objRow).map((v, ci) =>
      `<td class="obj-cell ${ci === objRow.length - 1 ? 'rhs-cell' : ''}">${this._fmt(v)}</td>`
    ).join('');

    return `
      <div class="tableau-card" style="--delay:${idx * 0.07}s">
        <div class="tableau-label">${label}</div>
        <div class="table-scroll">
          <table class="simplex-table">
            <thead><tr>${hCells}</tr></thead>
            <tbody>${bRows}<tr class="obj-row"><td class="basis-label">Z</td>${oCells}</tr></tbody>
          </table>
        </div>
      </div>`;
  }

  // ── Método Gráfico: pantalla de resultado ─────────────────

  _renderGraphicSolution(model, problemName) {
    const gd = model.graphicData;
    if (!gd) { this.root.innerHTML = '<p>Error interno gráfico.</p>'; return; }

    const { vars, obj, constraints, vertices, evaluated, optimal, status } = gd;

    if (status === 'infeasible' && (!vertices || vertices.length === 0)) {
      const isWrongVars = model.variables.length !== 2;
      this.root.innerHTML = `
        <div class="screen result-screen">
          <header class="input-header">
            <button class="back-btn" id="backBtn">← Inicio</button>
            <div class="method-tag">Gráfico</div><h2>Resultados</h2>
          </header>
          <div class="result-body">
            <div class="sol-card infeasible">
              ${isWrongVars
                ? '✕ El método gráfico solo funciona con exactamente 2 variables de decisión.'
                : '✕ Región factible vacía — problema infactible.'}
            </div>
            <button class="solve-btn secondary" id="newBtn">↩ Resolver otro</button>
          </div>
        </div>`;
      document.getElementById('backBtn').addEventListener('click', () => this.onReset?.());
      document.getElementById('newBtn').addEventListener('click',  () => this.onReset?.());
      return;
    }

    const [v1, v2] = vars;
    const c1 = obj.coeffs[v1] || 0;
    const c2 = obj.coeffs[v2] || 0;

    const vertexRows = evaluated.map(pt => {
      const isOpt = Math.abs(pt.x - optimal.x) < 1e-6 && Math.abs(pt.y - optimal.y) < 1e-6;
      return `<tr class="${isOpt ? 'opt-row' : ''}">
        <td>${this._fmt(pt.x)}</td><td>${this._fmt(pt.y)}</td>
        <td><strong>${this._fmt(pt.z)}</strong>${isOpt ? ' ★' : ''}</td>
      </tr>`;
    }).join('');

    this.root.innerHTML = `
      <div class="screen result-screen">
        <header class="input-header">
          <button class="back-btn" id="backBtn">← Inicio</button>
          <div class="method-tag">Gráfico</div>
          <h2>Resultados</h2>
        </header>
        <div class="result-body">
          ${problemName ? `<div class="problem-name-display">📋 ${problemName}</div>` : ''}
          <div class="sol-card optimal">
            <div class="sol-status">✓ Solución Óptima · Método Gráfico</div>
            <div class="sol-obj">Z* = <span class="sol-zval">${this._fmt(optimal.z)}</span></div>
            <div class="sol-vars">
              <span class="sol-var"><strong>${v1}</strong> = ${this._fmt(optimal.x)}</span>
              <span class="sol-var"><strong>${v2}</strong> = ${this._fmt(optimal.y)}</span>
            </div>
          </div>

          <div class="graphic-layout">
            <div class="graphic-canvas-wrap">
              <canvas id="graphicCanvas" width="480" height="480"></canvas>
            </div>
            <div class="graphic-side">
              <h3 class="tableaux-title">Vértices evaluados</h3>
              <table class="vertex-table">
                <thead><tr><th>${v1}</th><th>${v2}</th><th>Z</th></tr></thead>
                <tbody>${vertexRows}</tbody>
              </table>
              <div class="graphic-obj-info">
                <span class="field-optional">Función objetivo:</span><br/>
                Z = ${c1}${v1} + ${c2}${v2}
                &nbsp;·&nbsp; <em>${obj.type === 'max' ? 'Maximizar' : 'Minimizar'}</em>
              </div>
            </div>
          </div>

          <button class="solve-btn secondary" id="newBtn">↩ Resolver otro problema</button>
        </div>
      </div>`;

    document.getElementById('backBtn').addEventListener('click', () => this.onReset?.());
    document.getElementById('newBtn').addEventListener('click',  () => this.onReset?.());

    // Dibujar canvas después de que el DOM esté listo
    requestAnimationFrame(() => this._drawGraphic(gd));
  }

  _drawGraphic({ vars, obj, constraints, vertices, optimal }) {
    const canvas = document.getElementById('graphicCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const PAD = 52;

    // Rango automático
    const xs = [0, ...vertices.map(p => p.x)];
    const ys = [0, ...vertices.map(p => p.y)];
    const rawMaxX = Math.max(...xs) * 1.25 || 10;
    const rawMaxY = Math.max(...ys) * 1.25 || 10;
    const maxX = rawMaxX < 1 ? 5 : rawMaxX;
    const maxY = rawMaxY < 1 ? 5 : rawMaxY;

    const tx = x => PAD + (x / maxX) * (W - PAD * 2);
    const ty = y => H - PAD - (y / maxY) * (H - PAD * 2);

    // Fondo
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--bg') || '#14141a';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const xp = tx(i * maxX / steps); ctx.beginPath(); ctx.moveTo(xp, PAD); ctx.lineTo(xp, H - PAD); ctx.stroke();
      const yp = ty(i * maxY / steps); ctx.beginPath(); ctx.moveTo(PAD, yp); ctx.lineTo(W - PAD, yp); ctx.stroke();
    }

    // Ejes
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(tx(0), ty(0)); ctx.lineTo(tx(maxX), ty(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx(0), ty(0)); ctx.lineTo(tx(0), ty(maxY)); ctx.stroke();

    // Labels ejes
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= steps; i++) {
      const val = +(i * maxX / steps).toFixed(2);
      ctx.fillText(val, tx(val), H - PAD + 16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= steps; i++) {
      const val = +(i * maxY / steps).toFixed(2);
      ctx.fillText(val, PAD - 6, ty(val) + 4);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(vars[0], W - PAD + 18, H - PAD + 5);
    ctx.fillText(vars[1], PAD - 18, PAD - 10);

    // Restricciones — líneas
    const colors = ['#5b7cfa','#00e5a0','#f5a623','#e05c5c','#b48ef5','#5cd9f5'];
    constraints.forEach((c, i) => {
      const a = c.coeffs[vars[0]] || 0;
      const b = c.coeffs[vars[1]] || 0;
      const rhs = c.rhs;
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      let drawn = false;
      if (Math.abs(b) > 1e-9) {
        const x0 = 0,     y0 = (rhs - a * x0) / b;
        const x1 = maxX,  y1 = (rhs - a * x1) / b;
        ctx.moveTo(tx(x0), ty(y0));
        ctx.lineTo(tx(x1), ty(y1));
        drawn = true;
      } else if (Math.abs(a) > 1e-9) {
        const xv = rhs / a;
        ctx.moveTo(tx(xv), ty(0));
        ctx.lineTo(tx(xv), ty(maxY));
        drawn = true;
      }
      if (drawn) ctx.stroke();
      ctx.setLineDash([]);
    });

    // Región factible (polígono convexo)
    if (vertices.length >= 3) {
      // Ordenar vértices por ángulo (hull convexo simple)
      const cx = vertices.reduce((s, p) => s + p.x, 0) / vertices.length;
      const cy = vertices.reduce((s, p) => s + p.y, 0) / vertices.length;
      const sorted = [...vertices].sort((a, b) =>
        Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
      );
      ctx.beginPath();
      ctx.moveTo(tx(sorted[0].x), ty(sorted[0].y));
      sorted.slice(1).forEach(p => ctx.lineTo(tx(p.x), ty(p.y)));
      ctx.closePath();
      ctx.fillStyle = 'rgba(91,124,250,0.13)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(91,124,250,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Vértices
    vertices.forEach(pt => {
      const isOpt = Math.abs(pt.x - optimal.x) < 1e-6 && Math.abs(pt.y - optimal.y) < 1e-6;
      ctx.beginPath();
      ctx.arc(tx(pt.x), ty(pt.y), isOpt ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isOpt ? '#00e5a0' : 'rgba(255,255,255,0.7)';
      ctx.fill();
      if (isOpt) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Etiqueta del óptimo
    ctx.fillStyle = '#00e5a0';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `★ (${this._fmt(optimal.x)}, ${this._fmt(optimal.y)})`,
      tx(optimal.x) + 10,
      ty(optimal.y) - 8
    );
  }

  _fmt(v) {
    if (Math.abs(v) < 1e-9) return '0';
    const r = Math.round(v * 10000) / 10000;
    return Number.isInteger(r) ? r.toString() : r.toFixed(4).replace(/\.?0+$/, '');
  }
}
