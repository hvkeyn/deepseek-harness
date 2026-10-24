/**
 * Install the newer built-ins the Web client calls but the last Windows 7
 * browsers lack.
 *
 * The shell and the dynamic client bundles call `Promise.withResolvers`,
 * `Array.prototype.toSorted` and `toReversed`, and `URL.canParse`. Those are
 * ES2023/ES2024 runtime APIs: browsers that still satisfy the ES2022 build
 * target — Chrome and Edge 109, and Firefox 115 ESR, the final releases that run
 * on Windows 7 — parse the client but throw where a call site runs. The entry
 * installs the missing ones before any client module evaluates.
 *
 * This runs only in the browser entry; it changes nothing on the server, and
 * browsers that already ship these built-ins take no branch here.
 */

/**
 * Install the missing built-ins on one realm.
 * @param scope - Realm receiving them; defaults to the current one.
 * @returns Nothing; absent APIs are defined, present ones are left untouched.
 */
export function installWebCompatibility(scope: typeof globalThis = globalThis): void {
  const promise = scope.Promise
  if (typeof promise.withResolvers !== 'function') {
    Object.defineProperty(promise, 'withResolvers', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: function withResolvers<T>(): PromiseWithResolvers<T> {
        let resolve!: (value: T | PromiseLike<T>) => void
        let reject!: (reason?: unknown) => void
        const instance = new promise<T>((settle, fail) => {
          resolve = settle
          reject = fail
        })
        return { promise: instance, resolve, reject }
      },
    })
  }
  const prototype = scope.Array.prototype as unknown[]
  if (typeof (prototype as { toSorted?: unknown }).toSorted !== 'function') {
    Object.defineProperty(prototype, 'toSorted', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: function toSorted<T>(this: T[], compare?: (left: T, right: T) => number): T[] {
        return [...this].sort(compare)
      },
    })
  }
  if (typeof (prototype as { toReversed?: unknown }).toReversed !== 'function') {
    Object.defineProperty(prototype, 'toReversed', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: function toReversed<T>(this: T[]): T[] {
        return [...this].reverse()
      },
    })
  }
  const url = scope.URL
  if (typeof url.canParse !== 'function') {
    Object.defineProperty(url, 'canParse', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: function canParse(candidate: string | URL, base?: string | URL): boolean {
        try {
          new url(candidate, base)
          return true
        } catch {
          // The constructor rejects exactly the values this predicate classifies as unparsable.
          return false
        }
      },
    })
  }
}

installWebCompatibility()
