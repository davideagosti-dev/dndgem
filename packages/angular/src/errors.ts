export function boardScopeError(api: string): Error {
  return new Error(`${api} must be used within a dndgemBoard`);
}
