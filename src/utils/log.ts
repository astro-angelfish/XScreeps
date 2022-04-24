const colors = {
  slate: '#cbd5e1',
  gray: '#d1d5db',
  zinc: '#d4d4d8',
  neutral: '#d4d4d4',
  stone: '#d6d3d1',
  red: '#fca5a5',
  orange: '#fdba74',
  amber: '#fcd34d',
  yellow: '#fde047',
  lime: '#bef264',
  green: '#86efac',
  emerald: '#6ee7b7',
  teal: '#5eead4',
  cyan: '#67e8f9',
  sky: '#7dd3fc',
  blue: '#93c5fd',
  indigo: '#a5b4fc',
  violet: '#c4b5fd',
  purple: '#d8b4fe',
  fuchsia: '#f0abfc',
  pink: '#f9a8d4',
  rose: '#fda4af',
}
export type ColorifyLogColors = keyof typeof colors

export function colorfyLog(content: string, colorName?: ColorifyLogColors, bolder?: boolean): string
export function colorfyLog(content: string, colorName?: string, bolder?: boolean): string
export function colorfyLog(content: string, colorName?: string, bolder = false): string {
  const colorStyle = colorName ? `color: ${colorName in colors ? colors[colorName as ColorifyLogColors] : colorName};` : ''
  const bolderStyle = bolder ? 'font-weight: bolder;' : ''

  return `<text style="${[colorStyle, bolderStyle].join(' ')}">${content}</text>`
}
