/**
 * 平均 cpu 统计相关
 */
export function statCPU(): void {
  const mainEndCpu = Game.cpu.getUsed()
  if (!global.cpuData)
    global.cpuData = []
  global.usedCpu = mainEndCpu

  // 小于一百就直接 push
  if (global.cpuData.length < 100) {
    global.cpuData.push(global.usedCpu)

    // 计算平均 cpu
    const allCpu = global.cpuData.reduce((a, b) => a + b, 0)
    global.aveCpu = allCpu / global.cpuData.length
  }
  // 计算平均值
  else {
    const allCpu = global.cpuData.reduce((a, b) => a + b, 0)
    global.cpuData = [allCpu / 100]
    global.aveCpu = allCpu
  }
}
