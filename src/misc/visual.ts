import { getTowerData } from '@/creep/war/war'
import { unzipXY } from '@/utils'
import { compoundColor } from '@/structure/constant/resource'

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

/**
 * 房间日常数据可视化
 * 瞬时cpu 平均cpu 房间状态 任务数 bucket等
 */
export function processRoomDataVisual(room: Room): void {
  room.visual.rect(0, 0, 7, 10, { opacity: 0.1, stroke: '#696969', strokeWidth: 0.2 })
  let row = 0
  room.visual.text(
    `全局实时CPU:${(global.usedCpu ? global.usedCpu : 0).toFixed(2)}`,
    0, row += 1,
    { color: 'black', font: 0.7, align: 'left' })
  room.visual.text(
    `全局平均CPU:${(global.aveCpu ? global.aveCpu : 0).toFixed(2)}`,
    0, row += 1,
    { color: 'black', font: 0.7, align: 'left' })
  room.visual.text(
    `房间状态:${(room.memory.state === 'peace' ? '和平' : '战争')}`,
    0, row += 1,
    { color: room.memory.state === 'peace' ? '#006400' : 'red', font: 0.7, align: 'left' })
  room.visual.text(
    `cpu池:${Game.cpu.bucket}`,
    0, row += 1,
    { color: Game.cpu.bucket < 2000 ? 'red' : 'black', font: 0.7, align: 'left' })

  // 控制器进度
  if (room.controller) {
    const processController = room.controller.level >= 8 ? 100 : ((room.controller.progress / room.controller.progressTotal) * 100).toFixed(4)
    room.visual.text(
      `控制器进度:${processController}%`,
      0, row += 1,
      { color: 'black', font: 0.7, align: 'left' })
  }

  // 目前存在任务数
  let MissionNum = 0
  for (const range in room.memory.mission)
    MissionNum += Object.keys(room.memory.mission[range]).length
  room.visual.text(
    `房间任务数:${MissionNum}`,
    0, row += 1,
    { color: MissionNum > 0 ? '#008B8B' : 'black', font: 0.7, align: 'left' })

  // 仓库剩余容量
  const storage = room.memory.structureIdData?.storageID ? Game.getObjectById(room.memory.structureIdData.storageID) : null
  if (storage) {
    const num = Math.ceil(storage.store.getFreeCapacity() / 1000)
    let color: string
    if (num <= 50)
      color = '#B22222'
    else if (num > 50 && num <= 200)
      color = '#FF8C00'
    else if (num > 200 && num <= 400)
      color = '#006400'
    else color = '#4682B4'
    room.visual.text(
      `仓库剩余容量:${num}K`,
      0, row += 1,
      { color, font: 0.7, align: 'left' })
  }

  if (room.controller && room.controller.level >= 8) {
    if (room.memory.productData.producing) {
      room.visual.text(
        `工厂生产:${room.memory.productData.producing.com}`,
        0, row += 1,
        { color: 'black', font: 0.7, align: 'left' })
    }
    if (room.memory.comDispatchData && Object.keys(room.memory.comDispatchData).length > 0) {
      room.visual.text(
        `合成规划:${Object.keys(room.memory.comDispatchData)[Object.keys(room.memory.comDispatchData).length - 1]}`,
        0, row += 1,
        { color: 'black', font: 0.7, align: 'left' })
    }
  }

  // lab 资源可视化
  if (room.memory.roomLabBind && Object.keys(room.memory.roomLabBind).length > 0) {
    for (const i in room.memory.roomLabBind) {
      const lab = Game.getObjectById(i as Id<StructureLab>)
      if (!lab) {
        delete room.memory.roomLabBind[i]
        if (room.memory.structureIdData?.labs)
          room.memory.structureIdData.labs.splice(room.memory.structureIdData.labs.indexOf(i as Id<StructureLab>), 1)
        continue
      }

      room.visual.text(
        `${room.memory.roomLabBind[i].rType}`,
        lab.pos.x, lab.pos.y,
        { color: compoundColor[room.memory.roomLabBind[i].rType as keyof typeof compoundColor], font: 0.3, align: 'center', strokeWidth: 0.2 })
    }
  }
}
