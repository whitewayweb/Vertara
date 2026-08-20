export interface EditHistory<T> {
  future: T[];
  past: T[];
  present: T;
}

export function createEditHistory<T>(present: T): EditHistory<T> {
  return { future: [], past: [], present };
}

export function commitEdit<T>(history: EditHistory<T>, next: T): EditHistory<T> {
  if (Object.is(history.present, next)) return history;
  return { future: [], past: [...history.past, history.present], present: next };
}

export function undoEdit<T>(history: EditHistory<T>): EditHistory<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return { future: [history.present, ...history.future], past: history.past.slice(0, -1), present: previous };
}

export function redoEdit<T>(history: EditHistory<T>): EditHistory<T> {
  const next = history.future[0];
  if (next === undefined) return history;
  return { future: history.future.slice(1), past: [...history.past, history.present], present: next };
}
