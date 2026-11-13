// Kontrak bersama scene 3D dan fallback SVG (api.md §3).

/**
 * @typedef {'arc' | 'sector' | 'both' | 'none'} Highlight
 *
 * @typedef {object} SceneHandle
 * @property {(deg: number) => void} setAngle
 * @property {(r: number) => void} setRadius
 * @property {(h: Highlight) => void} setHighlight
 * @property {(on: boolean) => void} setTopView
 * @property {() => void} resetCamera
 * @property {(cb: (s: { angle: number, radius: number }) => void) => () => void} onChange
 * @property {() => void} dispose
 */

export const HIGHLIGHTS = /** @type {const} */ (['arc', 'sector', 'both']);
