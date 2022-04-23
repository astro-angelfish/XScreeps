interface Room {
  // init
  initRoom(): void
  initRoomMemory(): void
  initRoomStructure(): void
  initRoomSpawnList(): void
  initGlobalRoomStructure(): void

  // spawn
  spawnMain(): void
  spawnConfigInit(): void
  spawnConfigModify(): void
  processNumSpawn(): void
  spawnExecution(): void
  addSpawnMission(role: string, body: import('@/utils').BodyParam, priority: number, mem?: SpawnMemory): void
  getNumInSpawnListByRole(role: string): number
  setSpawnNum(role: string, num: number, priority?: number): boolean
  addSpawnMissionByRole(role: string, priority?: number, mem?: SpawnMemory): boolean
  economy(): void

  // ecosphere
  processRoomEcosphere(): void
  processRoomPlan(): void
  ruleRoomLayout(priority: number, map: BluePrint): void
  processRoomState(): void
  patchFromDistribution(): void
  unzipPositionInRoom(str: string): RoomPosition | undefined
  addCurrentStructuresToMemory(): void
  getDistributionNum(): number
  unbindMemory(mold: BuildableStructureConstant, x: number, y: number): void

  // find
  getStructureWithType<T extends AnyStructure['structureType']>(type: T): NarrowStructure<T>[]
  bindLab(rTypes: ResourceConstant[]): MissionLabBind | undefined
  getStructureHitsLeast<T extends AnyStructure['structureType']>(types: T[], mode: 0 | 1 | 2 | 3): NarrowStructure<T>
  getStructureWithTypes<T extends AnyStructure['structureType']>(type: T[]): NarrowStructure<T>[]
  runStructureMissionWithTypes(strus: StructureConstant[]): void
  processStructureMission(): void
  updateLevelCache(): void

  // tower
  processTowers(): void

  // 建筑缓存
  cacheStructures(): void
  _cacheStructuresByType: CacheStructuresByType
  _cacheSBTUpdated: number
}

interface RoomMemory {
  // 存放房间内建筑ID信息
  structureIdData?: {
    spawn?: Id<StructureSpawn>[]
    AtowerID?: Id<StructureTower>[]
    storageID?: Id<StructureStorage>
    labs?: Id<StructureLab>[]
    nukerID?: Id<StructureNuker>
    sourceLinks?: Id<StructureLink>[]
    centerLink?: Id<StructureLink>
    upgradeLink?: Id<StructureLink>
    consumeLink?: Id<StructureLink>[]
    terminalID?: Id<StructureTerminal>
    labInspect?: {
      raw1: Id<StructureLab>
      raw2: Id<StructureLab>
      com: Id<StructureLab>[]
    }
    factoryId?: Id<StructureFactory>
    NtowerID?: Id<StructureTower>
    mineralID?: Id<Mineral>
    source?: Id<Source>[]
    extractorID?: Id<StructureExtractor>
    observerID?: Id<StructureObserver>
    powerSpawnID?: Id<StructurePowerSpawn>
  }
  spawnConfig: SpawnConfigData // 存放房间孵化配置
  spawnConfigLastUpdate: string // 存放房间孵化配置最后更新时间
  spawnQueue: SpawnMission[] // 孵化列表
  originLevel: number // 房间控制器等级，房间等级变化会跟着变化
  harvestData: harvestData // 能量矿采集信息
  state: stateType // 房间状态
  structureNum: number // 房间内建筑的总数量
  distribution: StructureDistribution // 自动布局
  toggles: Record<string, any> // 开关 存放不同任务的一些选项
}

type harvestData = Record<Id<Source>, {
  containerID?: Id<StructureContainer>
  linkID?: Id<StructureLink>
  harvest?: string
  carry?: string
}>

type SpawnConfigData = Record<string, SpawnDataCache>

interface SpawnDataCache {
  /* 手动设置参数 */
  // 数量
  num: number
  // 身体部件
  body: import('@/utils').BodyParam
  // 在战争模式仍进行孵化
  ignoreWar?: boolean
  // 是否为自适应体型
  adaptive?: boolean
  // 是否根据已有 energyAvailable 来自动调整 body，false 时通过 energyCapacity 调整
  reduceToEA?: boolean
  // 孵化间隔时间 【重要参数，会根据是否有这个参数执行对应孵化逻辑，如果interval为0或undefined则代表补员】
  // interval?:number
  // 是否是任务相关 【非任务新增的spawnMessage数据(RoleData里有init的)都任务无关】
  mission?: boolean
  // 孵化优先级
  priority?: number
  // 额外的 memory 配置
  mem?: SpawnMemory

  /* 程序运行参数 */
  // 孵化冷却
  // time?:number
  // 是否被手动控制了，true 时 num 不随等级变化而变化
  manual?: boolean
}

interface SpawnMission {
  // 爬虫角色
  role: string
  // 爬虫身体部件
  body: import('@/utils').BodyParam
  // 是否有额外的记忆需要添加
  memory?: SpawnMemory
  // 爬虫孵化优先级
  priority: number
}

type SpawnMemory = Record<string, any>

/**
 * 房间自动布局
 */
type BluePrint = BluePrintData[]
interface BluePrintData {
  // 相对于中心点x的位置
  x: number
  // 相对于中心点y的位置
  y: number
  // 建筑类型
  structureType?: BuildableStructureConstant
  // 自动布局等级
  level?: number
}

type stateType = 'peace' | 'war'

type StructureDistribution = Partial<Record<BuildableStructureConstant, string[]>>

type CacheStructuresByType<T extends AnyStructure['structureType'] = AnyStructure['structureType']> = { [K in T]: NarrowStructure<K>[] }
