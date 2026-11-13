import { afterEach, describe, expect, it } from 'vitest'
import { installWebCompatibility } from '../src/compat.ts'

const saved = {
  withResolvers: Reflect.get(Promise, 'withResolvers') as unknown,
  toSorted: Reflect.get(Array.prototype, 'toSorted') as unknown,
  toReversed: Reflect.get(Array.prototype, 'toReversed') as unknown,
  canParse: Reflect.get(URL, 'canParse') as unknown,
}

function restore(owner: object, name: string, value: unknown): void {
  if (value === undefined) Reflect.deleteProperty(owner, name)
  else Object.defineProperty(owner, name, { configurable: true, enumerable: false, writable: true, value })
}

afterEach(() => {
  restore(Promise, 'withResolvers', saved.withResolvers)
  restore(Array.prototype, 'toSorted', saved.toSorted)
  restore(Array.prototype, 'toReversed', saved.toReversed)
  restore(URL, 'canParse', saved.canParse)
})

function withoutBuiltIns(): void {
  for (const [owner, name] of [[Promise, 'withResolvers'], [Array.prototype, 'toSorted'],
    [Array.prototype, 'toReversed'], [URL, 'canParse']] as const) {
    Reflect.deleteProperty(owner, name)
    expect(Reflect.has(owner, name)).toBe(false)
  }
}

describe('web compatibility install', () => {
  it('provides the missing built-ins on an ES2022 realm', async () => {
    withoutBuiltIns()
    installWebCompatibility()

    const deferred = Promise.withResolvers<string>()
    deferred.resolve('settled')
    await expect(deferred.promise).resolves.toBe('settled')

    const rejected = Promise.withResolvers<string>()
    rejected.reject(new Error('refused'))
    await expect(rejected.promise).rejects.toThrow('refused')

    expect([3, 1, 2].toSorted()).toEqual([1, 2, 3])
    expect([1, 2, 3].toSorted((left, right) => right - left)).toEqual([3, 2, 1])
    expect([1, 2, 3].toReversed()).toEqual([3, 2, 1])
    const source = [1, 2]
    source.toSorted()
    source.toReversed()
    expect(source).toEqual([1, 2])

    expect(URL.canParse('https://example.com/path')).toBe(true)
    expect(URL.canParse('/relative', 'https://example.com')).toBe(true)
    expect(URL.canParse('not a url')).toBe(false)
  })

  it('leaves a realm that already has the built-ins untouched', () => {
    const installed = {
      withResolvers: function withResolvers() { throw new Error('should not be replaced') },
      toSorted: function toSorted() { return ['kept'] },
      toReversed: function toReversed() { return ['kept'] },
      canParse: function canParse() { return 'kept' },
    }
    Object.defineProperty(Promise, 'withResolvers', { configurable: true, value: installed.withResolvers })
    Object.defineProperty(Array.prototype, 'toSorted', { configurable: true, value: installed.toSorted })
    Object.defineProperty(Array.prototype, 'toReversed', { configurable: true, value: installed.toReversed })
    Object.defineProperty(URL, 'canParse', { configurable: true, value: installed.canParse })

    installWebCompatibility()

    expect(Promise.withResolvers).toBe(installed.withResolvers)
    expect(Reflect.get(Array.prototype, 'toSorted')).toBe(installed.toSorted)
    expect(Reflect.get(Array.prototype, 'toReversed')).toBe(installed.toReversed)
    expect(URL.canParse).toBe(installed.canParse)
  })
})
