import { unzipPosition, zipPosition } from '@/utils'

/* 房间原型拓展   --行为  --采矿任务 */
export default class RoomMissionMineExtension extends Room {
  /**
   * 房间内矿资源采集发布任务
   */
  public checkMineral(): void {
    if ((Game.time - global.Gtime[this.name]) % 67)
      return
    if (!this.controller || this.controller.level < 6)
      return
    if (!this.memory.structureIdData?.mineralID)
      return

    if (this.countMissionByName('Creep', '原矿开采') > 0)
      return

    const mineral = Game.getObjectById(this.memory.structureIdData.mineralID)
    if (!mineral || mineral.ticksToRegeneration)
      return

    if (!this.memory.mineralType)
      this.memory.mineralType = mineral.mineralType

    // 寻找矿物点 在其附近撒下建筑
    if (!this.memory.structureIdData.extractorID) {
      if (!mineral.pos.getStructure('extractor')
       && mineral.pos.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0)
        mineral.pos.createConstructionSite('extractor')
      return
    }

    // 寻找 mineralContainerID
    const container = mineral.pos.getStructure(STRUCTURE_CONTAINER)
    const containerSite = mineral.pos.lookFor(LOOK_CONSTRUCTION_SITES)
      .filter(s => s.structureType === STRUCTURE_CONTAINER)[0]
    if (!container && !containerSite) {
      // 建立 container
      const result: RoomPosition[] = []
      const terrain = new Room.Terrain(this.name)
      for (let x = mineral.pos.x - 1; x <= mineral.pos.x + 1; x++) {
        for (let y = mineral.pos.y - 1; y <= mineral.pos.y + 1; y++) {
          if (terrain.get(x, y) !== TERRAIN_MASK_WALL)
            result.push(new RoomPosition(x, y, this.name))
        }
      }
      for (const p of result) {
        if (p.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0
         && p.lookFor(LOOK_STRUCTURES).length <= 0) {
          p.createConstructionSite('container')
          break
        }
      }

      return
    }
    if (!container)
      return

    // 建筑都到位了，开始下任务
    const storage = this.memory.structureIdData.storageID ? Game.getObjectById(this.memory.structureIdData.storageID) : null
    if (!storage)
      return

    // 如果矿物饱和，挂任务卖原矿
    if (storage.store.getUsedCapacity(this.memory.mineralType) > 200000) {
      if (!this.memory.market)
        this.memory.market = {}
      if (!this.memory.market.deal)
        this.memory.market.deal = []

      let bR = true
      for (const od of this.memory.market.deal) {
        if (od.rType === this.memory.mineralType)
          bR = false
      }

      // 下达自动deal的任务
      if (bR)
        this.memory.market.deal.push({ rType: this.memory.mineralType, num: 30000 })
    }

    // 防止挖矿致死
    if (storage.store.getFreeCapacity() > 200000
     && storage.store.getUsedCapacity(this.memory.mineralType) < 200000) {
      // 下达挖矿任务
      const thisTask: Omit<MissionModel, 'id'> = {
        name: '原矿开采',
        category: 'Creep',
        delayTick: 50000,
        level: 10,
        creepBind: {
          mineral: { num: 1, bind: [] },
        },
        data: {
        },
      }
      this.addMission(thisTask)
    }
  }

  /**
   * 房间外矿处理任务 只适用于一般外矿
   */
  public verifyOutMineMission(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 13)
      return

    // 默认状态1
    if (!mission.data.state)
      mission.data.state = 1

    if (!mission.creepBind) {
      Game.notify(`外矿任务未绑定角色，删除外矿任务！${JSON.stringify(mission)}`)
      this.removeMission(mission.id)
      return
    }

    mission.creepBind['out-claim'].num = 1

    const disRoomName = mission.data.disRoom
    if (!Memory.outMineData[disRoomName]) {
      Memory.outMineData[disRoomName] = {
        road: [],
        startpoint: mission.data.startpoint,
        minepoint: [],
        mineType: 'normal',
      }
    }

    // 相关爬虫死亡后的数据擦除
    if (Memory.outMineData[disRoomName].minepoint
     && Memory.outMineData[disRoomName].minepoint.length > 0) {
      for (const obj of Memory.outMineData[disRoomName].minepoint) {
        if (obj.bind && obj.bind.harvest && !Game.creeps[obj.bind.harvest])
          delete obj.bind.harvest
        if (obj.bind && obj.bind.car && !Game.creeps[obj.bind.car])
          delete obj.bind.car
      }
    }

    // 初始化状态
    if (mission.data.state === 1) {
      // 状态1下仅仅获取外矿信息和派出 claimer
      if (Game.rooms[disRoomName]) {
        const sources = Game.rooms[disRoomName].find(FIND_SOURCES)
        if (sources.length <= 0) {
          Game.notify(`房间 ${disRoomName} 未发现能量点！删除外矿任务！`)
          this.removeMission(mission.id)
          return
        }

        // 说明有该房间的视野了 先查找矿点
        if (Memory.outMineData[disRoomName].minepoint.length < sources.length) {
          for (const s of sources) {
            const zipedPos = zipPosition(s.pos)
            if (Memory.outMineData[disRoomName].minepoint.some(m => m.pos === zipedPos))
              continue

            Memory.outMineData[disRoomName].minepoint.push({ pos: zipedPos, bind: {} })
          }
          return
        }

        // 矿点信息更新完毕了 接下来更新路线信息
        if (!mission.data.roadUpdated) {
          const startpos = unzipPosition(Memory.outMineData[disRoomName].startpoint)
          if (!startpos) {
            console.log(`${startpos} 不能解压成 RoomPosition 对象`)
            return
          }

          // 每个矿点都要有一个路线信息
          for (const s of sources) {
            const path = startpos.findPath(s.pos, 1)
            if (!path)
              continue
            for (const p of path) {
              if (p.isNearTo(s.pos))
                continue
              if (p.x === 0 || p.x === 49 || p.y === 0 || p.y === 49)
                continue
              // 如果不再路径点缓存中，就 push 进路径列表中
              const zipedPos = zipPosition(p)
              if (!Memory.outMineData[disRoomName].road.includes(zipedPos))
                Memory.outMineData[disRoomName].road.push(zipedPos)
            }
          }

          mission.data.roadUpdated = true

          return
        }

        // 先看路径点中是否有本房间的位置点，有的话就创建工地
        for (const mess of Memory.outMineData[disRoomName].road) {
          const pos = unzipPosition(mess)
          if (!pos)
            continue

          if (pos.getStructure(STRUCTURE_ROAD))
            continue

          if (pos.roomName === this.name)
            pos.createConstructionSite(STRUCTURE_ROAD)
        }

        // 路线信息更新完毕 接下来进入阶段2
        mission.data.state = 2
      }
    }

    // 采集状态 [正常状态]
    else if (mission.data.state === 2) {
      mission.creepBind['out-harvest'].num = Memory.outMineData[disRoomName].minepoint.length
      mission.creepBind['out-defend'].num = 0
      if (Memory.outMineData[disRoomName].car)
        mission.creepBind['out-car'].num = Memory.outMineData[disRoomName].minepoint.length
      else mission.creepBind['out-car'].num = 0
    }

    // 防御状态
    else if (mission.data.state === 3) {
      mission.creepBind['out-harvest'].num = 0
      mission.creepBind['out-car'].num = 0
      mission.creepBind['out-defend'].num = 2

      if (Game.rooms[mission.data.disRoom]) {
        const enemys = Game.rooms[mission.data.disRoom].find(FIND_HOSTILE_CREEPS)
          .filter(creep => !Memory.whitelist?.includes(creep.owner.username))
        const InvaderCore = Game.rooms[mission.data.disRoom].getStructureWithType(STRUCTURE_INVADER_CORE)
        if (enemys.length <= 0 && InvaderCore.length <= 0)
          mission.data.state = 2
      }
    }
  }

  /**
   * 过道采集监控发布任务
   */
  public verifyCrossMission(mission: MissionModel): void {
    if (!this.controller || this.controller.level < 8 || !this.memory.structureIdData?.observerID)
      return
    if (this.memory.toggles.StopCross)
      return

    const observer = Game.getObjectById(this.memory.structureIdData.observerID)
    if (!observer) {
      delete this.memory.structureIdData.observerID
      return
    }

    if (!mission.data.relateRooms)
      mission.data.relateRooms = []
    if (mission.data.relateRooms.length <= 0)
      return

    if (!mission.data.index)
      mission.data.index = 0
    if (!mission.data.state)
      mission.data.state = 1

    if (mission.data.index >= mission.data.relateRooms.length)
      mission.data.index = 0

    if (mission.data.state === 1) {
      // 观察房间
      observer.observeRoom(mission.data.relateRooms[mission.data.index])
      // console.log(`observer 正在观察房间 ${mission.data.relateRooms[mission.data.index]}`)

      // 获取上个 tick 的房间名
      let beforeRoom: string
      if (mission.data.relateRooms.length === 1) {
        beforeRoom = mission.data.relateRooms[0]
      }
      else if (mission.data.relateRooms.length > 1) {
        if (mission.data.index === 0)
          beforeRoom = mission.data.relateRooms[mission.data.relateRooms.length - 1]
        else beforeRoom = mission.data.relateRooms[mission.data.index - 1]
      }

      if (Game.rooms[beforeRoom!]) {
        // 查找 power 和 deposit
        if (mission.data.power) {
          const powerBanks = Game.rooms[beforeRoom!].getStructureWithType(STRUCTURE_POWER_BANK)
            .filter(s => s.ticksToDecay >= 3600 && s.power > 3000)
          if (powerBanks.length > 0) {
            let BR = true
            for (const i of this.memory.mission.Creep) {
              if (i.name === 'power采集' && i.data.room === beforeRoom!
               && i.data.x === powerBanks[0].pos.x && i.data.y === powerBanks[0].pos.y)
                BR = false
            }

            // 下达采集任务
            if (BR) {
              const thisTask = this.generatePowerHarvestMission(beforeRoom!, powerBanks[0].pos.x, powerBanks[0].pos.y, powerBanks[0].power)
              if (thisTask != null)
                this.addMission(thisTask)
            }
          }
        }

        if (mission.data.deposit) {
          const deposit = Game.rooms[beforeRoom!].find(FIND_DEPOSITS)
            .filter(s => s.ticksToDecay >= 3800 && s.lastCooldown < 150)
          if (deposit.length > 0) {
            let BR = true
            for (const i of this.memory.mission.Creep) {
              if (i.name === 'deposit采集' && i.data.room === beforeRoom!
               && i.data.x === deposit[0].pos.x && i.data.y === deposit[0].pos.y)
                BR = false
            }

            if (BR) {
              // 查询一下是不是已经有了该房间的采集任务了
              let have = false
              for (const dm of this.memory.mission.Creep) {
                if (dm.name === 'deposit采集' && dm.data.room === beforeRoom!)
                  have = true
              }

              // 下达采集任务
              const thisTask = this.generateDepositHarvestMission(beforeRoom!, deposit[0].pos.x, deposit[0].pos.y, deposit[0].depositType)
              if (thisTask != null && !have)
                this.addMission(thisTask)
            }
          }
        }
      }

      mission.data.index++
      if (Game.rooms[beforeRoom!] && mission.data.index === 1) {
        // console.log(Colorful("进入休息模式",'blue'))
        mission.data.time = Game.time
        mission.data.state = 2
      }
    }
    else if (mission.data.state === 2) {
      if (Game.time - mission.data.time !== 0 && (Game.time - mission.data.time) % 60 === 0)
        mission.data.state = 1
        // console.log(Colorful("进入观察模式",'blue'))
    }
  }

  /**
   * Power 采集
   */
  public verifyPowerHarvestMission(mission: MissionModel): void {
    if (!this.controller || this.controller.level < 8)
      return

    if (!mission.data.state)
      mission.data.state = 1
    if (!mission.creepBind)
      mission.creepBind = {}

    if (mission.data.state === 1) {
      mission.creepBind['power-carry'].num = 0
    }

    else if (mission.data.state === 2) {
      if (!mission.data.down)
        mission.data.down = false

      if (!mission.data.down) {
        mission.creepBind['power-carry'].num = Math.ceil(mission.data.num / 1600)
        mission.data.down = true
      }

      mission.creepBind['power-attack'].num = 0
      mission.creepBind['power-heal'].num = 0
      if (mission.creepBind['power-carry'].num === mission.creepBind['power-carry'].bind.length
       && mission.creepBind['power-carry'].num !== 0)
        mission.creepBind['power-carry'].num = 0

      if (mission.creepBind['power-attack'].bind.length <= 0
       && mission.creepBind['power-heal'].bind.length <= 0
       && mission.creepBind['power-carry'].bind.length <= 0)
        this.removeMission(mission.id)
    }
  }
}
