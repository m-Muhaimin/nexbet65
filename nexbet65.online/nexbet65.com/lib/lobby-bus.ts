export type LobbyFilter =
  | "all"
  | "slots"
  | "crash"
  | "live"
  | "fishing"
  | "table"
  | "sports"
  | "hot"
  | "new";

const filterListeners = new Set<(f: LobbyFilter) => void>();
const searchListeners = new Set<(q: string) => void>();

/** Subscribe to category-filter changes (sidebar + pill bar share the grid state). */
export function subscribeFilter(cb: (f: LobbyFilter) => void): () => void {
  filterListeners.add(cb);
  return () => {
    filterListeners.delete(cb);
  };
}

export function setLobbyFilter(f: LobbyFilter): void {
  filterListeners.forEach((cb) => cb(f));
}

/** Subscribe to global header-search changes (wired into the game grid). */
export function subscribeSearch(cb: (q: string) => void): () => void {
  searchListeners.add(cb);
  return () => {
    searchListeners.delete(cb);
  };
}

export function setLobbySearch(q: string): void {
  searchListeners.forEach((cb) => cb(q));
}
