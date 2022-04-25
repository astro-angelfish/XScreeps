import { randomSign } from '@/room/constant/rockyou'
import { colorfyLog } from '@/utils'

export default {
  // 修墙
  repair: {
    set(roomName: string, rtype: 'global' | 'special', num: number, boost?: ResourceConstant, level?: 'T0' | 'T1' | 'T2'): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[repair] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '墙体维护' && i.data.RepairType === rtype)
          return `[repair] 房间 ${roomName} 已经存在类型为 ${rtype} 的刷墙任务了`
      }

      const thisTask = thisRoom.generateRepairMission(rtype, num, boost, level || 'T0')
      if (thisTask && thisRoom.addMission(thisTask))
        return `[repair] 房间 ${roomName} 挂载类型为 ${rtype} 刷墙任务成功`
      return `[repair] 房间 ${roomName} 挂载类型为 ${rtype} 刷墙任务失败`
    },
    rm(roomName: string, Rtype: 'global' | 'special'): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[repair] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '墙体维护' && i.data.RepairType === Rtype) {
          if (thisRoom.removeMission(i.id))
            return `[repair] 房间 ${roomName} 删除类型为 ${Rtype} 刷墙任务成功`
        }
      }

      return `[repair] 房间 ${roomName} 删除类型为 ${Rtype} 刷墙任务失败!`
    },
  },
  // 特殊计划 不在 manual 里显示
  plan: {
    // C计划
    C(roomName: string, disRoom: string, Cnum: number, Unum: number, shard: string = Game.shard.name): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[plan] 不存在房间 ${roomName}`

      const task = thisRoom.generatePlanCMission(disRoom, Cnum, Unum, shard)
      if (thisRoom.addMission(task))
        return colorfyLog(`[plan] 房间 ${roomName} 挂载C计划成功 -> ${disRoom}`, 'green')
      return colorfyLog(`[plan] 房间 ${roomName} 挂载C计划失败 -> ${disRoom}`, 'red')
    },
    CC(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[plan] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === 'C计划') {
          if (thisRoom.removeMission(i.id))
            return colorfyLog(`[plan] 房间 ${roomName} 删除C计划成功`, 'green')
        }
      }

      return colorfyLog(`[plan] 房间 ${roomName} 删除C计划失败`, 'red')
    },
    // Z计划
    Z(roomName: string, disRoom: string, num: number): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[plan] 不存在房间 ${roomName}`

      // 查看资源是否足够
      if (!thisRoom.memory.structureIdData?.terminalID || !thisRoom.memory.structureIdData.storageID)
        return colorfyLog(`[plan] 房间 ${roomName} 没有终端或者仓库`, 'red', true)
      const terminal = Game.getObjectById(thisRoom.memory.structureIdData.terminalID)
      const storage = Game.getObjectById(thisRoom.memory.structureIdData.storageID)
      if (!terminal || !storage) {
        delete thisRoom.memory.structureIdData.terminalID
        delete thisRoom.memory.structureIdData.storageID
        return colorfyLog(`[terminal] 房间 ${roomName} 不存在终端/仓房或记忆未更新！`, 'red', true)
      }

      const thisTask = thisRoom.generateSendMission(disRoom, 'Z', num)

      // 查询其他资源传送任务中是否有一样的资源
      let zNum = 0
      if (!thisRoom.memory.mission.Structure)
        thisRoom.memory.mission.Structure = []
      for (const tM of thisRoom.memory.mission.Structure) {
        if (tM.name === '资源传送' && tM.data.rType === 'Z')
          zNum += tM.data.num
      }

      // 计算资源是否满足
      if (terminal.store.getUsedCapacity('Z') + storage.store.getUsedCapacity('Z') - zNum < num)
        return colorfyLog(`[plan] 房间 ${roomName} 资源${'Z'} 数量总合少于 ${num}，Z计划挂载失败!`, 'yellow', true)

      // 计算路费
      const cost = Game.market.calcTransactionCost(num, roomName, disRoom)
      if (terminal.store.getUsedCapacity('energy') + storage.store.getUsedCapacity('energy') < cost || cost > 150000)
        return colorfyLog(`[plan] 房间 ${roomName} --> ${disRoom} 资源${'Z'}所需路费少于 ${cost} 或大于150000，传送任务挂载失败！`, 'yellow', true)

      if (thisTask && thisRoom.addMission(thisTask))
        return colorfyLog(`[plan] 房间 ${roomName} --> ${disRoom} 资源${'Z'}传送挂载成功！数量：${num}；路费：${cost}`, 'green', true)
      return colorfyLog(`[plan] 房间 ${roomName} --> ${disRoom} 资源${'Z'}传送 不明原因挂载失败！`, 'red', true)
    },
  },
  // 扩张
  expand: {
    set(roomName: string, disRoom: string, shard: string, num: number, Cnum = 1, shardData?: shardRoomData[]): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[expand] 不存在房间${roomName}`

      const task = thisRoom.generateExpandMission(disRoom, shard, num, Cnum)
      if (task) {
        if (shardData)
          task.data.shardData = shardData
        if (thisRoom.addMission(task))
          return colorfyLog(`[expand] 房间 ${roomName} 挂载扩张援建计划成功 -(${shard})-> ${disRoom}`, 'green')
      }
      return colorfyLog(`[expand] 房间 ${roomName} 挂载扩张援建计划失败 -(${shard})-> ${disRoom}`, 'red')
    },
    rm(roomName: string, disRoom: string, shard: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[expand] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '扩张援建' && i.data.disRoom === disRoom) {
          if (thisRoom.removeMission(i.id))
            return colorfyLog(`[expand] 房间 ${roomName} 删除去往 ${disRoom}(${shard}) 的扩张援建任务成功`, 'green')
        }
      }
      return colorfyLog(`[expand] 房间 ${roomName} 删除去往 ${disRoom}(${shard}) 的扩张援建任务失败`, 'red')
    },
  },
  /* 战争 */
  war: {
    dismantle(roomName: string, disRoom: string, shard: string, num: number, interval = 1000, boost?: boolean, shardData?: shardRoomData[]): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[war] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '黄球拆迁' && i.data.disRoom === disRoom && i.data.shard === shard)
          return `[war] 房间 ${roomName} 已经存在去往 ${disRoom}(${shard}) 的该类型任务了!`
      }

      const task = thisRoom.generateDismantleMission(disRoom, shard, num, interval, boost)
      if (task) {
        if (shardData)
          task.data.shardData = shardData
        if (thisRoom.addMission(task))
          return colorfyLog(`[war] 房间 ${roomName} 挂载拆迁任务成功 -> ${disRoom}`, 'green')
      }
      return colorfyLog(`[war] 房间 ${roomName} 挂载拆迁任务失败 -> ${disRoom}`, 'red')
    },
    Cdismantle(roomName: string, disRoom: string, shard: string = Game.shard.name): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[war] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '黄球拆迁' && i.data.disRoom === disRoom && i.data.shard === shard) {
          if (thisRoom.removeMission(i.id))
            return colorfyLog(`[plan] 房间 ${roomName} 删除拆迁任务成功`, 'green')
        }
      }
      return colorfyLog(`[war] 房间 ${roomName} 删除拆迁任务失败`, 'red')
    },
    support(roomName: string, disRoom: string, shard: string, sType: 'double' | 'aio', num: number, interval = 1000, boost = true, shardData?: shardRoomData[]): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[war] 不存在房间 ${roomName}`

      for (const oi of thisRoom.memory.mission.Creep) {
        if (oi.name === '紧急支援' && oi.data.disRoom === disRoom && oi.data.shard === shard)
          return `[war] 房间 ${roomName} 已经存在去往 ${disRoom}(${shard}) 的该类型任务了!`
      }

      const task = thisRoom.generateSupportMission(disRoom, sType, shard, num, boost)
      if (task) {
        if (shardData)
          task.data.shardData = shardData
        for (const i in task.creepBind)
          task.creepBind[i].interval = interval
      }
      if (thisRoom.addMission(task))
        return colorfyLog(`[war] 房间 ${roomName} 挂载紧急支援任务成功 -(${shard})-> ${disRoom}，类型为 ${sType}，数量为 ${num}，间隔时间 ${interval}`, 'green')
      return colorfyLog(`[war] 房间 ${roomName} 挂载紧急支援任务失败 -(${shard})-> ${disRoom}`, 'red')
    },
    Csupport(roomName: string, disRoom: string, shard: string, rType: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[war] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '紧急支援' && i.data.disRoom === disRoom && i.data.sType === rType && i.data.shard === shard) {
          if (thisRoom.removeMission(i.id))
            return colorfyLog(`[war] 房间 ${roomName}-(${shard}) -> ${disRoom} | [${rType}] 紧急支援任务删除成功`, 'green')
        }
      }
      return colorfyLog(`[war] 房间 ${roomName}-(${shard}) -> ${disRoom} | [${rType}] 紧急支援任务删除失败`, 'red')
    },
    control(roomName: string, disRoom: string, shard: string = Game.shard.name, interval: number, shardData?: shardRoomData[]): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[war] 不存在房间 ${roomName}`

      for (const oi of thisRoom.memory.mission.Creep) {
        if (oi.name === '控制攻击' && oi.data.disRoom === disRoom && oi.data.shard === shard)
          return `[war] 房间 ${roomName} 已经存在去往 ${disRoom}(${shard}) 的该类型任务了!`
      }

      const task = thisRoom.generateControlMission(disRoom, shard, interval)
      if (task) {
        if (shardData)
          task.data.shardData = shardData
        if (thisRoom.addMission(task))
          return colorfyLog(`[war] 房间 ${roomName} 挂载控制攻击任务成功 -> ${disRoom}`, 'green')
      }
      return colorfyLog(`[war] 房间 ${roomName} 挂载控制攻击任务失败 -> ${disRoom}`, 'red')
    },
    Ccontrol(roomName: string, disRoom: string, shard: string = Game.shard.name): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[war] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '控制攻击' && i.data.disRoom === disRoom && i.data.shard === shard) {
          if (thisRoom.removeMission(i.id))
            return colorfyLog(`[war] 房间 ${roomName} 控制攻击任务成功`, 'green')
        }
      }
      return colorfyLog(`[war] 房间 ${roomName} 控制攻击任务失败`, 'red')
    },
    aio(roomName: string, disRoom: string, shard: string, CreepNum: number, time = 1000, boost = true, bodylevel: 'T0' | 'T0' | 'T2' = 'T0', shardData?: shardRoomData[]): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[war] 未找到房间 ${roomName}，请确认房间!`

      for (const oi of myRoom.memory.mission.Creep) {
        if (oi.name === '攻防一体' && oi.data.disRoom === disRoom && oi.data.shard === shard)
          return `[war] 房间 ${roomName} 已经存在去往 ${disRoom}(${shard}) 的该类型任务了!`
      }

      const thisTask = myRoom.generateAioMission(disRoom, shard, CreepNum, time, boost, bodylevel)
      if (thisTask) {
        if (shardData)
          thisTask.data.shardData = shardData
        if (myRoom.addMission(thisTask))
          return `[war] 攻防一体任务挂载成功! ${Game.shard.name}/${roomName} -> ${shard}/${disRoom} 体型等级:${bodylevel}`
      }
      return '[war] 攻防一体挂载失败!'
    },
    Caio(roomName: string, disRoom: string, shard: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[support] 未找到房间 ${roomName}，请确认房间!`

      for (const i of myRoom.memory.mission.Creep) {
        if (i.name === '攻防一体' && i.data.disRoom === disRoom && i.data.shard === shard) {
          if (myRoom.removeMission(i.id))
            return `[war] 删除去往 ${shard}/${disRoom} 的攻防一体任务成功!`
        }
      }
      return `[war] 删除去往 ${shard}/${disRoom} 的攻防一体任务失败!`
    },
    squad(roomName: string, disRoom: string, shard: string, mtype: 'R' | 'A' | 'D' | 'Aio' | 'RA' | 'DA' | 'DR', time = 1000, shardData?: shardRoomData[]): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[war] 未找到房间 ${roomName}，请确认房间!`

      for (const oi of myRoom.memory.mission.Creep) {
        if (oi.name === '四人小队' && oi.data.disRoom === disRoom && oi.data.shard === shard && oi.data.flag === mtype)
          return `[war] 房间 ${roomName} 已经存在去往 ${disRoom}(${shard}) 的 <${mtype}> 四人小队任务了!`
      }
      let thisTask: Omit<MissionModel, 'id'> | null
      if (mtype === 'R')
        thisTask = myRoom.generateSquadMission(disRoom, shard, time, 2, 0, 0, 2, 0, mtype)
      else if (mtype === 'A')
        thisTask = myRoom.generateSquadMission(disRoom, shard, time, 0, 2, 0, 2, 0, mtype)
      else if (mtype === 'D')
        thisTask = myRoom.generateSquadMission(disRoom, shard, time, 0, 0, 2, 2, 0, mtype)
      else if (mtype === 'Aio')
        thisTask = myRoom.generateSquadMission(disRoom, shard, time, 0, 0, 0, 0, 4, mtype)
      else if (mtype === 'RA')
        thisTask = myRoom.generateSquadMission(disRoom, shard, time, 1, 1, 0, 2, 0, mtype)
      else if (mtype === 'DA')
        thisTask = myRoom.generateSquadMission(disRoom, shard, time, 0, 1, 1, 2, 0, mtype)
      else if (mtype === 'DR')
        thisTask = myRoom.generateSquadMission(disRoom, shard, time, 1, 0, 1, 2, 0, mtype)
      else return '[war] 无效的任务类型!'

      if (thisTask) {
        if (shardData)
          thisTask.data.shardData = shardData
        if (myRoom.addMission(thisTask))
          return `[war] 四人小队任务挂载成功! ${Game.shard.name}/${roomName} -> ${shard}/${disRoom}`
      }
      return '[war] 四人小队挂载失败!'
    },
    Csquad(roomName: string, disRoom: string, shard: string, mtype: 'R' | 'A' | 'D' | 'Aio' | 'RA' | 'DA' | 'DR'): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[war] 未找到房间 ${roomName}，请确认房间!`

      for (const i of myRoom.memory.mission.Creep) {
        if (i.name === '四人小队' && i.data.disRoom === disRoom && i.data.shard === shard && i.data.flag === mtype) {
          if (myRoom.removeMission(i.id))
            return `[war] 删除去往 ${shard}/${disRoom} 的四人小队任务成功!`
        }
      }
      return `[war] 删除去往 ${shard}/${disRoom} 的四人小队任务失败!`
    },
    double(roomName: string, disRoom: string, shard: string = Game.shard.name, mType: 'dismantle' | 'attack', num: number, interval: number, shardData?: shardRoomData[]): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[war] 不存在房间 ${roomName}`

      for (const oi of thisRoom.memory.mission.Creep) {
        if (oi.name === '双人小队' && oi.data.disRoom === disRoom && oi.data.shard === shard)
          return `[war] 房间 ${roomName} 已经存在去往 ${disRoom}(${shard}) 的该类型任务了!`
      }

      const thisTask = thisRoom.generateDoubleMission(disRoom, shard, num, mType, interval)
      if (thisTask) {
        if (shardData)
          thisTask.data.shardData = shardData
        thisTask.maxConcurrent = 2
        if (thisRoom.addMission(thisTask))
          return `[war] 双人小队 ${roomName} -> ${disRoom} 的 ${mType} 任务挂载成功！`
      }
      return `[war] 双人小队 ${roomName} -(${shard})-> ${disRoom} 的 ${mType} 任务挂载失败！`
    },
    Cdouble(roomName: string, disRoom: string, shard: string, mType: 'dismantle'|'attack'): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[war] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '双人小队' && i.data.disRoom === disRoom && i.data.teamType === mType && i.data.shard === shard) {
          if (thisRoom.removeMission(i.id))
            return `[war] 双人小队 ${roomName} -(${shard})-> ${disRoom} 的 ${mType} 任务删除成功！`
        }
      }
      return `[war] 双人小队 ${roomName} -(${shard})-> ${disRoom} 的 ${mType} 任务删除失败！`
    },
  },
  // 升级
  upgrade: {
    quick(roomName: string, num: number, boostType?: ResourceConstant): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[upgrade] 不存在房间 ${roomName}`

      const thisTask = thisRoom.generateQuickMission(num, boostType)
      if (thisTask && thisRoom.addMission(thisTask))
        return `[upgrade] 房间 ${roomName} 挂载急速冲级任务成功`
      return `[upgrade] 房间 ${roomName} 挂载急速冲级任务失败`
    },
    Cquick(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[repair] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '急速冲级') {
          if (thisRoom.removeMission(i.id))
            return `[upgrade] 房间 ${roomName} 删除急速冲级任务成功`
        }
      }
      return `[upgrade] 房间 ${roomName} 删除急速冲级任务失败!`
    },
    Nquick(roomName: string, num: number): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[repair] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '急速冲级' && i.creepBind) {
          i.creepBind.rush.num = num
          return `[upgrade] 房间 ${roomName} 急速冲级任务数量修改为 ${num}`
        }
      }
      return `[upgrade] 房间 ${roomName} 修改急速冲级任务数量失败!`
    },
  },
  // 搬运
  carry: {
    special(roomName: string, res: ResourceConstant, sP: RoomPosition, dP: RoomPosition, CreepNum?: number, ResNum?: number): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[carry] 不存在房间 ${roomName}`

      const time = ResNum ? 99999 : 30000
      const thisTask = thisRoom.generateCarryMission(
        { truck: { num: CreepNum || 1, bind: [] } },
        time,
        sP.roomName, sP.x, sP.y,
        dP.roomName, dP.x, dP.y,
        res, ResNum)
      if (thisRoom.addMission(thisTask))
        return `[carry] 房间 ${roomName} 挂载 special 搬运任务成功`
      return `[carry] 房间 ${roomName} 挂载 special 搬运任务失败`
    },
    Cspecial(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[carry] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '物流运输' && i.creepBind?.truck && i.data.rType) {
          if (thisRoom.removeMission(i.id))
            return `[carry] 房间 ${roomName} 删除 special 搬运任务成功`
        }
      }
      return `[carry] 房间 ${roomName} 删除 special 搬运任务失败`
    },
  },
  // 支援
  support: {
    // 紧急援建
    build(roomName: string, disRoom: string, shard: string = Game.shard.name, num: number, interval: number, defend = false, shardData?: shardRoomData[]): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[support] 不存在房间 ${roomName}`

      const task = thisRoom.generateHelpBuildMission(disRoom, num, shard, interval, defend)
      if (task) {
        if (shardData)
          task.data.shardData = shardData
        if (thisRoom.addMission(task))
          return colorfyLog(`[support] 房间 ${roomName} 挂载紧急援建任务成功 -> ${disRoom}`, 'green')
      }
      return colorfyLog(`[support] 房间 ${roomName} 挂载紧急援建任务失败 -> ${disRoom}`, 'red')
    },
    Cbuild(roomName: string, disRoom: string, shard: string = Game.shard.name): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[support] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '紧急援建' && i.data.disRoom === disRoom && i.data.shard === shard) {
          if (thisRoom.removeMission(i.id))
            return colorfyLog(`[support] 房间 ${roomName} 紧急援建任务成功`, 'green')
        }
      }
      return colorfyLog(`[support] 房间 ${roomName} 紧急援建任务失败`, 'red')
    },
  },
  // 核弹相关
  nuke: {
    // 发射核弹
    launch(roomName: string, disRoom: string, x_: number, y_: number): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[nuke] 房间错误，请确认房间 ${roomName}！`

      if (!myRoom.memory.structureIdData?.nukerID)
        return `[nuke] 房间 ${roomName} 没有找到核弹发射器！`
      const nuke = Game.getObjectById(myRoom.memory.structureIdData.nukerID)
      if (!nuke)
        return '[nuke] 核弹查询错误!'

      if (nuke.launchNuke(new RoomPosition(x_, y_, disRoom)) === OK)
        return colorfyLog(`[nuke] ${roomName} -> ${disRoom} 的核弹发射成功!预计---500000---ticks后着陆!`, 'yellow', true)
      else
        return colorfyLog(`[nuke] ${roomName} -> ${disRoom} 的核弹发射失败!`, 'yellow', true)
    },
    // 自动填充核弹开关
    toggle(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[nuke] 房间错误，请确认房间 ${roomName}！`

      myRoom.memory.toggles.StopFillNuker = !myRoom.memory.toggles.StopFillNuker

      if (myRoom.memory.toggles.StopFillNuker)
        return `[nuke] 房间 ${roomName} 停止自动核弹填充!`
      return `[nuke] 房间 ${roomName} 开启自动核弹填充!`
    },
  },
  // 斥候 签名 侦察
  scout: {
    sign(roomName: string, disRoom: string, shard: string, str: string, shardData?: shardRoomData[]): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[scout] 不存在房间${roomName}`

      const task = thisRoom.generateSignMission(disRoom, shard, str)
      if (shardData)
        task.data.shardData = shardData
      if (!task)
        return '[scout] 任务对象生成失败'

      if (thisRoom.addMission(task))
        return colorfyLog(`[scout] 房间 ${roomName} 挂载房间签名任务成功 -> ${disRoom}`, 'green')
      return colorfyLog(`[scout] 房间 ${roomName} 挂载房间签名任务失败 -> ${disRoom}`, 'red')
    },
    Csign(roomName: string, disRoom: string, shard: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[scout] 不存在房间 ${roomName}`

      for (const i of thisRoom.memory.mission.Creep) {
        if (i.name === '房间签名' && i.data.disRoom === disRoom && i.data.shard === shard) {
          if (thisRoom.removeMission(i.id))
            return colorfyLog(`[scout] 房间 ${roomName} 房间签名任务成功`, 'green')
        }
      }
      return colorfyLog(`[scout] 房间 ${roomName} 房间签名任务失败`, 'red')
    },
    // 随机签名 手册不收录
    Rsign(roomName: string, disRoom: string, shard: string, shardData?: shardRoomData[]): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[scout] 不存在房间 ${roomName}`

      const task = thisRoom.generateSignMission(disRoom, shard, randomSign())
      if (shardData)
        task.data.shardData = shardData
      if (!task)
        return '[scout] 任务对象生成失败'

      if (thisRoom.addMission(task))
        return colorfyLog(`[scout] 房间 ${roomName} 挂载房间签名任务成功 -> ${disRoom}`, 'green')
      return colorfyLog(`[scout] 房间 ${roomName} 挂载房间签名任务失败 -> ${disRoom}`, 'red')
    },
  },
}
