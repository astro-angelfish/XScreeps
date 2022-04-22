import { roleData } from '@/constant/spawnConstant'
import { checkSendMission, getRoomDispatchNum } from '@/module/fun/funtion'
import { colorfyLog, generateID, profileMethod, sortByKey } from '@/utils'

/* 房间原型拓展   --任务  --任务框架 */
export default class RoomMissionFrameExtension extends Room {
  /**
   * 执行房间任务
   */
  @profileMethod()
  public processMission(): void {
    // 冷却监测
    this.processCooldown()
    // 超时监测
    this.processDelay()
    // 任务-爬虫 绑定信息更新
    this.removeUnbindMissions()
    // 任务-爬虫 孵化
    this.checkRoleSpawnByMission()
    // PC任务管理器
    this.checkPowerCreep()

    // [全自动] 任务挂载区域 需要按照任务重要程度进行排序
    this.checkSpawnFeed() // 虫卵填充任务
    this.checkSourceLinks() // 能量采集
    this.checkConsumeLinks() // 消费、冲级link
    this.checkBuilder() // 建筑任务
    this.checkCenterLinkToStorage() // 链接送仓任务
    this.checkTowerFeed() // 防御塔填充任务
    this.checkLabFeed() // 实验室填充\回收任务
    this.checkNukerFeed() // 核弹填充任务
    this.checkNukeDefend() // 核弹防御
    this.checkCompoundDispatch() // 合成规划 （中级）
    this.checkMineral() // 挖矿
    this.checkPower() // 烧power任务监控
    this.checkAutoDefend() // 主动防御任务发布

    // 基本任务监控区域
    for (const index in this.memory.mission) {
      for (const mission of this.memory.mission[index]) {
        switch (mission.name) {
          case '物流运输': { this.verifyCarryMission(mission); break }
          case '墙体维护': { this.verifyRepairMission(mission); break }
          case '黄球拆迁': { this.verifyDismantleMission(mission); break }
          case '急速冲级': { this.verifyQuickUpgradeMission(mission); break }
          case '紧急援建': { this.verifyHelpBuildMission(mission); break }
          case '紧急支援': { this.verifyHelpDefendMission(mission); break }
          case '资源合成': { this.verifyCompoundMission(mission); break }
          case '攻防一体': { this.verifyAioMission(mission); break }
          case '外矿开采': { this.verifyOutMineMission(mission); break }
          case 'power升级': { this.processPowerMission(mission); break }
          case '过道采集': { this.verifyCrossMission(mission); break }
          case 'power采集': { this.verifyPowerHarvestMission(mission); break }
          case '红球防御': { this.verifyRedDefendMission(mission); break }
          case '蓝球防御': { this.verifyBlueDefendMission(mission); break }
          case '双人防御': { this.verifyDoubleDefendMission(mission); break }
          case '四人小队': { this.verifySquadMission(mission); break }
          case '双人小队': { this.verifyDoubleMission(mission); break }
          case '资源转移': { this.verifyResourceTransferMission(mission); break }
        }
      }
    }
  }

  /* 添加任务 */
  public addMission(rawMission: Omit<MissionModel, 'id'>): boolean {
    let label: string
    if (rawMission.category === 'Creep')
      label = 'C-'
    else if (rawMission.category === 'Room')
      label = 'R-'
    else if (rawMission.category === 'Structure')
      label = 'S-'
    else if (rawMission.category === 'PowerCreep')
      label = 'P-'
    else return false

    const tempID = label + generateID()

    // 最多允许同时有 30 个任务，超过则不能再挂载
    if (this.memory.mission[rawMission.category]
       && this.memory.mission[rawMission.category].length >= 30)
      return false

    // 超过了任务的最大重复数，也不允许挂载 默认是 1
    const maxConcurrent = rawMission.maxConcurrent ?? 1

    // 爬虫任务
    if (rawMission.creepBind) {
      for (const creepName in rawMission.creepBind) {
        if (this.countCreepMissionByName(creepName, rawMission.name) >= maxConcurrent)
          return false
      }
    }
    // 房间、建筑类型的任务
    else {
      const num = this.countMissionByName(rawMission.category, rawMission.name)
      if (num >= maxConcurrent)
        return false
    }

    // 如果该任务冷却时间不为 0 则不允许挂载
    if (this.memory.cooldownDic[rawMission.name])
      return false

    // lab 绑定相关，涉及 lab 的绑定和解绑
    if (rawMission.labBind && Object.keys(rawMission.labBind).length > 0) {
      for (const labId_ in rawMission.labBind) {
        const labId = labId_ as Id<StructureLab>
        if (!this.checkLabRType(labId, rawMission.labBind[labId])
         || !this.checkLabOcc(labId)) {
          console.log(colorfyLog(`LabID: ${labId} 绑定失败，请检查!`, 'red', true))
          return false
        }
      }
    }
    if (rawMission.labBind === null)
      return false

    const mission = Object.assign(rawMission, { id: tempID })

    // 每种相同任务成功挂载一次，将有冷却时间 默认为10
    const coolTick = mission.cooldownTick ?? 10
    if (!this.memory.cooldownDic[mission.name])
      this.memory.cooldownDic[mission.name] = coolTick

    // 任务等级默认为 10
    mission.level = mission.level || 10

    // 挂载任务
    this.memory.mission[mission.category].push(mission)
    // 每次提交任务都根据优先级排列一下
    this.memory.mission[mission.category].sort(sortByKey('level'))

    if (!Memory.ignoreMissionName?.includes(mission.name))
      console.log(colorfyLog(`${mission.name} 任务挂载 √√√ id: ${mission.id} room: ${this.name}`, 'green'))

    // 任务挂载成功才绑定实验室
    if (mission.labBind && Object.keys(mission.labBind).length > 0) {
      for (const labId_ in mission.labBind) {
        const labId = labId_ as Id<StructureLab>
        this.bindLabData(labId, mission.labBind[labId], mission.id)
      }
    }

    return true
  }

  /* 删除任务 */
  public removeMission(id: string): boolean {
    let category: string
    if (id[0] === 'C')
      category = 'Creep'
    else if (id[0] === 'S')
      category = 'Structure'
    else if (id[0] === 'R')
      category = 'Room'
    else if (id[0] === 'P')
      category = 'PowerCreep'
    else return false

    for (const m of this.memory.mission[category]) {
      if (m.id !== id)
        continue

      // 解绑 lab
      if (m.labBind && Object.keys(m.labBind).length > 0) {
        for (const labId_ in m.labBind) {
          const labId = labId_ as Id<StructureLab>
          // console.log(`labId: ${m.labBind[labId]} ------解绑-----> missionId: ${m.id}`)
          this.unBindLabData(labId, m.id)
        }
      }

      // 解绑爬虫的任务 对于没有超时监测的任务，删除任务也要删除任务绑定的爬虫
      if (!m.reserve && m.creepBind) {
        for (const bindType in m.creepBind) {
          for (const bindCreepId of m.creepBind[bindType].bind) {
            if (Game.creeps[bindCreepId]) {
              // 删除任务也意味着初始化任务数据内存
              Game.creeps[bindCreepId].memory.missionData = {}
            }
          }
        }
      }

      // 删除任务
      this.memory.mission[category].splice(this.memory.mission[category].indexOf(m), 1)

      if (!Memory.ignoreMissionName?.includes(m.name))
        console.log(colorfyLog(`${m.name} 任务删除 xxx id: ${m.id} room: ${this.name}`, 'blue'))

      return true
    }

    console.log(colorfyLog(`任务删除失败 id: ${id} room: ${this.name}`, 'red'))
    return false
  }

  /**
   * 执行冷却计时器
   */
  public processCooldown(): void {
    if (!this.memory.cooldownDic)
      this.memory.cooldownDic = {}

    const cooldownDic = this.memory.cooldownDic

    for (const i in cooldownDic) {
      if (cooldownDic[i] > 0)
        cooldownDic[i] -= 1
      else
        delete cooldownDic[i]
    }
  }

  /**
   * 执行冷却计时器
   */
  public processDelay(): void {
    for (const key in this.memory.mission) {
      for (const mission of this.memory.mission[key]) {
        if (mission.processing && mission.delayTick < 99995)
          mission.delayTick--

        // 小于0就删除任务
        if (mission.delayTick <= 0)
          this.removeMission(mission.id)
      }
    }
  }

  /**
   * 任务解绑监测
   */
  public removeUnbindMissions(): void {
    if (Game.time % 5)
      return
    // 只适用于Creep任务
    if (!this.memory.mission.Creep)
      return

    for (const m of this.memory.mission.Creep) {
      if (!m.creepBind)
        continue

      for (const bindsType in m.creepBind) {
        const binds = m.creepBind[bindsType].bind
        for (const bind of binds) {
          if (!Game.creeps[bind]) {
            // console.log(`已经清除爬虫${c}的绑定数据!`)
            binds.splice(binds.indexOf(bind), 1)
          }
        }
      }
    }
  }

  /* 任务数量查询 */
  public countMissionByName(category: string, name: string): number {
    if (!this.memory.mission)
      this.memory.mission = {}
    if (!this.memory.mission[category])
      this.memory.mission[category] = []

    return this.memory.mission[category].reduce((n, i) => i.name === name ? n + 1 : n, 0)
  }

  /**
   * 与 role 相关的任务数量查询
   */
  public countCreepMissionByName(role: string, name: string): number {
    return this.memory.mission.Creep.reduce((n, i) =>
      i.creepBind && i.name === name && role in i.creepBind
        ? n + 1
        : n, 0)
  }

  /* 获取任务 */
  public getMissionById(id: string): MissionModel | null {
    for (const category in this.memory.mission) {
      for (const t of this.memory.mission[category]) {
        if (t.id === id)
          return t
      }
    }
    return null
  }

  /**
   * 通过名称获取唯一任务
   */
  public getMissionModelByName(range: string, name: string): MissionModel | null {
    for (const i of this.memory.mission[range]) {
      if (i.name === name)
        return i
    }
    return null
  }

  /**
   * 判断实验室资源类型是否一致，在 lab 不存在时返回 false
   */
  public checkLabRType(id: Id<StructureLab>, rType: ResourceConstant): boolean {
    if (!this.memory.roomLabBind?.[id])
      return true

    const lab = Game.getObjectById(id)
    if (!lab)
      return false

    if (lab.mineralType && lab.mineralType !== rType)
      return false

    const bind = this.memory.roomLabBind[id]
    if (bind.rType !== rType)
      return false

    return true
  }

  /**
   * 判断 lab 是否允许新增
   */
  public checkLabOcc(id: string): boolean {
    return !!this.memory.roomLabBind?.[id]?.occ
  }

  /**
   * 设置 lab 绑定数据
   */
  public bindLabData(id: string, rType: ResourceConstant, missionID: string, occ?: boolean): boolean {
    if (!this.memory.roomLabBind)
      this.memory.roomLabBind = {}
    const roomLabBind = this.memory.roomLabBind

    if (id in this.memory.roomLabBind) {
      if (roomLabBind[id].rType !== rType)
        return false

      if (!roomLabBind[id].missionID.includes(missionID)) {
        roomLabBind[id].missionID.push(missionID)
        return false
      }
    }

    // 说明不存在该 id
    this.memory.roomLabBind[id] = {
      missionID: [missionID],
      rType,
      occ: occ || false,
    }

    return true
  }

  /**
   * 解绑 lab 绑定数据
   */
  public unBindLabData(labId: Id<StructureLab>, missionId: string): boolean {
    if (!this.memory.roomLabBind || !this.memory.roomLabBind[labId])
      return false

    const bind = this.memory.roomLabBind[labId]
    if (bind.missionID.length <= 0) {
      console.log(`labId: ${labId} ------解绑-----> missionId: ${missionId}`)
      delete this.memory.roomLabBind[labId]
      return true
    }

    if (bind.missionID.includes(missionId)) {
      console.log(`labId: ${labId} ------解绑-----> missionId: ${missionId}`)
      bind.missionID.splice(bind.missionID.indexOf(missionId), 1)
      return true
    }

    return false
  }

  /**
   * 任务所需角色孵化管理
   */
  public checkRoleSpawnByMission(): void {
    if (!this.memory.mission.Creep)
      this.memory.mission.Creep = []

    for (const mission of this.memory.mission.Creep) {
      if (!mission.creepBind)
        continue

      for (const role in mission.creepBind) {
        const bind = mission.creepBind[role]
        const mem = roleData[role].mem || {}

        // 间隔型
        if (bind.interval && bind.interval > 0) {
          if (bind.num <= 0)
            continue

          if (!mission.data)
            mission.data = {}
          if (!mission.data.intervalTime)
            mission.data.intervalTime = Game.time

          if ((Game.time - mission.data.intervalTime) % bind.interval === 0) {
            // 如果孵化队列里太多这种类型的爬虫就不孵化 最高允许10个
            const count = this.memory.spawnQueue.reduce((n, i) => i.role === role ? n + 1 : n, 0)
            if (count > 10)
              continue

            mem.taskRB = mission.id
            if (mission.creepBind[role].MSB)
              mem.msb = true

            for (let i = 0; i < mission.creepBind[role].num; i++)
              this.addSpawnMissionByRole(role, roleData[role].priority || 10, mem)
          }
        }
        // 补全型
        else {
          // 跳过 disShard
          if (mission.data.disShard === Game)
            continue
          // 跳过常驻爬虫，这部分在 `processNumSpawn` 处理
          if (this.memory.spawnConfig[role])
            continue
          // 战争模式下非必要任务不运行
          if (this.memory.state === 'war' && !roleData[role].ignoreWar)
            continue

          const spawnNum = mission.creepBind[role].num - mission.creepBind[role].bind.length
          if (spawnNum <= 0)
            continue

          // 如果任务没招到爬，检查一下是否空闲爬
          const relatedSpawnList = this.getNumInSpawnListByRole(role)
          const relatedCreeps = Object.values(Game.creeps)
            .filter(creep => creep.memory.belong === this.name
              && creep.memory.role === role
              && !creep.memory.missionData?.id,
            ).length
          if (relatedSpawnList + relatedCreeps < spawnNum) {
            if (mission.creepBind[role].MSB) {
              mem.msb = true
              mem.taskRB = mission.id
            }
            this.addSpawnMissionByRole(role, roleData[role].priority || 10, mem)
          }
        }
      }
    }
  }

  /**
   * 判断 lab 的 boost 搬运模块
   */
  public checkLab(mission: MissionModel, role: string, tankType: 'storage' | 'terminal' | 'complex'): boolean {
    if (!mission.labBind || !this.memory.structureIdData)
      return true

    const structureIdData = this.memory.structureIdData

    const storage = structureIdData?.storageID ? Game.getObjectById(structureIdData.storageID) : null
    const terminal = structureIdData?.terminalID ? Game.getObjectById(structureIdData.terminalID) : null

    let tank: StructureTerminal | StructureStorage | null = null

    if (tankType === 'storage') {
      if (!storage)
        return false
      tank = storage
    }
    else if (tankType === 'terminal') {
      if (!terminal)
        return false
      tank = terminal
    }
    else if (tankType === 'complex') {
      if (!terminal && !storage)
        return false

      if (terminal && !storage)
        tank = terminal
      else if (!terminal && storage)
        tank = storage
    }

    // 负责 lab 的填充
    for (const labId_ in mission.labBind) {
      const labId = labId_ as Id<StructureLab>
      const rType = mission.labBind[labId]

      if (tankType === 'complex' && !tank && terminal && storage) {
        const terminalNum = terminal.store[rType] || 0
        const storageNum = storage.store[rType] || 0
        tank = terminalNum > storageNum ? terminal : storage
      }
      if (!tank)
        return false

      const totolUsed = tank.store[rType] || 0

      if (totolUsed < 2100) {
        // 资源调度
        if (getRoomDispatchNum(this.name) <= 0
         && this.countMissionByName('Structure', '资源购买') <= 0
         && !checkSendMission(this.name, rType)) {
          console.log(colorfyLog(`[资源调度] 房间 ${this.name} 没有足够的资源 [${rType}]，将执行资源调度!`, 'yellow'))
          const dispatchTask: RDData = {
            sourceRoom: this.name,
            rType,
            num: 3000,
            delayTick: 200,
            conditionTick: 20,
            buy: true,
            mtype: 'deal',
          }
          Memory.resourceDispatchData.push(dispatchTask)
        }
        return false
      }

      const lab = Game.getObjectById(labId)
      // 说明找不到lab了
      if (!lab) {
        if (this.memory.structureIdData.labs)
          this.memory.structureIdData.labs.splice(this.memory.structureIdData.labs.indexOf(labId), 1)
        return false
      }

      if ((lab.store[rType] || 0) < 1000
       && this.carryMissionExist('transport', tank.pos, lab.pos, rType)) {
        // if (totolUsed < 1500)
        //   return false
        const carryTask = this.generateCarryMission(
          { [role]: { num: 1, bind: [] } },
          45,
          this.name, tank.pos.x, tank.pos.y,
          this.name, lab.pos.x, lab.pos.y,
          rType, 2000)
        this.addMission(carryTask)
        return false
      }
    }

    return true
  }

  /**
   * 搬运任务是否已经存在
   */
  public carryMissionExist(role: string, source: RoomPosition, target: RoomPosition, rType: ResourceConstant): boolean {
    for (const i of this.memory.mission.Creep) {
      if (i.name !== '物流运输')
        continue
      if (!i.creepBind || !(role in i.creepBind) || i.data.rType !== rType)
        continue

      const sourcePos = new RoomPosition(i.data.sourcePosX, i.data.sourcePosY, i.data.sourceRoom)
      const disPos = new RoomPosition(i.data.targetPosX, i.data.targetPosY, i.data.targetRoom)

      if (sourcePos.isEqualTo(source) && disPos.isEqualTo(target))
        return true
    }
    return false
  }

  /**
   * link 任务是否已经存在\
   * 注：会在不存在 link 时返回 true
   */
  public linkMissionExist(source: RoomPosition, target: RoomPosition): boolean {
    const sourceLink = source.getStructure('link')
    const posLink = target.getStructure('link')
    if (!sourceLink || !posLink) {
      console.log(`${this.name} 在不存在 link 时调用了 linkMissionExist`)
      return true
    }

    for (const i of this.memory.mission.Structure) {
      if (i.name === '链传送能'
        && i.structure?.includes(sourceLink.id)
        && i.data.disStructure === posLink.id)
        return true
    }

    return false
  }

  // 判断房间是否存在资源购买指定资源的任务
  public checkBuy(resource: ResourceConstant): boolean {
    for (const i of this.memory.mission.Structure) {
      if (i.name === '资源购买' && i.data.rType === resource)
        return true
    }
    return false
  }
}
