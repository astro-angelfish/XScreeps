import { ResourceCanDispatch } from '@/module/dispatch/resource'
import { checkBuyMission, checkDispatch, checkSendMission, getRoomDispatchNum, resourceMap } from '@/module/fun/funtion'
import { colorfyLog, isInArray } from '@/utils'

/* 房间原型拓展   --任务  --基本功能 */
export default class RoomMissionBehaviourExtension extends Room {
  /**
   * 检查搬运任务
   */
  public checkCarryMission(mission: MissionModel): void {
    /* 搬运任务需求 sourcePosX,Y sourceRoom targetPosX,Y targetRoom num  rType  */
    // 没有任务数据 或者数据不全就取消任务
    if (!mission.data)
      this.removeMission(mission.id)
    if (!mission.creepBind)
      this.removeMission(mission.id)
  }

  /**
   * 检查和配置建筑 creep
   */
  public checkBuilder(): void {
    if (Game.time % 51)
      return
    if (!this.controller || this.controller.level < 5)
      return

    const [centerX, centerY] = Memory.roomControlData[this.name].center

    const myConstrusion = new RoomPosition(centerX, centerY, this.name)
      .findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
    if (myConstrusion) {
      // 添加一个进孵化队列
      this.setSpawnNum('build', 1)
    }
    else {
      delete this.memory.spawnConfig.build
    }
  }

  /**
   * 资源 link 资源转移至 centerlink 中
   */
  public checkSourceLinks(): void {
    if ((global.Gtime[this.name] - Game.time) % 13)
      return
    const structureIdData = this.memory.structureIdData
    if (!structureIdData?.sourceLinks || structureIdData.sourceLinks.length <= 0)
      return
    if (!structureIdData.centerLink)
      return

    const sourceLinks = structureIdData.sourceLinks
    const centerLink = Game.getObjectById(structureIdData.centerLink)
    if (!centerLink) {
      delete structureIdData.centerLink
      return
    }

    if (centerLink.store.energy > 750)
      return

    for (const id of sourceLinks) {
      const sourceLink = Game.getObjectById(id)
      if (!sourceLink) {
        sourceLinks.splice(sourceLinks.indexOf(id), 1)
        continue
      }

      if (sourceLink.store.energy >= 600 && !this.linkMissionExist(sourceLink.pos, centerLink.pos)) {
        const thisTask = this.generateLinkMission([sourceLink.id], centerLink.id, 10)
        this.addMission(thisTask)
        return
      }
    }
  }

  /**
   * 消费 link 请求资源 例如升级 link
   */
  public checkConsumeLinks(): void {
    if ((global.Gtime[this.name] - Game.time) % 7)
      return
    const structureIdData = this.memory.structureIdData
    if (!structureIdData?.centerLink)
      return

    const centerLink = Game.getObjectById(structureIdData.centerLink)
    if (!centerLink) {
      delete structureIdData.centerLink
      return
    }

    if (structureIdData.upgradeLink) {
      const upgradeLink = Game.getObjectById(structureIdData.upgradeLink)
      if (!upgradeLink) {
        delete structureIdData.upgradeLink
      }
      else {
        if (upgradeLink.store.getUsedCapacity('energy') < 400) {
          const thisTask = this.generateLinkMission([centerLink.id], upgradeLink.id, 25)
          this.addMission(thisTask)
          return
        }
      }
    }

    if (structureIdData.consumeLink?.length) {
      for (const linkId of structureIdData.consumeLink) {
        const link = Game.getObjectById(linkId)
        if (!link) {
          structureIdData.consumeLink.splice(structureIdData.consumeLink.indexOf(linkId), 1)
          continue
        }

        if (link.store.getUsedCapacity('energy') < 500) {
          const thisTask = this.generateLinkMission([centerLink.id], link.id, 35)
          this.addMission(thisTask)
          return
        }
      }
    }
  }

  /**
   * lab合成任务 （底层）
   */
  public checkCompoundMission(mission: MissionModel): void {
    if (Game.time % 5)
      return
    const structureIdData = this.memory.structureIdData
    if (!structureIdData?.labInspect || Object.keys(structureIdData.labInspect).length < 3)
      return

    const storage = structureIdData.storageID ? Game.getObjectById(structureIdData.storageID) : null
    const terminal = structureIdData.terminalID ? Game.getObjectById(structureIdData.terminalID) : null
    // -50 为误差允许值
    if (mission.data.num <= -50 || !storage || !terminal) {
      this.removeMission(mission.id)
      return
    }

    const raw1 = Game.getObjectById(structureIdData.labInspect.raw1) as StructureLab
    const raw2 = Game.getObjectById(structureIdData.labInspect.raw2) as StructureLab
    if (!raw1 || !raw2) {
      this.removeMission(mission.id)
      return
    }

    let re = false
    for (const labId of mission.data.comData) {
      const lab = Game.getObjectById(labId as Id<StructureLab>)
      if (!lab) {
        if (this.memory.roomLabBind && labId in this.memory.roomLabBind)
          delete this.memory.roomLabBind[labId]
        structureIdData.labs?.splice(structureIdData.labs.indexOf(labId), 1)
        continue
      }

      if (lab.cooldown)
        continue

      let consumes = 5
      if (lab.effects && lab.effects.length > 0) {
        for (const effect of lab.effects) {
          if (effect.effect === PWR_OPERATE_LAB) {
            const level = effect.level
            consumes += level * 2
          }
        }
      }

      if (lab.runReaction(raw1, raw2) === OK)
        mission.data.num -= consumes

      // 资源快满了就要搬运
      if (lab.mineralType
       && lab.store.getUsedCapacity(lab.mineralType) >= 2500
       && this.countCreepMissionByName('transport', '物流运输') < 2
       && !this.carryMissionExist('transport', lab.pos, storage.pos, lab.mineralType)) {
        re = true
        const thisTask = this.generateCarryMission(
          { transport: { num: 1, bind: [] } },
          30,
          this.name, lab.pos.x, lab.pos.y,
          this.name, storage.pos.x, storage.pos.y,
          lab.mineralType, lab.store.getUsedCapacity(lab.mineralType))
        this.addMission(thisTask)
        continue
      }
    }
    if (re)
      return

    // 源 lab 缺资源就运
    const rType1 = mission.data.raw1 as ResourceConstant
    if (rType1 in storage.store && storage.store[rType1] > 0) {
      if (raw1.store[rType1] < 500
       && this.countCreepMissionByName('transport', '物流运输') < 2
       && !this.carryMissionExist('transport', storage.pos, raw1.pos, rType1)) {
        const thisTask = this.generateCarryMission(
          { transport: { num: 1, bind: [] } },
          30,
          this.name, storage.pos.x, storage.pos.y,
          this.name, raw1.pos.x, raw1.pos.y,
          rType1, Math.min(storage.store[rType1], 1000))
        this.addMission(thisTask)
      }
    }
    const rType2 = mission.data.raw2 as ResourceConstant
    if (rType2 in storage.store && storage.store[rType2] > 0) {
      if (raw2.store[rType2] < 500
       && this.countCreepMissionByName('transport', '物流运输') < 2
       && !this.carryMissionExist('transport', storage.pos, raw1.pos, rType2)) {
        const thisTask = this.generateCarryMission(
          { transport: { num: 1, bind: [] } },
          30,
          this.name, storage.pos.x, storage.pos.y,
          this.name, raw1.pos.x, raw1.pos.y,
          rType2, Math.min(storage.store[rType2], 1000))
        this.addMission(thisTask)
      }
    }

    // 资源调度
    (() => {
      const needResource: ResourceConstant[] = [rType1, rType2]
      // 存在资源购买任务的情况下，不执行资源调度
      if (this.countMissionByName('Structure', '资源购买') > 0)
        return
      // 资源调度数量过多则不执行资源调度
      if (getRoomDispatchNum(this.name) >= 2)
        return

      for (const rType of needResource) {
        // 原矿 资源调用
        if (storage.store[rType] + terminal.store[rType] < 10000
         && ['H', 'O', 'K', 'L', 'X', 'U', 'Z'].includes(rType)) {
          // 已经存在调用信息的情况
          if (checkDispatch(this.name, rType))
            continue
          // 已经存在其它房间的传送信息的情况
          if (checkSendMission(this.name, rType))
            continue

          console.log(colorfyLog(`[资源调度]<lab com> 房间 ${this.name} 没有足够的资源 [${rType}]，将执行资源调度!`, 'yellow'))
          const dispatchTask: RDData = {
            sourceRoom: this.name,
            rType,
            num: 10000,
            delayTick: 200,
            conditionTick: 35,
            buy: true,
            mtype: 'deal',
          }
          Memory.resourceDispatchData.push(dispatchTask)
          return
        }

        // 其他中间物 资源调用
        else if (storage.store[rType] + terminal.store[rType] < 500
         && !['H', 'O', 'K', 'L', 'X', 'U', 'Z'].includes(rType)) {
          // 已经存在调用信息的情况
          if (checkDispatch(this.name, rType))
            continue
          // 已经存在其它房间的传送信息的情况
          if (checkSendMission(this.name, rType))
            continue

          console.log(colorfyLog(`[资源调度]<lab com> 房间 ${this.name} 没有足够的资源 [${rType}]，将执行资源调度!`, 'yellow'))
          const dispatchTask: RDData = {
            sourceRoom: this.name,
            rType,
            num: 1000,
            delayTick: 100,
            conditionTick: 25,
            buy: true,
            mtype: 'deal',
          }
          Memory.resourceDispatchData.push(dispatchTask)
          return
        }
      }
    })()
  }

  /**
   * 合成规划     (中层)    目标化合物 --> 安排一系列合成
   */
  public checkCompoundDispatch(): void {
    if ((Game.time - global.Gtime[this.name]) % 50)
      return
    if (this.memory.toggles.AutoDefend)
      return
    const structureIdData = this.memory.structureIdData
    if (!structureIdData?.labs)
      return
    // 没有合成规划情况
    if (!this.memory.comDispatchData || Object.keys(this.memory.comDispatchData).length <= 0)
      return
    if (this.countCreepMissionByName('transport', '物流运输') > 0)
      return
    // 有合成任务情况
    if (this.countMissionByName('Room', '资源合成') > 0)
      return

    const storage = structureIdData.storageID ? Game.getObjectById(structureIdData.storageID) : null
    const terminal = structureIdData.terminalID ? Game.getObjectById(structureIdData.terminalID) : null
    if (!storage || !terminal)
      return

    // 没有房间合成实验室数据，不进行合成
    if (!structureIdData.labInspect?.raw1) {
      console.log(`房间 ${this.name} 不存在合成实验室数据！`)
      return
    }

    // 查看合成实验室的被占用状态
    if (this.memory.roomLabBind?.[structureIdData.labInspect.raw1]
     || this.memory.roomLabBind?.[structureIdData.labInspect.raw2]) {
      console.log(`房间 ${this.name} 的源lab被占用!`)
      return
    }
    const comLabs = []
    for (const otLab of structureIdData.labInspect.com) {
      if (!this.memory.roomLabBind?.[otLab])
        comLabs.push(otLab)
    }
    if (comLabs.length <= 0) {
      console.log(`房间 ${this.name} 的合成 lab 全被占用!`)
      return
    }

    // 确认所有目标 lab 里都没有其他资源
    for (const i of structureIdData.labs) {
      const thisLab = Game.getObjectById(i)
      if (!thisLab)
        continue
      if (thisLab.mineralType && !this.memory.roomLabBind?.[i])
        return
    }

    // 正式开始合成规划
    const data = this.memory.comDispatchData
    const targetType = Object.keys(data)[Object.keys(data).length - 1] as ResourceConstant
    for (const disType_ in data) {
      const disType = disType_ as ResourceConstant

      const storeNum = storage.store.getUsedCapacity(disType)
      const dispatchNum = data[disType]!.dispatch_num
      // 不是最终目标资源的情况下
      if (targetType !== disType) {
        // +50 是误差容许
        if (storeNum + 50 < dispatchNum) {
          const diff = dispatchNum - storeNum
          // 先判定一下是否已经覆盖，如果已经覆盖就不合成
          // 例如：ZK 和 G的关系，只要G数量满足了就不考虑
          const mapResource = resourceMap(disType, targetType)
          if (mapResource.length > 0) {
            let haveEnough = false
            for (const mR of mapResource) {
              if (storage.store.getUsedCapacity(mR) >= data[disType]!.dispatch_num) {
                haveEnough = true
                break
              }
            }
            if (haveEnough)
              continue
          }

          // 先判断能不能调度，如果能调度，就暂时 return
          const identify = ResourceCanDispatch(this, disType, dispatchNum - storeNum)
          if (identify === 'can') {
            console.log(`[dispatch]<lab> 房间${this.name}将进行资源为${i}的资源调度!`)
            const dispatchTask: RDData = {
              sourceRoom: this.name,
              rType: i as ResourceConstant,
              num: dispatchNum - storeNum,
              delayTick: 220,
              conditionTick: 35,
              buy: false,
            }
            Memory.resourceDispatchData.push(dispatchTask)
          }
          else if (identify === 'running') { return }
          // 如果terminal存在该类型资源，就暂时return
          if (terminal.store.getUsedCapacity(disType as ResourceConstant) > (this.memory.TerminalData[disType] ? this.memory.TerminalData[disType].num : 0))
            return
          // 如果存在manage搬运任务 就 return
          if (this.carryMissionExist('manage', terminal.pos, storage.pos, disType as ResourceConstant))
            return
          // 下达合成命令
          const thisTask = this.generateCompoundMission(diff, disType as ResourceConstant, comLabs)
          if (this.addMission(thisTask))
            data[disType].ok = true

          return
        }
      }
      // 是最终目标资源的情况下
      if (targetType === disType) {
        // 下达合成命令
        const thisTask = this.generateCompoundMission(data[disType].dispatch_num, disType as ResourceConstant, comLabs)
        if (this.addMission(thisTask))
          this.memory.comDispatchData = {}
        return
      }
    }
  }

  /* 烧Power发布函数任务 */
  public Task_montitorPower(): void {
    if (Game.time % 7)
      return
    if (this.controller.level < 8)
      return
    if (!this.memory.toggles.StartPower)
      return
    // 有任务了就不发布烧帕瓦的任务
    if (this.countMissionByName('Room', 'power升级') > 0)
      return
    const storage_ = global.structureCache[this.name].storage as StructureStorage
    //  powerspawn_ = global.Stru[this.name]['powerspawn'] as StructurePowerSpawn
    if (!storage_)
      return
    // SavePower 是节省能量的一种"熔断"机制 防止烧power致死
    if (storage_.store.getUsedCapacity('energy') > this.memory.toggles.SavePower ? 250000 : 150000 && storage_.store.getUsedCapacity('power') > 100) {
      /* 发布烧power任务 */
      const thisTask: MissionModel = {
        name: 'power升级',
        delayTick: 200,
        category: 'Room',
        state: 1,
      }
      this.addMission(thisTask)
    }
  }

  /* 烧Power执行函数 */
  public Task_ProcessPower(mission: MissionModel): void {
    const storage_ = global.structureCache[this.name].storage as StructureStorage
    const powerspawn_ = global.structureCache[this.name].powerspawn as StructurePowerSpawn
    const terminal_ = global.structureCache[this.name].terminal as StructureTerminal
    if (!storage_ || !powerspawn_ || !terminal_)
      return
    if (mission.state == 1) {
      if (this.countCreepMissionByName('manage', '物流运输') > 0)
        return
      if (powerspawn_.store.getFreeCapacity('energy') > 0) {
        var carryTask = this.generateCarryMission({ manage: { num: 1, bind: [] } }, 10, this.name, storage_.pos.x, storage_.pos.y, this.name, powerspawn_.pos.x, powerspawn_.pos.y, 'energy', powerspawn_.store.getFreeCapacity('energy'))
        this.addMission(carryTask)
        return
      }
      if (powerspawn_.store.getFreeCapacity('power') > 0) {
        var carryTask = this.generateCarryMission({ manage: { num: 1, bind: [] } }, 10, this.name, storage_.pos.x, storage_.pos.y, this.name, powerspawn_.pos.x, powerspawn_.pos.y, 'power', powerspawn_.store.getFreeCapacity('power'))
        this.addMission(carryTask)
        return
      }
      mission.state = 2
    }
    else if (mission.state == 2) {
      const result = powerspawn_.processPower()
      if (result != OK)
        this.removeMission(mission.id)
    }
  }
}
