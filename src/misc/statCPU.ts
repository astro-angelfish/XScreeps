/**
 * 平均 cpu 统计相关
 */
export function statCPU(): void {
  if (!global.cpuData)
    global.cpuData = []

  const mainEndCpu = Game.cpu.getUsed()
  global.usedCpu = mainEndCpu

  const maxLen = 200

  if (global.cpuData.length > maxLen)
    global.cpuData.shift()

  global.cpuData.push(global.usedCpu)

  // 计算平均 cpu
  const allCpu = global.cpuData.reduce((a, b) => a + b, 0)
  global.aveCpu = allCpu / global.cpuData.length
}
