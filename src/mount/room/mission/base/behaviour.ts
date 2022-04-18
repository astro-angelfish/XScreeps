import { ResourceCanDispatch } from '@/module/dispatch/resource'
import { checkBuy, checkDispatch, checkSend, getRoomDispatchNum, resourceMap } from '@/module/fun/funtion'
import { colorfyLog, isInArray } from '@/utils'

/* 房间原型拓展   --任务  --基本功能 */
export default class RoomMissionBehaviourExtension extends Room {
  // 搬运基本任务
  public Task_Carry(mission: MissionModel): void {
    /* 搬运任务需求 sourcePosX,Y sourceRoom targetPosX,Y targetRoom num  rType  */
    // 没有任务数据 或者数据不全就取消任务
    if (!mission.data)
      this.removeMission(mission.id)
    if (!mission.creepBind)
      this.removeMission(mission.id)
  }

  // 建造任务
  public Constru_Build(): void {
    if (Game.time % 51)
      return
    if (this.controller.level < 5)
      return
    const myConstrusion = new RoomPosition(Memory.roomControlData[this.name].center[0], Memory.roomControlData[this.name].center[1], this.name).findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
    if (myConstrusion) {
      /* 添加一个进孵化队列 */
      this.setSpawnNum('build', 1)
    }
    else {
      delete this.memory.spawnConfig.build
    }
  }

  /**
   * 资源 link 资源转移至 centerlink 中
   */
  public missionCenterLink(): void {
    if ((global.Gtime[this.name] - Game.time) % 13)
      return
    if (!this.memory.structureIdData?.sourceLinks || this.memory.structureIdData.sourceLinks.length <= 0)
      return
    if (!this.memory.structureIdData.centerLink)
      return

    const sourceLinks = this.memory.structureIdData.sourceLinks
    const centerLink = Game.getObjectById(this.memory.structureIdData.centerLink)
    if (!centerLink) {
      delete this.memory.structureIdData.centerLink
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

      if (sourceLink.store.energy >= 600 && this.linkMissionExist(sourceLink.pos, centerLink.pos)) {
        const thisTask = this.generateLinkMission([sourceLink.id], centerLink.id, 10)
        this.addMission(thisTask)
        return
      }
    }
  }

  // 消费link请求资源 例如升级Link
  public Task_consumeLink(): void {
    if ((global.Gtime[this.name] - Game.time) % 7)
      return
    if (!this.memory.structureIdData.centerLink)
      return
    const centerLink = Game.getObjectById(this.memory.structureIdData.centerLink) as StructureLink
    if (!centerLink) { delete this.memory.structureIdData.centerLink; return }
    if (this.memory.structureIdData.upgradeLink) {
      const upgradeLink = Game.getObjectById(this.memory.structureIdData.upgradeLink) as StructureLink
      if (!upgradeLink) { delete this.memory.structureIdData.upgradeLink; return }
      if (upgradeLink.store.getUsedCapacity('energy') < 400) {
        var thisTask = this.generateLinkMission([centerLink.id], upgradeLink.id, 25)
        this.addMission(thisTask)
        return
      }
      if (this.memory.structureIdData.consumeLink.length > 0) {
        for (const i of this.memory.structureIdData.consumeLink) {
          const l = Game.getObjectById(i) as StructureLink
          if (!l) {
            const index = this.memory.structureIdData.consumeLink.indexOf(i)
            this.memory.structureIdData.consumeLink.splice(index, 1)
            return
          }
          if (l.store.getUsedCapacity('energy') < 500) {
            var thisTask = this.generateLinkMission([centerLink.id], l.id, 35)
            this.addMission(thisTask)
            return
          }
        }
      }
    }
  }

  // lab合成任务 （底层）
  public Task_Compound(mission: MissionModel): void {
    if (Game.time % 5)
      return
    if (!this.memory.structureIdData.labInspect || Object.keys(this.memory.structureIdData.labInspect).length < 3)
      return
    const storage_ = global.structureCache[this.name].storage as StructureStorage
    const terminal_ = global.structureCache[this.name].terminal as StructureTerminal
    if (mission.data.num <= -50 || !storage_ || !terminal_) // -50 为误差允许值
    {
      this.removeMission(mission.id)
      return
    }
    const raw1 = Game.getObjectById(this.memory.structureIdData.labInspect.raw1) as StructureLab
    const raw2 = Game.getObjectById(this.memory.structureIdData.labInspect.raw2) as StructureLab
    if (!raw1 || !raw2) {
      this.removeMission(mission.id)
      return
    }
    let re = false
    for (const i of mission.data.comData) {
      const thisLab = Game.getObjectById(i) as StructureLab
      if (!thisLab) {
        delete this.memory.roomLabBind[i]
        const index = this.memory.structureIdData.labs.indexOf(i)
        this.memory.structureIdData.labs.splice(index, 1)
        continue
      }
      if (thisLab.cooldown)
        continue
      let comNum = 5
      if (thisLab.effects && thisLab.effects.length > 0) {
        for (const effect_ of thisLab.effects) {
          if (effect_.effect == PWR_OPERATE_LAB) {
            const level = effect_.level
            comNum += level * 2
          }
        }
      }
      if (thisLab.runReaction(raw1, raw2) == OK)
        mission.data.num -= comNum
      if (thisLab.mineralType && thisLab.store.getUsedCapacity(thisLab.mineralType) >= 2500 && this.countCreepMissionByName('transport', '物流运输') < 2 && !this.carryMissionExist('transport', thisLab.pos, storage_.pos, thisLab.mineralType)) {
        /* 资源快满了就要搬运 */
        re = true
        var thisTask = this.generateCarryMission({ transport: { num: 1, bind: [] } }, 30, this.name, thisLab.pos.x, thisLab.pos.y, this.name, storage_.pos.x, storage_.pos.y, thisLab.mineralType, thisLab.store.getUsedCapacity(thisLab.mineralType))
        this.addMission(thisTask)
        continue
      }
    }
    if (re)
      return
    /* 源lab缺资源就运 */
    if (storage_.store.getUsedCapacity(mission.data.raw1) > 0) {
      if (raw1.store.getUsedCapacity(mission.data.raw1) < 500 && this.countCreepMissionByName('transport', '物流运输') < 2 && !this.carryMissionExist('transport', storage_.pos, raw1.pos, mission.data.raw1)) {
        var thisTask = this.generateCarryMission({ transport: { num: 1, bind: [] } }, 30, this.name, storage_.pos.x, storage_.pos.y, this.name, raw1.pos.x, raw1.pos.y, mission.data.raw1, storage_.store.getUsedCapacity(mission.data.raw1) >= 1000 ? 1000 : storage_.store.getUsedCapacity(mission.data.raw1))
        this.addMission(thisTask)
      }
    }
    if (storage_.store.getUsedCapacity(mission.data.raw2) > 0) {
      if (raw2.store.getUsedCapacity(mission.data.raw2) < 500 && this.countCreepMissionByName('transport', '物流运输') < 2 && !this.carryMissionExist('transport', storage_.pos, raw2.pos, mission.data.raw2)) {
        var thisTask = this.generateCarryMission({ transport: { num: 1, bind: [] } }, 30, this.name, storage_.pos.x, storage_.pos.y, this.name, raw2.pos.x, raw2.pos.y, mission.data.raw2, storage_.store.getUsedCapacity(mission.data.raw2) >= 1000 ? 1000 : storage_.store.getUsedCapacity(mission.data.raw2))
        this.addMission(thisTask)
      }
    }
    /* 资源调度 */
    const needResource: ResourceConstant[] = [mission.data.raw1, mission.data.raw2]
    if (this.countMissionByName('Structure', '资源购买') > 0)
      return // 存在资源购买任务的情况下，不执行资源调度
    if (getRoomDispatchNum(this.name) >= 2)
      return // 资源调度数量过多则不执行资源调度
    for (const resource_ of needResource) {
      // 原矿 资源调用
      if (storage_.store.getUsedCapacity(resource_) + terminal_.store.getUsedCapacity(resource_) < 10000 && isInArray(['H', 'O', 'K', 'L', 'X', 'U', 'Z'], resource_)) {
        if (checkDispatch(this.name, resource_))
          continue // 已经存在调用信息的情况
        if (checkSend(this.name, resource_))
          continue // 已经存在其它房间的传送信息的情况
        console.log(colorfyLog(`[资源调度]<lab com> 房间${this.name}没有足够的资源[${resource_}],将执行资源调度!`, 'yellow'))
        const dispatchTask: RDData = {
          sourceRoom: this.name,
          rType: resource_,
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
      else if (storage_.store.getUsedCapacity(resource_) + terminal_.store.getUsedCapacity(resource_) < 500 && !isInArray(['H', 'O', 'K', 'L', 'X', 'U', 'Z'], resource_)) {
        if (checkDispatch(this.name, resource_))
          continue // 已经存在调用信息的情况
        if (checkSend(this.name, resource_))
          continue // 已经存在其它房间的传送信息的情况
        console.log(colorfyLog(`[资源调度]<lab com> 房间${this.name}没有足够的资源[${resource_}],将执行资源调度!`, 'yellow'))
        const dispatchTask: RDData = {
          sourceRoom: this.name,
          rType: resource_,
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
  }

  // 合成规划     (中层)    目标化合物 --> 安排一系列合成
  public Task_CompoundDispatch(): void {
    if ((Game.time - global.Gtime[this.name]) % 50)
      return
    if (this.memory.toggle.AutoDefend)
      return
    if (this.countCreepMissionByName('transport', '物流运输') > 0)
      return
    if (Object.keys(this.memory.comDispatchData).length <= 0)
      return //  没有合成规划情况
    if (this.countMissionByName('Room', '资源合成') > 0)
      return // 有合成任务情况
    const storage_ = global.structureCache[this.name].storage as StructureStorage
    if (!storage_)
      return
    const terminal_ = global.structureCache[this.name].terminal as StructureTerminal
    if (!terminal_)
      return
    /* 没有房间合成实验室数据，不进行合成 */
    if (!this.memory.structureIdData.labInspect.raw1) { console.log(`房间${this.name}不存在合成实验室数据！`); return }
    /* 查看合成实验室的被占用状态 */
    if (this.memory.roomLabBind[this.memory.structureIdData.labInspect.raw1] || this.memory.roomLabBind[this.memory.structureIdData.labInspect.raw2]) { console.log(`房间${this.name}的源lab被占用!`); return }
    const comLabs = []
    for (const otLab of this.memory.structureIdData.labInspect.com) {
      if (!this.memory.roomLabBind[otLab])
        comLabs.push(otLab)
    }
    if (comLabs.length <= 0) { console.log(`房间${this.name}的合成lab全被占用!`); return }
    /* 确认所有目标lab里都没有其他资源 */
    for (var i of this.memory.structureIdData.labs) {
      const thisLab = Game.getObjectById(i) as StructureLab
      if (!thisLab)
        continue
      if (thisLab.mineralType && !this.memory.roomLabBind[i])
        return
    }
    /**
         * 正式开始合成规划
         *  */
    const data = this.memory.comDispatchData
    LoopA:
    for (const disType in data) {
      const storeNum = storage_.store.getUsedCapacity(disType as ResourceConstant)
      const dispatchNum = this.memory.comDispatchData[disType].dispatch_num
      // 不是最终目标资源的情况下
      if (Object.keys(data)[Object.keys(data).length - 1] != disType) {
        if (storeNum + 50 < dispatchNum) // +50 是误差容许
        {
          const diff = dispatchNum - storeNum
          /* 先判定一下是否已经覆盖，如果已经覆盖就不合成 例如：ZK 和 G的关系，只要G数量满足了就不考虑 */
          const mapResource = resourceMap(disType as ResourceConstant, Object.keys(data)[Object.keys(data).length - 1] as ResourceConstant)
          if (mapResource.length > 0) {
            for (const mR of mapResource) {
              if (storage_.store.getUsedCapacity(mR) >= data[disType].dispatch_num)
                continue LoopA
            }
          }
          // 先判断能不能调度，如果能调度，就暂时 return
          const identify = ResourceCanDispatch(this, disType as ResourceConstant, dispatchNum - storeNum)
          if (identify == 'can') {
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
          else if (identify == 'running') { return }
          // 如果terminal存在该类型资源，就暂时return
          if (terminal_.store.getUsedCapacity(disType as ResourceConstant) > (this.memory.TerminalData[disType] ? this.memory.TerminalData[disType].num : 0))
            return
          // 如果存在manage搬运任务 就 return
          if (this.carryMissionExist('manage', terminal_.pos, storage_.pos, disType as ResourceConstant))
            return
          // 下达合成命令
          var thisTask = this.generateCompoundMission(diff, disType as ResourceConstant, comLabs)
          if (this.addMission(thisTask))
            data[disType].ok = true

          return
        }
      }
      // 是最终目标资源的情况下
      if (Object.keys(data)[Object.keys(data).length - 1] == disType) {
        // 下达合成命令
        var thisTask = this.generateCompoundMission(data[disType].dispatch_num, disType as ResourceConstant, comLabs)
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
    if (!this.memory.toggle.StartPower)
      return
    // 有任务了就不发布烧帕瓦的任务
    if (this.countMissionByName('Room', 'power升级') > 0)
      return
    const storage_ = global.structureCache[this.name].storage as StructureStorage
    //  powerspawn_ = global.Stru[this.name]['powerspawn'] as StructurePowerSpawn
    if (!storage_)
      return
    // SavePower 是节省能量的一种"熔断"机制 防止烧power致死
    if (storage_.store.getUsedCapacity('energy') > this.memory.toggle.SavePower ? 250000 : 150000 && storage_.store.getUsedCapacity('power') > 100) {
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
