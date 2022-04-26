import { colorfyLog } from '@/utils'

export default {
  // 绕过房间api
  bypass: {
    /**
     * 添加要绕过的房间
     */
    add(roomName: string): string {
      if (!Memory.bypassRooms)
        Memory.bypassRooms = []

      if (!Memory.bypassRooms.includes(roomName))
        Memory.bypassRooms.push(roomName)

      return `[bypass] 已添加绕过房间 ${roomName}\n${this.ls()}`
    },
    ls(): string {
      if (!Memory.bypassRooms || Memory.bypassRooms.length <= 0)
        return '[bypass] 当前无绕过房间'
      return `[bypass] 当前绕过房间列表: ${Memory.bypassRooms.join(' ')}`
    },
    clean(): string {
      delete Memory.bypassRooms
      return '[bypass] 已清空绕过房间列表'
    },
    rm(roomName: string): string {
      if (!Memory.bypassRooms)
        Memory.bypassRooms = []

      if (!roomName) {
        delete Memory.bypassRooms
      }
      else {
        Memory.bypassRooms = Memory.bypassRooms.filter(r => r !== roomName)
        if (!Memory.bypassRooms.length)
          delete Memory.bypassRooms
      }

      return `[bypass] 已移除绕过房间 ${roomName}`
    },
  },
  /**
   * 白名单 api
   */
  wl: {
    add(username: string): string {
      if (!Memory.whitelist)
        Memory.whitelist = []

      if (!Memory.whitelist.includes(username))
        Memory.whitelist.push(username)

      return `[whitesheet] 已添加用户 ${username} 进白名单！\n${this.ls()}`
    },
    ls(): string {
      if (!Memory.whitelist || Memory.whitelist.length <= 0)
        return '[whitesheet] 当前白名单为空！'
      return `[whitesheet] 白名单列表：${Memory.whitelist.join(' ')}`
    },
    clean(): string {
      delete Memory.whitelist
      return '[whitesheet] 当前白名单已清空'
    },
    rm(username: string): string {
      if (!Memory.whitelist)
        Memory.whitelist = []

      if (!username) {
        delete Memory.whitelist
      }
      else {
        Memory.whitelist = Memory.whitelist.filter(r => r !== username)
        if (!Memory.whitelist.length)
          delete Memory.whitelist
      }

      return `[whitesheet] 已移除 ${username} 出白名单`
    },
  },
  frame: {
    /**
     * 添加控制某房间 [添加了房间才会运行代码]
     */
    add(roomName: string, plan: 'man' | 'dev', x: number, y: number): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[frame] 不存在房间 ${roomName}`

      Memory.roomControlData[roomName] = { arrange: plan, center: [x, y] }

      return `[frame] 房间 ${roomName} 加入房间控制列表，布局 ${plan}，中心点 [${x},${y}]`
    },
    /**
     * 移除本代码对某房间的控制
     */
    rm(roomName: string): string {
      delete Memory.roomControlData[roomName]
      return `[frame] 删除房间 ${roomName} 出房间控制列表`
    },
    /**
     * 删除某房间的建筑
     */
    del(roomName: string, x: number, y: number, type: BuildableStructureConstant): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[frame] 未找到房间 ${roomName}，请确认房间!`

      const thisPosition = new RoomPosition(x, y, roomName)
      if (thisPosition.getStructureWithType(type)) {
        myRoom.unbindMemory(type, x, y)
        return `[frame] 房间 ${roomName} 已经执行 delStructure 命令!`
      }
      else {
        const cons = thisPosition.lookFor(LOOK_CONSTRUCTION_SITES)
        if (cons.length > 0 && cons[0].structureType === type) {
          myRoom.unbindMemory(type, x, y)
          return `[frame] 房间 ${roomName} 已经执行 delStructure 命令!`
        }
      }
      return `[frame] 房间 ${roomName} 未找到相应建筑!`
    },
    /**
     * 查询任务
     */
    task(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[frame] 未找到房间 ${roomName}，请确认房间!`

      let result = `[frame] 房间 ${roomName} 任务数据如下:\n`
      for (const category in myRoom.memory.mission) {
        if (Object.keys(myRoom.memory.mission[category]).length <= 0) {
          result += `  不存在 ${category} 类任务\n`
        }
        else {
          result += `  [${category}]\n`
          for (const i of myRoom.memory.mission[category]) {
            result += `    ${i.name} | 超时: ${i.delayTick}, ID: ${i.id}, `
            if (i.data) {
              if (i.data.disRoom)
                result += `目标房间: ${i.data.disRoom}, `
              if (i.data.rType)
                result += `rType: ${i.data.rType}, `
              if (i.data.num)
                result += `num: ${i.data.num}, `
            }
            result += '\n'
          }
        }
      }
      return result
    },
    /**
     * 经济模式 （不再升级）
     */
    eco(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[frame] 未找到房间 ${roomName},请确认房间!`

      myRoom.memory.economy = !myRoom.memory.economy
      if (!myRoom.memory.economy)
        myRoom.memory.spawnConfig.upgrade.num = 1

      return `[frame] 房间 ${roomName} 的 economy 选项改为 ${myRoom.memory.economy}`
    },
  },
  spawn: {
    num(roomName: string, role: string, num: number): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[spawn] 不存在房间 ${roomName}`

      const roleConfig = thisRoom.memory.spawnConfig[role]
      if (roleConfig) {
        roleConfig.num = num
        return `[spawn] 房间 ${roomName} 的 ${role} 数量信息修改为 ${num}`
      }

      return `[spawn] 房间 ${roomName} 的 ${role} 数量信息修改失败`
    },
    /**
     * 修改某任务爬虫绑定数据的 num
     */
    Mnum(roomName: string, id: string, role: string, num: number): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[spawn] 不存在房间 ${roomName}`

      const mission = thisRoom.getMissionById(id)
      if (mission?.creepBind?.[role]) {
        mission.creepBind[role].num = num
        return `[spawn] 任务 ${mission.name}<id:${id}> 的 ${role} 数量信息修改为 ${num}`
      }

      return `[spawn] 任务 ${id} 的 ${role} 数量信息修改失败`
    },
    /**
     * 只对任务爬虫的定时孵化有效
     */
    restart(roomName: string, id: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[spawn] 不存在房间 ${roomName}`

      const mission = thisRoom.getMissionById(id)
      if (mission) {
        delete mission.data.intervalTime
        return `[spawn] 任务 ${mission.name}<id:${id}> 孵化信息已经初始化!`
      }

      return `[spawn] 找不到 id 为 ${id} 的任务!`
    },
  },
  link: {
    consume(roomName: string, id: Id<StructureLink>): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[link] 不存在房间 ${roomName}`

      if (thisRoom.memory.structureIdData?.sourceLinks?.includes(id))
        return '[link] id 错误，不能为 sourceLink'

      if (thisRoom.memory.structureIdData?.centerLink === id
         || thisRoom.memory.structureIdData?.upgradeLink === id)
        return '[link] id 错误，不能为 centerLink/upgradeLink'

      if (!thisRoom.memory.structureIdData?.consumeLink?.includes(id)) {
        if (!thisRoom.memory.structureIdData)
          thisRoom.memory.structureIdData = {}
        if (!thisRoom.memory.structureIdData.consumeLink)
          thisRoom.memory.structureIdData.consumeLink = []
        thisRoom.memory.structureIdData.consumeLink.push(id)
      }

      return colorfyLog(`[link] 房间 ${roomName} 中 id 为 ${id} 的 link 已加入 consumeLink 列表中`, 'green', true)
    },
  },
  debug: {
    ResourceDispatch(roomName: string, rType: ResourceConstant, num: number, mtype: 'deal'|'order', buy = false): string {
      const dispatchTask: RDData = {
        sourceRoom: roomName,
        rType,
        num,
        delayTick: 300,
        conditionTick: 20,
        buy,
        mtype,
      }
      Memory.resourceDispatchData.push(dispatchTask)
      return `[debug] 资源调度任务发布, 房间 ${roomName}, 资源类型 ${rType}, 数量 ${num}, 支持购买: ${buy}, 默认超时300T`
    },
    ResourceBuy(roomName: string, rType: ResourceConstant, num: number, range: number, max = 35): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[link] 不存在房间 ${roomName}`

      const task = thisRoom.generateBuyMission(rType, num, range, max)
      if (task && thisRoom.addMission(task))
        return colorfyLog(`[debug] 资源购买任务发布, 房间 ${roomName}, 资源类型 ${rType}, 数量 ${num}, 价格范围 ${range}, 最高价格 ${max}`, 'blue')

      return colorfyLog(`[debug] 房间 ${roomName} 资源购买任务发布失败!`, 'yellow')
    },
  },
  dispatch: {
    limit(roomName: string): string {
      const myRoom = Game.rooms[roomName]
      if (!myRoom)
        return `[dispatch] 未找到房间 ${roomName}，请确认房间!`

      let result = `[dispatch] 房间 ${roomName} 的 ResourceLimit 信息如下:\n`
      const data = global.resourceLimit[roomName]
      if (Object.keys(data).length <= 0)
        return `[dispatch] 房间 ${roomName} 没有 ResourceLimit 信息!`
      for (const i of Object.keys(data) as ResourceConstant[])
        result += `  [${i}]: ${data[i]}\n`
      return result
    },
  },
}
