interface Room {
  // 任务框架
  processMission(): void
  addMission(mis: Omit<MissionModel, 'id'>): boolean
  removeMission(id: string): boolean
  countCreepMissionByName(role: string, name: string): number
  getMissionById(id: string): MissionModel | null
  countMissionByName(category: string, name: string): number
  carryMissionExist(role: string, source: RoomPosition, target: RoomPosition, rType: ResourceConstant): boolean
  checkLab(mission: Omit<MissionModel, 'id'>, role: string, tankType: 'storage' | 'terminal' | 'complex'): boolean
  linkMissionExist(source: RoomPosition, target: RoomPosition): boolean
  checkBuy(resource: ResourceConstant): boolean
  getMissionModelByName(category: string, name: string): MissionModel | null

  // 主动任务
  checkSpawnFeed(): void
  checkBuilder(): void
  checkTowerFeed(): void
  checkLabFeed(): void
  checkNukerFeed(): void
  checkSourceLinks(): void
  checkCenterLinkToStorage(): void
  checkConsumeLinks(): void
  checkNukeDefend(): void
  checkCompoundDispatch(): void
  checkMineral(): void
  checkPower(): void
  checkAutoDefend(): void

  // 被动任务
  verifyCarryMission(mission: MissionModel): void
  verifyRepairMission(mission: MissionModel): void
  verifyDismantleMission(mission: MissionModel): void
  verifyQuickUpgradeMission(mission: MissionModel): void
  verifyNormalUpgradeMission(mission: MissionModel): void
  verifyHelpDefendMission(mission: MissionModel): void
  verifyHelpBuildMission(mission: MissionModel): void
  verifyCompoundMission(mission: MissionModel): void
  verifyAioMission(mission: MissionModel): void
  verifyOutMineMission(mission: MissionModel): void
  processPowerMission(mission: MissionModel): void
  verifyCrossMission(mission: MissionModel): void
  verifyPowerHarvestMission(mission: MissionModel): void
  verifyRedDefendMission(mission: MissionModel): void
  verifyBlueDefendMission(mission: MissionModel): void
  verifyDoubleDefendMission(mission: MissionModel): void
  verifySquadMission(mission: MissionModel): void
  verifyDoubleMission(mission: MissionModel): void
  verifyResourceTransferMission(mission: MissionModel): void
  verifyExpandMission(mission: MissionModel): void

  // pc 任务
  checkPowerCreep(): void
  checkPcEnhanceFactory(): void
  checkPcEnhanceSource(): void

  // 生成任务
  generateCarryMission(creepData: CreepBindData, delayTick: number, sR: string, sX: number, sY: number, tR: string, tX: number, tY: number, rType?: ResourceConstant, num?: number): Omit<MissionModel, 'id'>
  generateRepairMission(Rtype: 'global' | 'special' | 'nuker', num: number, boostType?: ResourceConstant, level?: 'T0' | 'T1' | 'T2'): Omit<MissionModel, 'id'> | null
  generatePlanCMission(disRoom: string, Cnum: number, upNum: number, shard?: string,): Omit<MissionModel, 'id'>
  generateLinkMission(structure: string[], disStructure: string, level: number, delayTick?: number): Omit<MissionModel, 'id'>
  generateDismantleMission(disRoom: string, shard: string, num: number, interval?: number, boost?: boolean): Omit<MissionModel, 'id'>
  generateQuickMission(num: number, boostType?: ResourceConstant): Omit<MissionModel, 'id'>
  generateExpandMission(disRoom: string, shard: string, num: number, cnum: number, defend?: boolean): Omit<MissionModel, 'id'>
  generateSupportMission(disRoom: string, sType: 'double' | 'aio', shard: string, num: number, boost: boolean): Omit<MissionModel, 'id'>
  generateControlMission(disRoom: string, shard: string, interval: number): Omit<MissionModel, 'id'>
  generateHelpBuildMission(disRoom: string, num: number, shard?: string, time?: number, defend?: boolean): Omit<MissionModel, 'id'> | null
  generateSignMission(disRoom: string, shard: string, str: string): Omit<MissionModel, 'id'>
  generateSendMission(disRoom: string, rType: ResourceConstant, num: number): Omit<MissionModel, 'id'> | null
  generateBuyMission(res: ResourceConstant, num: number, range: number, max?: number): Omit<MissionModel, 'id'> | null
  generateCompoundMission(num: number, disResource: ResourceConstant, bindData: string[]): Omit<MissionModel, 'id'> | null
  generateAioMission(disRoom: string, disShard: string, num: number, interval: number, boost: boolean, bodylevel?: 'T0' | 'T1' | 'T2'): Omit<MissionModel, 'id'>
  generateOutMineMission(sourceRoom: string, x: number, y: number, disRoom: string): Omit<MissionModel, 'id'> | null
  generatePowerHarvestMission(disRoom: string, x: number, y: number, num: number): Omit<MissionModel, 'id'>
  generateDepositHarvestMission(disRoom: string, x: number, y: number, rType: DepositConstant): Omit<MissionModel, 'id'>
  generateRedDefendMission(num: number): Omit<MissionModel, 'id'> | null
  generateBlueDefendMission(num: number): Omit<MissionModel, 'id'> | null
  generateDoubleDefendMission(num: number): Omit<MissionModel, 'id'> | null
  generateSquadMission(disRoom: string, shard: string, interval: number, RNum: number, ANum: number, DNum: number, HNum: number, AIONum: number, flag: string): Omit<MissionModel, 'id'> | null
  generateDoubleMission(disRoom: string, shard: string, CreepNum: number, cType: 'dismantle' | 'attack', interval: number): Omit<MissionModel, 'id'> | null
  generateResourceTransferMission(disRoom: string, resource?: ResourceConstant, num?: number): Omit<MissionModel, 'id'>
  generateNormalUpgradeMission(num: number, boostType?: ResourceConstant): Omit<MissionModel, 'id'>
}

interface RoomMemory {
  mission: Record<string, MissionModel[]> // 任务
  roomLabBind?: RoomLabBind
  cooldownDic: Record<string, number> /* 冷却时间的哈希表 key为任务名 */
  nukeID?: string[]
  nukeData?: NukeData
  comDispatchData?: { [re in ResourceConstant]?: { ok?: boolean;dispatch_num: number } }
  mineralType: ResourceConstant
  enemy?: enemyAllotData
}

interface NukeData {
  damage: Record<string, number>// 地形伤害数据
  rampart: Record<string, number> // 初始rampart防御数据
}

/* 房间任务模板 */
interface MissionModel {
  /* 所有任务都必须有 */
  // 每个任务的唯一标识，用于获取任务、删除任务、添加任务
  id: string
  name: string // 任务名称
  category: 'Room' | 'Creep' | 'Structure' | 'PowerCreep' // 任务所属范围  新增powerCreep任务
  delayTick: number // 过期时间 1000 99999 (x)
  structure?: string[] // 与任务有关的建筑id Structure A B(link) ['Aid']
  state?: number // 任务状态 0 (A 1) 1 (B 2 A 0) 2
  maxConcurrent?: number // 最大重复任务数  默认1 例如我可以同时发布两个签名任务，1个去E1S1 一个去E1S2 物流运输( 3 )
  labBind?: MissionLabBind // 实验室绑定 #
  cooldownTick?: number // 冷却时间  默认10 A -A cooldownTick= 10
  creepBind?: CreepBindData // 爬虫绑定 {'A':{num:1,bind:[],interval?:100}}
  level?: number // 任务等级，越小优先级越高 默认10
  data?: any // 数据   {disRoom:xxxx,A:xxxx,B:xxx}  Data ---> 浅拷贝 creep.memory.MissionData.Data
  reserve?: boolean // 适用于Creep范围的任务，即任务删除后，creepMemory里的任务数据不会删除 （默认会删除）
  /* 自动处理属性 */
  processing?: boolean // 任务是否正在被处理 只有在处理期间过期时间才会递减 ture --> delayTick -- false delayTick(x)
}

/* 任务角色绑定数据 */
type CreepBindData = Record<string, {
  num: number
  bind: string[]
  interval?: number
  // 任务用特殊体型，为 true 则代表需要特殊体型
  MSB?: boolean
}>

/* 任务实验室绑定数据  任务对象里的 */
type MissionLabBind = Record<Id<StructureLab>, ResourceConstant>

/* 房间记忆实验室绑定数据格式  房间memory */
type RoomLabBind = Record<string, {
  missionID: string[]
  rType: ResourceConstant
  occ?: boolean
}>

type enemyAllotData = Record<string, Id<Creep>[]>
