import { getTowerData } from '@/creep/war/war'
import { colors, unzipXY } from '@/utils'
// import { compoundColor } from '@/structure/constant/resource'

/* 可视化模块 */
/**
 * 防御塔数据可视化
 * TowerVisualAttack 防御塔攻击数据
 * TowerVisualHeal   防御塔治疗数据
 * TowerVisualRepair 防御塔维修数据
 * 较消耗cpu，仅做短暂统计用，请及时截图及销毁旗帜
 * @returns void
 */
export function showTowerData(): void {
  if (Game.flags.TowerVisualAttack) {
    const roomName = Game.flags.TowerVisualAttack.pos.roomName
    if (!global.warData)
      global.warData = {}
    if (!global.warData.tower)
      global.warData.tower = {}
    if (!global.warData.tower[roomName])
      global.warData.tower[roomName] = { count: 0 }

    if (global.warData.tower[roomName].data) {
      // 数据
      for (const posData in global.warData.tower[roomName].data) {
        const posXY = unzipXY(posData)
        if (!posXY)
          continue
        const tx = posXY[0]
        const ty = posXY[1]
        const data = global.warData.tower[roomName].data[posData]
        new RoomVisual(roomName).text(`${data.attack}`, tx, ty, { color: 'red', font: 0.4, align: 'center' })
      }
      return
    }

    if (!Game.rooms[roomName]) {
      // 如果没有房间视野，采用 observer 观察
      for (const i in Memory.roomControlData) {
        const room = Game.rooms[i]
        if (room?.controller && room.controller.level >= 8) {
          const observer = room.memory.structureIdData?.observerID ? Game.getObjectById(room.memory.structureIdData.observerID) : null
          if (observer && observer.observeRoom(roomName) === OK)
            break
        }
      }
      return
    }

    if (!global.warData.tower[roomName].data)
      global.warData.tower[roomName].data = getTowerData(Game.rooms[roomName])
  }

  if (Game.flags.TowerVisualHeal) {
    const roomName = Game.flags.TowerVisualHeal.pos.roomName
    if (!global.warData)
      global.warData = {}
    if (!global.warData.tower)
      global.warData.tower = {}
    if (!global.warData.tower[roomName])
      global.warData.tower[roomName] = { count: 0 }

    if (global.warData.tower[roomName].data) {
      // 数据
      for (const posData in global.warData.tower[roomName].data) {
        const posXY = unzipXY(posData)
        if (!posXY)
          continue
        const tx = posXY[0]
        const ty = posXY[1]
        const data = global.warData.tower[roomName].data[posData]
        new RoomVisual(roomName).text(`${data.attack}`, tx, ty, { color: 'green', font: 0.4, align: 'center' })
      }
      return
    }

    if (!Game.rooms[roomName]) {
      // 如果没有房间视野，采用 observer 观察
      for (const i in Memory.roomControlData) {
        const room = Game.rooms[i]
        if (room?.controller && room.controller.level >= 8) {
          const observer = room.memory.structureIdData?.observerID ? Game.getObjectById(room.memory.structureIdData.observerID) : null
          if (observer && observer.observeRoom(roomName) === OK)
            break
        }
      }
      return
    }

    if (!global.warData.tower[roomName].data)
      global.warData.tower[roomName].data = getTowerData(Game.rooms[roomName])
  }

  if (Game.flags.TowerVisualRepair) {
    const roomName = Game.flags.TowerVisualRepair.pos.roomName
    if (!global.warData)
      global.warData = {}
    if (!global.warData.tower)
      global.warData.tower = {}
    if (!global.warData.tower[roomName])
      global.warData.tower[roomName] = { count: 0 }

    if (global.warData.tower[roomName].data) {
      // 数据
      for (const posData in global.warData.tower[roomName].data) {
        const posXY = unzipXY(posData)
        if (!posXY)
          continue
        const tx = posXY[0]
        const ty = posXY[1]
        const data = global.warData.tower[roomName].data[posData]
        new RoomVisual(roomName).text(`${data.attack}`, tx, ty, { color: 'yellow', font: 0.4, align: 'center' })
      }
      return
    }

    if (!Game.rooms[roomName]) {
      // 如果没有房间视野，采用 observer 观察
      for (const i in Memory.roomControlData) {
        const room = Game.rooms[i]
        if (room?.controller && room.controller.level >= 8) {
          const observer = room.memory.structureIdData?.observerID ? Game.getObjectById(room.memory.structureIdData.observerID) : null
          if (observer && observer.observeRoom(roomName) === OK)
            break
        }
      }
      return
    }

    if (!global.warData.tower[roomName].data)
      global.warData.tower[roomName].data = getTowerData(Game.rooms[roomName])
  }
}

const normalTextStyle = { color: colors.zinc, opacity: 0.8, font: 0.7, align: 'left' } as const

function box(visual: RoomVisual, x: number, y: number, w: number, h: number, style?: LineStyle) {
  return visual
    .line(x + 0.1, y + 0.05, x + w - 0.1, y + 0.05, style)
    .line(x + w - 0.05, y, x + w - 0.05, y + h, style)
    .line(x + w - 0.1, y + h - 0.05, x + 0.1, y + h - 0.05, style)
    .line(x + 0.05, y + h, x + 0.05, y, style)
}

function labelBar(visual: RoomVisual, x: number, y: number, labelSpace: number, w: number, label: string, content: string, percent: number, color: string) {
  visual.text(label, x + labelSpace, y, { color, opacity: 0.7, font: 0.7, align: 'right' })
  box(visual, x + labelSpace + 0.1, y - 0.7, x + 6.1, 0.9, { color, opacity: 0.2 })
  visual.rect(x + labelSpace + 0.1 + 0.1, y - 0.6, percent * w, 0.7, { fill: color, opacity: 0.3 })
  visual.text(content, x + labelSpace + 0.1 + w / 2, y - 0.05, { color, font: 0.5, align: 'center' })
}

/**
 * 房间日常数据可视化
 * 瞬时cpu 平均cpu 房间状态 任务数 bucket等
 */
export function processRoomDataVisual(room: Room): void {
  const visual = room.visual

  // Room Status
  let line = 0.7
  visual.text(`${room.name}`, 0.1, line, normalTextStyle)
  visual.text(room.memory.state === 'peace' ? '和平' : '战争', room.name.length * 0.45 + 0.3, 0.7, { ...normalTextStyle, color: room.memory.state === 'peace' ? colors.zinc : colors.red })
  const missionNum = Object.values(room.memory.mission).reduce((a, b) => a + b.length, 0)
  visual.text(`共 ${missionNum} 任务`, room.name.length * 0.45 + 2, 0.7, { ...normalTextStyle, color: missionNum > 20 ? colors.amber : colors.zinc })
  visual.text(`${Object.values(global.creepNumData[room.name] || {}).reduce((a, b) => a + b, 0)} 爬虫`, room.name.length * 0.45 + missionNum.toString().length * 0.4 + 4.6, 0.7, normalTextStyle)

  // CPU
  const cpuUsed = global.usedCpu || 0
  const usedCpuPercent = cpuUsed / Game.cpu.limit
  const usedCpuPercentVisual = Math.min(usedCpuPercent, 1)
  const cpuColor = usedCpuPercent > 0.8 ? colors.rose : usedCpuPercent > 0.5 ? colors.amber : colors.emerald
  labelBar(visual, 0.1, line += 1.1, 1.4, 6, 'CPU', `${cpuUsed.toFixed(2)} - ${Math.round(usedCpuPercent * 100)}%`, usedCpuPercentVisual, cpuColor)

  // Bucket
  const bucket = Game.cpu.bucket
  const bucketPercent = bucket / 10000
  const bucketColor = bucketPercent < 0.1 ? colors.rose : bucketPercent < 0.3 ? colors.amber : colors.emerald
  labelBar(visual, 0.1, line += 1.1, 1.4, 6, 'BKT', `${bucket}`, bucketPercent, bucketColor)

  // 控制器进度
  if (room.controller) {
    const controllerProgress = room.controller.level >= 8 ? 1 : room.controller.progress / room.controller.progressTotal
    labelBar(visual, 0.1, line += 1.1, 1.4, 6, '升级', `${(controllerProgress * 100).toFixed(4)}%`, controllerProgress, colors.cyan)
  }

  // 仓库
  const storage = room.memory.structureIdData?.storageID ? Game.getObjectById(room.memory.structureIdData.storageID) : null
  if (storage) {
    const storageFree = Math.ceil(storage.store.getFreeCapacity() / 1000)
    const storageUsedPercent = storage.store.getUsedCapacity() / storage.store.getCapacity()
    const storageFreeColor = storageUsedPercent > 0.9 ? colors.rose : storageUsedPercent > 0.7 ? colors.amber : colors.cyan
    labelBar(visual, 0.1, line += 1.1, 1.4, 6, '仓库', `${storageFree}K`, storageUsedPercent, storageFreeColor)
  }

  // 工厂
  // TODO 测试
  let line2 = 1.8
  if (room.controller && room.controller.level >= 8) {
    if (room.memory.productData.producing) {
      const producing = room.memory.productData.producing
      if (producing.total) {
        const producingNum = (producing.num || 0)
        const producingPercent = producingNum / producing.total
        const producingPercentVisual = Math.min(producingPercent, 1)
        labelBar(visual, 10, line2 += 1.1, 1.4, 6, '工厂', `${producing.com} - ${producingPercent.toFixed(1)}%`, producingPercentVisual, colors.cyan)
      }
      else {
        visual.text(`工厂生产 -> ${producing.com}`, 0.1, line += 1.1, normalTextStyle)
      }
    }
    if (room.memory.comDispatchData && Object.keys(room.memory.comDispatchData).length > 0) {
      const ress = Object.keys(room.memory.comDispatchData) as ResourceConstant[]
      const res = ress[ress.length - 1]
      const resData = room.memory.comDispatchData[res]!
      visual.text(`工厂规划 ${res} (${resData.dispatch_num})`, 0.1, line += 1.1, normalTextStyle)
    }
  }

  // // lab 资源可视化
  // if (room.memory.roomLabBind && Object.keys(room.memory.roomLabBind).length > 0) {
  //   for (const i in room.memory.roomLabBind) {
  //     const lab = Game.getObjectById(i as Id<StructureLab>)
  //     if (!lab) {
  //       delete room.memory.roomLabBind[i]
  //       if (room.memory.structureIdData?.labs)
  //         room.memory.structureIdData.labs.splice(room.memory.structureIdData.labs.indexOf(i as Id<StructureLab>), 1)
  //       continue
  //     }

  //     room.visual.text(
  //       `${room.memory.roomLabBind[i].rType}`,
  //       lab.pos.x, lab.pos.y,
  //       { color: compoundColor[room.memory.roomLabBind[i].rType as keyof typeof compoundColor], font: 0.3, align: 'center', strokeWidth: 0.2 })
  //   }
  // }
}
