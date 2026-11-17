/** SQLite has no boolean type: flags are stored as INTEGER 0/1. */
export enum SqlBoolean {
  FALSE = 0,
  TRUE = 1,
}
