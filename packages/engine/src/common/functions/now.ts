/**
 * return current time of the system.
 * performance.now() "polyfill"
 */
export const now = typeof window !== 'undefined' && typeof window.performance !== 'undefined' ? performance.now.bind(performance) : Date.now.bind(Date);
