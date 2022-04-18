interface Room {
  /* 任务框架 */
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
  missionSpawnFeed(): void
  Constru_Build(): void
  missionTowerFeed(): void
  missionLabFeed(): void
  missionNukerFeed(): void
  missionCenterLink(): void
  Task_Clink(): void
  Task_consumeLink(): void
  Nuke_Defend(): void
  Task_CompoundDispatch(): void
  Task_monitorMineral(): void
  Task_montitorPower(): void
  Task_Auto_Defend(): void

  // 被动任务
  Task_Carry(mission: MissionModel): void
  Task_Repair(mission: MissionModel): void
  Task_dismantle(mission: MissionModel): void
  Task_Quick_upgrade(mission: MissionModel): void
  Task_HelpDefend(mission: MissionModel): void
  Task_HelpBuild(mission: MissionModel): void
  Task_Compound(mission: MissionModel): void
  Task_aio(mission: MissionModel): void
  Task_OutMine(mission: MissionModel): void
  Task_ProcessPower(mission: MissionModel): void
  Task_Cross(mission: MissionModel): void
  Task_PowerHarvest(mission: MissionModel): void
  Task_Red_Defend(mission: MissionModel): void
  Task_Blue_Defend(mission: MissionModel): void
  Task_Double_Defend(mission: MissionModel): void
  Task_squad(mission: MissionModel): void
  Task_double(mission: MissionModel): void
  Task_Resource_transfer(mission: MissionModel): void
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

type enemyAllotData = Record<string, string[]>
