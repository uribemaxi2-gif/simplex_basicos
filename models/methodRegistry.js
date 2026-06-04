// ============================================================
// models/methodRegistry.js
// Para agregar un método: importarlo y añadirlo a METHODS.
// ============================================================

import { meta as metaStd,     solve as solveStd     } from './methods/standard.js';
import { meta as metaBigM,    solve as solveBigM    } from './methods/bigM.js';
import { meta as metaTwo,     solve as solveTwo     } from './methods/twoPhase.js';
import { meta as metaDual,    solve as solveDual    } from './methods/dual.js';
import { meta as metaPrimal,  solve as solvePrimal  } from './methods/primal.js';
import { meta as metaRevised, solve as solveRevised } from './methods/revised.js';
import { meta as metaGraphic, solve as solveGraphic } from './methods/graphic.js';

export const METHODS = [
  { ...metaStd,     solve: solveStd     },
  { ...metaBigM,    solve: solveBigM    },
  { ...metaTwo,     solve: solveTwo     },
  { ...metaDual,    solve: solveDual    },
  { ...metaPrimal,  solve: solvePrimal  },
  { ...metaRevised, solve: solveRevised },
  { ...metaGraphic, solve: solveGraphic },
];

export const REGISTRY = Object.fromEntries(METHODS.map(m => [m.id, m]));
