const storageKey = (id: string) => `lomalista:mine:${id}`;

export function loadMine(id: string): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey(id)) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function saveMine(id: string, mine: Set<number>) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify([...mine]));
  } catch {
    /* storage unavailable: the "mine" highlight is a convenience only */
  }
}
