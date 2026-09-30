type Callback<T> = (value: T) => void

const sizeCallbacks = new WeakMap<Element, Callback<void>>()
const visibilityCallbacks = new WeakMap<Element, Callback<boolean>>()
let sizeObserver: ResizeObserver | null = null
let visibilityObserver: IntersectionObserver | null = null

export function onResize(el: Element, cb: Callback<void>): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {}
  sizeObserver ??= new ResizeObserver(entries => entries.forEach(e => sizeCallbacks.get(e.target)?.()))
  sizeCallbacks.set(el, cb)
  sizeObserver.observe(el)
  return () => {
    sizeCallbacks.delete(el)
    sizeObserver?.unobserve(el)
  }
}

export function onVisibility(el: Element, cb: Callback<boolean>): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    cb(true)
    return () => {}
  }
  visibilityObserver ??= new IntersectionObserver(entries => entries.forEach(e => visibilityCallbacks.get(e.target)?.(e.isIntersecting)))
  visibilityCallbacks.set(el, cb)
  visibilityObserver.observe(el)
  return () => {
    visibilityCallbacks.delete(el)
    visibilityObserver?.unobserve(el)
  }
}
