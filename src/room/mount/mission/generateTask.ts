import { labReactionMap } from '@/structure/constant/ResourceConstant'
import { defineMission } from '@/room/utils'
import { zipPosition } from '@/utils'

/* 房间原型拓展   --任务  --任务发布便捷函数 */
export default class RoomMissionGenerate extends Room {
  /**
   * 搬运任务发布函数
   * @param creepData 爬虫绑定信息，例如：{ repair: { num: 1, bind: [] }, build: { num: 2, bind: [] } }
   * @param delayTick 任务的超时时间，如果不想设置超时可以设置为99999
   * @param sR 提取资源的建筑所在房间
   * @param sX 提取资源的建筑X坐标
   * @param sY 提取资源的建筑Y坐标
   * @param tR 存放资源的建筑所在房间
   * @param tX 存放资源的建筑X坐标
   * @param tY 存放资源的建筑Y坐标
   * @param rType 资源类型[可选] 例如： 'energy' 或者 'XLH2O'等
   * @param num 要搬运的数量[可选]
   * @returns 任务对象
   */
  public generateCarryMission(creepData: CreepBindData,
    delayTick: number,
    sR: string, sX: number, sY: number,
    tR: string, tX: number, tY: number,
    rType?: ResourceConstant, num?: number): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: '物流运输',
      creepBind: creepData,
      category: 'Creep',
      delayTick,
      cooldownTick: 1,
      maxTime: 3,
      data: {
        rType,
        num,
        sourceRoom: sR,
        sourcePosX: sX,
        sourcePosY: sY,
        targetRoom: tR,
        targetPosX: tX,
        targetPosY: tY,
      },
    })

    return thisTask
  }

  /**
   * 修墙任务的发布函数
   * @param Rtype 维修范围，global: 全局维修, special: 黄黑旗下建筑维修, nuker: 核弹防御
   * @param num 任务相关维修爬数量
   * @param boostType boost 类型，null: 无boost, LH/LH2O/XLH2O 是 boost 类型
   * @param level 身体部件 分为 T0 T1 T2
   * @returns 任务对象
   */
  public generateRepairMission(Rtype: 'global' | 'special' | 'nuker', num: number, boostType?: ResourceConstant, level?: 'T0' | 'T1' | 'T2'): Omit<MissionModel, 'id'> | null {
    const thisTask = defineMission({
      name: '墙体维护',
      category: 'Creep',
      delayTick: 99999,
      level: 10,
      creepBind: { repair: { num, bind: [], MSB: !!level } },
      maxTime: 3,
      data: {
        RepairType: Rtype,
        num,
        boostType,
        level,
      },
    })

    if (boostType && ['LH', 'LH2O', 'XLH2O'].includes(boostType)) {
      const labData = this.bindLab([boostType])
      if (!labData)
        return null
      thisTask.labBind = labData
    }

    return thisTask
  }

  /**
   * C计划 即占领一个房间开启安全模式，建造 wall，保护主房
   * @param disRoom 目标房间
   * @returns 任务对象
   */
  public generatePlanCMission(disRoom: string, Cnum: number, upNum: number, shard?: string): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: 'C计划',
      category: 'Creep',
      delayTick: 20500,
      level: 10,
      reserve: true,
      data: {
        state: 0,
        disRoom,
      },
    })

    if (!shard) {
      thisTask.data.shard = Game.shard.name
      thisTask.creepBind = {
        cclaim: { num: Cnum, bind: [] },
        cupgrade: { num: upNum, bind: [] },
      }
    }
    else {
      thisTask.data.shard = shard
      thisTask.creepBind = {
        cclaim: { num: Cnum, bind: [], interval: 1000 },
        cupgrade: { num: upNum, bind: [], interval: 1000 },
      }
    }

    return thisTask
  }

  /**
   * link 传任务发布函数
   * @param structure 传送的 link
   * @param dislink 目的 link
   * @param level 传送任务等级
   * @param delayTick 过期时间
   * @returns 任务对象
   */
  public generateLinkMission(structure: string[], dislink: string, level: number, delayTick?: number): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: '链传送能',
      category: 'Structure',
      delayTick: delayTick || 20,
      structure,
      level,
      data: {
        disStructure: dislink,
      },
    })

    return thisTask
  }

  /**
   * 拆迁任务发布函数
   * @param disRoom 目标房间
   * @param num 数量
   * @param interval 时间间隔
   * @param boost 是否 boost
   * @returns 任务对象
   */
  public generateDismantleMission(disRoom: string, shard: string, num: number, interval = 1200, boost?: boolean): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: '黄球拆迁',
      category: 'Creep',
      delayTick: 20500,
      level: 10,
      reserve: true,
      data: {
        disRoom,
        num,
        shard,
        boost: boost || (this.controller && this.controller.level > 5),
      },
      creepBind: {
        dismantle: { num: 0, interval, bind: [], MSB: !!boost },
      },
    })

    if (boost)
      thisTask.labBind = this.bindLab(['XZHO2', 'XZH2O'])

    return thisTask
  }

  public generateAioMission(disRoom: string, disShard: string, num: number, interval: number, boost: boolean, bodylevel?: 'T0' | 'T1' | 'T2') {
    const thisTask = defineMission({
      name: '攻防一体',
      category: 'Creep',
      delayTick: 80000,
      level: 10,
      reserve: true,
      maxTime: 5,
      data: {
        disRoom,
        num,
        shard: disShard,
        boost,
        bodylevel,
      },
      creepBind: {
        aio: { num: 0, interval, bind: [], MSB: !!boost },
      },
    })

    if (boost)
      thisTask.labBind = this.bindLab(['XZHO2', 'XGHO2', 'XLHO2', 'XKHO2'])

    return thisTask
  }

  public generateControlMission(disRoom: string, shard: string, interval: number): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: '控制攻击',
      category: 'Creep',
      delayTick: 99999,
      level: 10,
      reserve: true,
      data: {
        disRoom,
        shard,
      },
      creepBind: {
        'claim-attack': { num: 1, interval, bind: [] },
      },
    })

    return thisTask
  }

  /**
   * 急速冲级任务发布函数
   * @param num 冲级爬数量
   * @param boostType boost 类型
   * @returns 任务对象
   */
  public generateQuickMission(num: number, boostType?: ResourceConstant): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: '急速冲级',
      category: 'Creep',
      delayTick: 99999,
      level: 10,
      data: {
      },
      creepBind: {
        rush: { num, bind: [] },
      },
    })

    if (boostType)
      thisTask.labBind = this.bindLab([boostType])

    return thisTask
  }

  public generateExpandMission(disRoom: string, shard: string, num: number, cnum?: number): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: '扩张援建',
      category: 'Creep',
      delayTick: 40000,
      level: 10,
      reserve: true,
      data: {
        disRoom,
        shard,
      },
      creepBind: {
        claim: { num: cnum || 0, bind: [] },
        Ebuild: { num, bind: [] },
        Eupgrade: { num, bind: [] },
      },
    })

    return thisTask
  }

  public generateHelpBuildMission(disRoom: string, num: number, shard?: string, time?: number, defend?: boolean): Omit<MissionModel, 'id'> | null {
    const thisTask = defineMission({
      name: '紧急援建',
      category: 'Creep',
      delayTick: 20000,
      level: 10,
      reserve: true,
      data: {
        disRoom,
        num,
        shard: shard || Game.shard.name,
        defend,
      },
      creepBind: {
        architect: { num, bind: [], interval: time || 1000, MSB: (!defend) },
      },
      maxTime: 2,
    })

    if (defend) // 有防备的
      thisTask.labBind = this.bindLab(['XZHO2', 'XLH2O', 'XLHO2', 'XGHO2', 'XKH2O'])
    else
      thisTask.labBind = this.bindLab(['XZHO2', 'XLH2O', 'XKH2O'])

    if (thisTask.labBind)
      return thisTask
    return null
  }

  public generateSupportMission(disRoom: string, sType: 'double' | 'aio', shard?: string, num = 1, boost?: boolean): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: '紧急支援',
      category: 'Creep',
      delayTick: 20000,
      level: 10,
      reserve: true,
      data: {
        disRoom,
        sType,
        boost,
        shard: shard || Game.shard.name,
      },
      maxTime: 3,
    })

    if (sType === 'double') {
      thisTask.creepBind = {
        'double-attack': { num, bind: [], interval: 1000 },
        'double-heal': { num, bind: [], interval: 1000 },
      }
      thisTask.labBind = this.bindLab(['XUH2O', 'XLHO2', 'XZHO2', 'XGHO2', 'XKHO2'])
    }
    else if (sType === 'aio') {
      thisTask.creepBind = {
        saio: { num, bind: [], interval: 1000 },
      }
      if (boost)
        thisTask.labBind = this.bindLab(['XLHO2', 'XZHO2', 'XGHO2', 'XKHO2'])
    }

    return thisTask
  }

  /**
   * 双人小队发布函数
   */
  public generateDoubleMission(disRoom: string, shard: string, CreepNum: number, cType: 'dismantle' | 'attack', interval: number): Omit<MissionModel, 'id'> | null {
    const thisTask = defineMission({
      name: '双人小队',
      category: 'Creep',
      delayTick: 20000,
      level: 10,
      data: {
        disRoom,
        shard,
        teamType: cType,
        num: CreepNum,
      },
      reserve: true,
    })

    if (!interval || interval < 100)
      return null

    if (cType === 'dismantle') {
      thisTask.creepBind = {
        'double-dismantle': { num: CreepNum, bind: [], interval },
        'double-heal': { num: CreepNum, bind: [], interval },
      }

      const labData = this.bindLab(['XZHO2', 'XZH2O', 'XGHO2', 'XLHO2', 'XKHO2'])
      if (labData === null)
        return null
      thisTask.labBind = labData
    }
    else {
      thisTask.creepBind = {
        'double-attack': { num: CreepNum, bind: [], interval },
        'double-heal': { num: CreepNum, bind: [], interval },
      }

      const labData = this.bindLab(['XUH2O', 'XZHO2', 'XGHO2', 'XLHO2', 'XKHO2'])
      if (labData === null)
        return null
      thisTask.labBind = labData
    }

    return thisTask
  }

  public generateSignMission(disRoom: string, shard: string, str: string): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: '房间签名',
      category: 'Creep',
      delayTick: 1600,
      level: 10,
      data: {
        // 目标房间
        disRoom,
        // 目标shard
        shard,
        // 签名内容
        str,
      },
      creepBind: {
        scout: { num: 1, bind: [] },
      },
      // 最大同时任务数量
      maxTime: 2,
    })

    return thisTask
  }

  /**
   * 资源传送任务发布函数
   */
  public generateSendMission(disRoom: string, rType: ResourceConstant, num: number): Omit<MissionModel, 'id'> | null {
    if (!this.memory.structureIdData?.terminalID)
      return null

    const terminal = Game.getObjectById(this.memory.structureIdData.terminalID) as StructureTerminal
    if (!terminal) {
      delete this.memory.structureIdData.terminalID
      return null
    }

    const thisTask = defineMission({
      name: '资源传送',
      category: 'Structure',
      delayTick: 2500,
      structure: [terminal.id],
      level: 5,
      data: {
        disRoom,
        rType,
        num,
      },
      maxTime: 8,
    })

    return thisTask
  }

  /**
   * 资源购买任务发布函数 做多同时允许3个
   * @param res 要购买的资源
   * @param num 要购买的数量
   * @param range 价格波动可接受区间
   * @param max 最高接受的价格
   * @returns 任务对象
   */
  public generateBuyMission(res: ResourceConstant, num: number, range: number, max?: number): Omit<MissionModel, 'id'> | null {
    if (!this.memory.structureIdData?.terminalID)
      return null

    const terminal = Game.getObjectById(this.memory.structureIdData.terminalID) as StructureTerminal
    if (!terminal) {
      delete this.memory.structureIdData.terminalID
      return null
    }

    const thisTask = defineMission({
      name: '资源购买',
      category: 'Structure',
      structure: [terminal.id],
      delayTick: 60,
      level: 10,
      maxTime: 3,
      data: {
        rType: res,
        num,
        range,
        maxPrice: max || 35,
      },
    })

    return thisTask
  }

  public generateCompoundMission(num: number, disResource: ResourceConstant, bindData: string[]): Omit<MissionModel, 'id'> | null {
    // 检验阶段
    if (!this.memory.structureIdData?.labInspect
      || Object.keys(this.memory.structureIdData.labInspect).length < 3)
      return null
    const labInspect = this.memory.structureIdData.labInspect

    const raw1 = Game.getObjectById(labInspect.raw1) as StructureLab
    const raw2 = Game.getObjectById(labInspect.raw2) as StructureLab
    if (!raw1 || !raw2) {
      delete this.memory.structureIdData.labInspect
      return null
    }

    for (const i of labInspect.com) {
      const thisLab = Game.getObjectById(i)
      if (!thisLab) {
        labInspect.com.splice(labInspect.com.indexOf(i), 1)
        continue
      }
    }

    const raw1Id = labReactionMap[disResource].raw1
    const raw2Id = labReactionMap[disResource].raw2

    // 开始进行任务
    const thisTask = defineMission({
      name: '资源合成',
      category: 'Room',
      delayTick: 50000,
      processing: true,
      level: 10,
      labBind: {
        [labInspect.raw1]: raw1Id,
        [labInspect.raw2]: raw2Id,
      },
      data: {
        num,
        comData: bindData,
        raw1: raw1Id,
        raw2: raw2Id,
      },
    })

    for (const ii of bindData)
      thisTask.labBind![ii as Id<StructureLab>] = disResource

    return thisTask
  }

  /**
   * 外矿开采任务发布函数
   */
  public generateOutMineMission(sourceRoom: string, x: number, y: number, disRoom: string): Omit<MissionModel, 'id'> | null {
    if (!this.memory.structureIdData?.storageID)
      return null

    const pos = new RoomPosition(x, y, sourceRoom)
    if (!pos)
      return null

    // 检查是否已经存在重复任务了
    for (const i of this.memory.mission.Creep) {
      if (i.name === '外矿开采' && i.data.disRoom === disRoom)
        return null
    }

    const thisTask = defineMission({
      name: '外矿开采',
      category: 'Creep',
      delayTick: 99999,
      level: 10,
      data: {
        disRoom,
        startpoint: zipPosition(pos),
      },
      creepBind: {
        'out-claim': { num: 0, bind: [] },
        'out-harvest': { num: 0, bind: [] },
        'out-car': { num: 0, bind: [] },
        'out-defend': { num: 0, bind: [] },
      },
    })

    return thisTask
  }

  /**
   * power 采集任务发布函数
   */
  public generatePowerHarvestMission(disRoom: string, x: number, y: number, num: number): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: 'power采集',
      category: 'Creep',
      delayTick: 5000,
      level: 10,
      data: {
        room: disRoom,
        x,
        y,
        state: 1,
        num,
        Cnum: Math.ceil(num / 1600),
      },
      creepBind: {
        'power-attack': { num: 1, bind: [] },
        'power-heal': { num: 1, bind: [] },
        'power-carry': { num: 0, bind: [] },
      },
      maxTime: 2,
    })

    return thisTask
  }

  /* deposit采集任务发布函数 */
  public generateDepositHarvestMission(disRoom: string, x: number, y: number, rType: DepositConstant): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: 'deposit采集',
      category: 'Creep',
      delayTick: 2000,
      level: 10,
      data: {
        room: disRoom,
        x,
        y,
        state: 1,
        rType,
      },
      creepBind: {
        deposit: { num: 1, bind: [] },
      },
      maxTime: 2,
    })

    return thisTask
  }

  /**
   * 红球防御任务发布函数
   */
  public generateRedDefendMission(num: number): Omit<MissionModel, 'id'> | null {
    const thisTask = defineMission({
      name: '红球防御',
      category: 'Creep',
      delayTick: 99999,
      level: 10,
      data: {},
      creepBind: {
        'defend-attack': { num, bind: [] },
      },
    })

    const comList: ResourceConstant[] = ['XZHO2', 'XUH2O']
    const labData = this.bindLab(comList)
    if (labData === null)
      return null
    thisTask.labBind = labData

    return thisTask
  }

  /* 蓝球防御任务发布函数 */
  public generateBlueDefendMission(num: number): Omit<MissionModel, 'id'> | null {
    const thisTask = defineMission({
      name: '蓝球防御',
      category: 'Creep',
      delayTick: 99999,
      level: 10,
      data: {},
      creepBind: {
        'defend-range': { num, bind: [] },
      },
    })

    const comList: ResourceConstant[] = ['XZHO2', 'XKHO2']
    const labData = this.bindLab(comList)
    if (labData === null)
      return null
    thisTask.labBind = labData

    return thisTask
  }

  /* 双人小队防御任务发布函数 */
  public generateDoubleDefendMission(num: number): Omit<MissionModel, 'id'> | null {
    const thisTask = defineMission({
      name: '双人防御',
      category: 'Creep',
      delayTick: 99999,
      level: 10,
      data: {},
      creepBind: {
        'defend-douAttack': { num, bind: [] },
        'defend-douHeal': { num, bind: [] },
      },
    })

    const comList: ResourceConstant[] = ['XZHO2', 'XLHO2', 'XUH2O', 'XGHO2']
    const labData = this.bindLab(comList)
    if (labData === null)
      return null
    thisTask.labBind = labData

    return thisTask
  }

  /* 四人小队任务发布函数 */
  public generateSquadMission(disRoom: string, shard: string, interval: number, RNum: number, ANum: number, DNum: number, HNum: number, AIONum: number, flag: string): Omit<MissionModel, 'id'> | null {
    const thisTask = defineMission({
      name: '四人小队',
      category: 'Creep',
      delayTick: 40000,
      level: 10,
      reserve: true,
      data: {
        disRoom,
        shard,
        flag,
      },
      creepBind: {},
      maxTime: 3,
    })

    // 防止数量不对
    if (RNum + ANum + DNum + HNum + AIONum !== 4)
      return null

    // 防止搭配不均
    if (HNum !== 2 && AIONum !== 4)
      return null

    const creepData: Record<string, {
      num: number
      bd: ResourceConstant[]
    }> = {
      'x-range': { num: RNum, bd: ['XZHO2', 'XLHO2', 'XKHO2', 'XGHO2'] },
      'x-heal': { num: HNum, bd: ['XZHO2', 'XLHO2', 'XKHO2', 'XGHO2'] },
      'x-aio': { num: AIONum, bd: ['XZHO2', 'XLHO2', 'XKHO2', 'XGHO2'] },
      'x-attack': { num: ANum, bd: ['XZHO2', 'XUH2O', 'XGHO2'] },
      'x-dismantle': { num: DNum, bd: ['XZHO2', 'XZH2O', 'XGHO2'] },
    }
    const tbd: ResourceConstant[] = []
    for (const i in creepData) {
      if (creepData[i].num > 0) {
        thisTask.creepBind![i] = { num: creepData[i].num, bind: [], interval }
        for (const j of creepData[i].bd) {
          if (!tbd.includes(j))
            tbd.push(j)
        }
      }
    }

    const labData = this.bindLab(tbd)
    if (labData === null)
      return null
    thisTask.labBind = labData

    return thisTask
  }

  /**
   * 资源转移任务发布函数
   */
  public generateResourceTransferMission(disRoom: string, resource?: ResourceConstant, num?: number): Omit<MissionModel, 'id'> {
    const thisTask = defineMission({
      name: '资源转移',
      category: 'Room',
      delayTick: 40000,
      level: 10,
      data: {
        disRoom,
        rType: resource || null,
        num: num || 8000000,
      },
      maxTime: 1,
    })

    return thisTask
  }

  /* 资源链任务发布函数 */
}
