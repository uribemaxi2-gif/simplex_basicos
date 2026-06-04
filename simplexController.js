// ============================================================
// controllers/simplexController.js
// Responsabilidad: orquestar Model ↔ View.
// No contiene lógica de algoritmo ni de DOM.
//
// Agregar un método nuevo NO requiere cambios aquí:
// el Controller obtiene solve() desde el REGISTRY dinámicamente.
// ============================================================

import { SimplexModel }  from '../models/simplexModel.js';
import { SimplexView }   from '../views/simplexView.js';
import { REGISTRY }      from '../models/methodRegistry.js';

export class SimplexController {
  constructor(rootId) {
    this.model         = new SimplexModel();
    this.view          = new SimplexView(rootId);
    this.currentMethod = null;

    // Conectar callbacks View → Controller
    this.view.onMethodSelected = (id) => this.handleMethodSelected(id);
    this.view.onSolve          = (d)  => this.handleSolve(d);
    this.view.onReset          = ()   => this.handleReset();
    this.view.onAddConstraint  = ()   => this.view.addConstraintRow();
  }

  start() {
    this.view.renderMethodSelector();
  }

  // ── Handlers ─────────────────────────────────────────────

  handleMethodSelected(methodId) {
    this.currentMethod = methodId;
    this.model.reset();
    this.view.renderInputPanel(methodId);
  }

  handleSolve({ obj, type, constraints, name = '' }) {
    // Validación básica
    if (!obj)
      return this.view.showInputError('Ingresa la función objetivo.');
    if (!constraints.length)
      return this.view.showInputError('Agrega al menos una restricción.');

    const method = REGISTRY[this.currentMethod];
    if (!method)
      return this.view.showInputError(`Método desconocido: ${this.currentMethod}`);

    // Alimentar modelo
    this._problemName = name;
    this.model.reset();
    try {
      this.model.parseObjective(obj, type);
      for (const c of constraints)
        this.model.parseConstraint(c.expr, c.sign, c.rhs);
    } catch (e) {
      return this.view.showInputError(`Error de parseo: ${e.message}`);
    }

    // Construir tableau y resolver
    try {
      const tableau = this.model.buildTableau();
      method.solve(tableau, this.model);  // ← una sola línea, sin if/else
    } catch (e) {
      console.error(e);
      return this.view.showInputError(`Error al resolver: ${e.message}`);
    }

    this.view.renderSolution(this.model, this.currentMethod, this._problemName || '');
  }

  handleReset() {
    this.currentMethod = null;
    this.model.reset();
    this.view.renderMethodSelector();
  }
}
