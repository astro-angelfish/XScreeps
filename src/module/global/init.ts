/**
 * Memory初始化
 */
export function initMemory(): void {
  if (!Memory.whitelist)
    Memory.whitelist = []
  if (!Memory.bypassRooms)
    Memory.bypassRooms = []
  if (!Memory.ignoreMissionName)
    Memory.ignoreMissionName = []
  if (!global.Gtime)
    global.Gtime = {}
  for (const i in Memory.roomControlData) {
    if (!global.Gtime[i])
      global.Gtime[i] = Game.time - Math.ceil(Math.random() * 20)
  }
  if (!global.SpecialBodyData)
    global.SpecialBodyData = {}
  for (const i in Memory.roomControlData) {
    if (!global.SpecialBodyData[i])
      global.SpecialBodyData[i] = {}
  }
  if (!global.intervalData)
    global.intervalData = {}
  for (const i in global.intervalData) {
    if (!global.intervalData[i])
      global.intervalData[i] = {}
  }
  if (!global.structureCache)
    global.structureCache = {}
  if (!Memory.marketAdjust)
    Memory.marketAdjust = {}
  if (!Memory.resourceDispatchData)
    Memory.resourceDispatchData = []
  if (!global.resourceLimit)
    global.resourceLimit = {}
  if (!Memory.outMineData)
    Memory.outMineData = {}
  if (!global.warData)
    global.warData = { tower: {}, enemy: {}, flag: {}, structure: {} }
  if (!global.MSB)
    global.MSB = {}
  if (!Memory.stopPixel)
    Memory.stopPixel = false
}
