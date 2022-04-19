import { colorfyLog, isInArray, unzipPosition, zipPosition } from '@/utils'

/* 房间原型拓展   --行为  --采矿任务 */
export default class RoomMissionMineExtension extends Room {
  /* 房间内矿资源采集发布任务 */
  public Task_monitorMineral(): void {
    if ((Game.time - global.Gtime[this.name]) % 67)
      return
    if (this.controller.level < 6)
      return
    if (!this.memory.structureIdData.mineralID)
      return
    if (this.countMissionByName('Creep', '原矿开采') > 0)
      return
    const mineral = Game.getObjectById(this.memory.structureIdData.mineralID) as Mineral
    if (!mineral || mineral.ticksToRegeneration)
      return
    if (!this.memory.mineralType)
      this.memory.mineralType = mineral.mineralType
    if (this.controller.level >= 6 && !this.memory.structureIdData.extractorID) {
      /* 寻找矿物点 在其附近撒下建筑 */
      if (!mineral.pos.getStructure('extractor') && mineral.pos.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0) {
        mineral.pos.createConstructionSite('extractor')
        return
      }
      return
    }
    /* 寻找mineralContainerID */
    const container_ = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: (stru) => {
        return stru.structureType == 'container'
      },
    })
    const container_cons = mineral.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {
      filter: (stru) => {
        return stru.structureType == 'container'
      },
    })
    if (container_.length <= 0 && container_cons.length <= 0) {
      /* 建立container */
      const result: RoomPosition[] = []
      const terrain = new Room.Terrain(this.name)
      const xs = [mineral.pos.x - 1, mineral.pos.x, mineral.pos.x + 1]
      const ys = [mineral.pos.y - 1, mineral.pos.y, mineral.pos.y + 1]
      xs.forEach(
        x => ys.forEach(
          (y) => {
            if (terrain.get(x, y) != TERRAIN_MASK_WALL)
              result.push(new RoomPosition(x, y, this.name))
          },
        ),
      )
      for (const p of result) {
        if (p.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0 && p.lookFor(LOOK_STRUCTURES).length <= 0) {
          p.createConstructionSite('container')
          return
        }
      }
      return
    }
    if (container_.length <= 0)
      return

    /* 建筑都到位了，开始下任务 */
    const storage_ = Game.getObjectById(this.memory.structureIdData.storageID) as StructureStorage
    if (!storage_)
      return
    /* 如果矿物饱和，挂任务卖原矿 */
    if (storage_.store.getUsedCapacity(this.memory.mineralType) > 200000) {
      if (!this.memory.market)
        this.memory.market = {}
      if (!this.memory.market.deal)
        this.memory.market.deal = []
      let bR = true
      for (const od of this.memory.market.deal) {
        if (od.rType == this.memory.mineralType)
          bR = false
      }
      if (bR) {
        /* 下达自动deal的任务 */
        this.memory.market.deal.push({ rType: this.memory.mineralType, num: 30000 })
      }
    }
    /* 防止挖矿致死 */
    if (storage_.store.getFreeCapacity() > 200000 && storage_.store.getUsedCapacity(this.memory.mineralType) < 200000) {
      // 下达挖矿任务
      const thisTask: MissionModel = {
        name: '原矿开采',
        category: 'Creep',
        delayTick: 50000,
        level: 10,
        data: {
        },
      }
      thisTask.creepBind = { mineral: { num: 1, bind: [] } }
      this.addMission(thisTask)
    }
  }

  /* 房间外矿处理任务 只适用于一般外矿 */
  public Task_OutMine(mission: MissionModel): void {
    if ((Game.time - global.Gtime[this.name]) % 13)
      return
    if (!mission.data.state)
      mission.data.state = 1 // 默认状态1
    mission.creepBind['out-claim'].num = 1
    const disRoomName = mission.data.disRoom
    if (!Memory.outMineData[disRoomName])
      Memory.outMineData[disRoomName] = { road: [], startpoint: mission.data.startpoint, minepoint: [], mineType: 'normal' }
    // 相关爬虫死亡后的数据擦除
    if (Memory.outMineData[disRoomName].minepoint && Memory.outMineData[disRoomName].minepoint.length > 0) {
      for (const obj of Memory.outMineData[disRoomName].minepoint) {
        if (obj.bind && obj.bind.harvest && !Game.creeps[obj.bind.harvest])
          delete obj.bind.harvest
        if (obj.bind && obj.bind.car && !Game.creeps[obj.bind.car])
          delete obj.bind.car
      }
    }
    if (mission.data.state == 1) // 初始化状态
    {
      /* 状态1下仅仅获取外矿信息和派出claimer */
      if (Game.rooms[disRoomName]) {
        const sources = Game.rooms[disRoomName].find(FIND_SOURCES)
        if (sources.length <= 0) {
          Game.notify(`房间${disRoomName}未发现能量点！删除外矿任务！`)
          this.removeMission(mission.id)
          return
        }
        /* 说明有该房间的视野了 先查找矿点 */
        if (Memory.outMineData[disRoomName].minepoint.length < sources.length) {
          LoopS:
          for (var s of sources) {
            for (const m of Memory.outMineData[disRoomName].minepoint) {
              if (m.pos == zipPosition(s.pos))
                continue LoopS
            }
            Memory.outMineData[disRoomName].minepoint.push({ pos: zipPosition(s.pos), bind: {} })
          }
          return
        }
        /* 矿点信息更新完毕了 接下来更新路线信息 */
        if (!mission.data.roadUpdated) {
          const startpos = unzipPosition(Memory.outMineData[disRoomName].startpoint)
          if (!startpos) { console.log(`${startpos}不能解压成RoomPosition对象`); return }
          /* 每个矿点都要有一个路线信息 */
          for (var s of sources) {
            const results = startpos.findPath(s.pos, 1)
            LoopB:
            for (const p of results) {
              if (p.isNearTo(s.pos))
                continue
              if (isInArray([0, 49], p.x) || isInArray([0, 49], p.y))
                continue LoopB
              /* 如果不再路径点缓存中，就push进路径列表中 */
              if (!isInArray(Memory.outMineData[disRoomName].road, zipPosition(p)))
                Memory.outMineData[disRoomName].road.push(zipPosition(p))
            }
          }
          mission.data.roadUpdated = true
          return
        }
        /* 先看路径点中是否有本房间的位置点，有的话就创建工地 */
        for (const mess of Memory.outMineData[disRoomName].road) {
          if (unzipPosition(mess).roomName == this.name)
            unzipPosition(mess).createConstructionSite('road')
            // var index = Memory.outMineData[disRoomName].road.indexOf(mess)
            // Memory.outMineData[disRoomName].road.splice(index,1)
        }
        /* 路线信息更新完毕 接下来进入阶段2 */
        mission.data.state = 2
      }
    }
    else if (mission.data.state == 2) // 采集状态 [正常状态]
    {
      mission.creepBind['out-harvest'].num = Memory.outMineData[disRoomName].minepoint.length
      mission.creepBind['out-defend'].num = 0
      if (Memory.outMineData[disRoomName].car)
        mission.creepBind['out-car'].num = Memory.outMineData[disRoomName].minepoint.length

      else mission.creepBind['out-car'].num = 0
    }
    else if (mission.data.state == 3) // 防御状态
    {
      mission.creepBind['out-harvest'].num = 0
      mission.creepBind['out-car'].num = 0
      mission.creepBind['out-defend'].num = 2
      if (Game.rooms[mission.data.disRoom]) {
        const enemys = Game.rooms[mission.data.disRoom].find(FIND_HOSTILE_CREEPS, {
          filter: (creep) => {
            return !isInArray(Memory.whitelist, creep.owner.username)
          },
        })
        const InvaderCore = Game.rooms[mission.data.disRoom].find(FIND_STRUCTURES, {
          filter: (stru) => {
            return stru.structureType == STRUCTURE_INVADER_CORE
          },
        })
        if (enemys.length <= 0 && InvaderCore.length <= 0)
          mission.data.state = 2
      }
    }
  }

  /* 过道采集监控发布任务 */
  public Task_Cross(mission: MissionModel): void {
    if (this.controller.level < 8 || !this.memory.structureIdData.observerID)
      return
    if (this.memory.toggles.StopCross)
      return
    const observer_ = Game.getObjectById(this.memory.structureIdData.observerID) as StructureObserver
    if (!observer_) { delete this.memory.structureIdData.observerID; return }
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
    if (mission.data.state == 1) {
      /* 观察房间 */
      observer_.observeRoom(mission.data.relateRooms[mission.data.index])
      // console.log(`observer正在观察房间${mission.Data.relateRooms[mission.Data.index]}`)
      /* 获取上个tick的房间名 */
      let beforRoom: string
      if (mission.data.relateRooms.length == 1) { beforRoom = mission.data.relateRooms[0] }
      else if (mission.data.relateRooms.length > 1) {
        if (mission.data.index == 0)
          beforRoom = mission.data.relateRooms[mission.data.relateRooms.length - 1]
        else beforRoom = mission.data.relateRooms[mission.data.index - 1]
      }
      if (Game.rooms[beforRoom]) {
        /* 查找power和deposit */
        if (mission.data.power) {
          const powerbank = Game.rooms[beforRoom].find(FIND_STRUCTURES, {
            filter: (stru) => {
              return stru.structureType == 'powerBank' && stru.ticksToDecay >= 3600 && stru.power > 3000
            },
          }) as StructurePowerBank[]
          if (powerbank.length > 0) {
            let BR = true
            for (var i of this.memory.mission.Creep) {
              if (i.name == 'power采集' && i.data.room == beforRoom && i.data.x == powerbank[0].pos.x && i.data.y == powerbank[0].pos.y)
                BR = false
            }
            if (BR) {
              /* 下达采集任务 */

              var thisTask = this.generatePowerHarvestMission(beforRoom, powerbank[0].pos.x, powerbank[0].pos.y, powerbank[0].power)
              if (thisTask != null)
                this.addMission(thisTask)
            }
          }
        }
        if (mission.data.deposit) {
          const deposit = Game.rooms[beforRoom].find(FIND_DEPOSITS, {
            filter: (stru) => {
              return stru.ticksToDecay >= 3800 && stru.lastCooldown < 150
            },
          })
          if (deposit.length > 0) {
            let BR = true
            for (var i of this.memory.mission.Creep) {
              if (i.name == 'deposit采集' && i.data.room == beforRoom && i.data.x == deposit[0].pos.x && i.data.y == deposit[0].pos.y)
                BR = false
            }
            if (BR) {
              /* 查询一下是不是已经有了该房间的采集任务了 */
              let have = false
              for (const dm of this.memory.mission.Creep) {
                if (dm.name == 'deposit采集' && dm.data.room == beforRoom)
                  have = true
              }
              /* 下达采集任务 */
              var thisTask = this.generateDepositHarvestMission(beforRoom, deposit[0].pos.x, deposit[0].pos.y, deposit[0].depositType)
              if (thisTask != null && !have)
                this.addMission(thisTask)
            }
          }
        }
      }
      mission.data.index++
      if (Game.rooms[beforRoom] && mission.data.index == 1) {
        // console.log(Colorful("进入休息模式",'blue'))
        mission.data.time = Game.time
        mission.data.state = 2
      }
    }
    else if (mission.data.state == 2) {
      if (Game.time - mission.data.time != 0 && (Game.time - mission.data.time) % 60 == 0)
        mission.data.state = 1
        // console.log(Colorful("进入观察模式",'blue'))
    }
  }

  /* Power采集 */
  public Task_PowerHarvest(mission: MissionModel): void {
    if (this.controller.level < 8)
      return
    if (!mission.data.state)
      mission.data.state = 1
    if (mission.data.state == 1) {
      mission.creepBind['power-carry'].num = 0
    }
    else if (mission.data.state == 2) {
      if (!mission.data.down)
        mission.data.down = false
      if (!mission.data.down) {
        mission.creepBind['power-carry'].num = Math.ceil(mission.data.num / 1600)
        mission.data.down = true
      }
      mission.creepBind['power-attack'].num = 0
      mission.creepBind['power-heal'].num = 0
      if (mission.creepBind['power-carry'].num == mission.creepBind['power-carry'].bind.length && mission.creepBind['power-carry'].num != 0)
        mission.creepBind['power-carry'].num = 0

      if (mission.creepBind['power-attack'].bind.length <= 0 && mission.creepBind['power-heal'].bind.length <= 0 && mission.creepBind['power-carry'].bind.length <= 0)
        this.removeMission(mission.id)
    }
  }
}
