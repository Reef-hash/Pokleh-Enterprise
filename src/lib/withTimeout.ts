/**
 * Bounds a promise (or Supabase query builder thenable) to `ms` milliseconds.
 * Rejects on timeout so callers' existing try/catch fallback paths run,
 * instead of hanging forever on a stalled network request.
 */
export function withTimeout<T>(input: PromiseLike<T>, ms: number, message = "Request timed out"): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([Promise.resolve(input), timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}
