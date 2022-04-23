export function pixel(): void {
  if (Game.cpu.bucket >= 10000) {
    if (!Memory.stopPixel)
      Game.cpu.generatePixel()
  }
}
