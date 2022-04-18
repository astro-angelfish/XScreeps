type Colors = 'red' | 'blue' | 'green' | 'yellow' | 'orange'
const colors: Record<Colors, string> = {
  red: '#ef9a9a',
  green: '#6b9955',
  yellow: '#c5c599',
  blue: '#8dc5e3',
  orange: '#ff9d00',
}
export function colorfyLog(content: string, colorName?: Colors | string, bolder = false): string {
  const colorStyle = colorName ? `color: ${colorName in colors ? colors[colorName as Colors] : colorName};` : ''
  const bolderStyle = bolder ? 'font-weight: bolder;' : ''

  return `<text style="${[colorStyle, bolderStyle].join(' ')}">${content}</text>`
}
