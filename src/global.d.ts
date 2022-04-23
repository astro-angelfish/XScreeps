/* 存放全局声明 */
declare namespace NodeJS {
  interface Global {
    /* 用于判定全局扩展是否已经挂载 */
    Mounted: boolean
    creepBodyData: Record<string, Record<string, number[]>> // 每种类型爬虫的体型数据
    SpecialBodyData: Record<string, Record<string, import('@/utils').BodyParam>> // 爬虫的特殊体型数据
    creepNumData: Record<string, Record<string, number>> // 每种类型爬虫的实际数量
    // 寻路的键值对
    routeCache: Record<string, string>
    routeCacheDefend: Record<string, string>
    routeCacheAio: Record<string, string>
    Gtime: Record<string, number>
    // 将对象全局获取，这样只用获取一次对象，不用每次都分别获取
    structureCache: Record<string, globalStrcutureData>
    intervalData: Record<string, Record<string, number>>
    resourceLimit: resourceLimitData
    warData: any
    MSB: MissionSpecialBody // 任务特殊体型
    /* 脚本运行总cpu */
    usedCpu?: number
    /* 100Tick内的平均CPU */
    cpuData?: number[]
    aveCpu?: number
    repairList?: Record<string, (Id<StructureContainer> | Id<StructureRoad>)[]>
    logProfiler?: boolean
  }
}

type globalStrcutureData = Record<string, Structure | Structure[]>

type resourceLimitData = Record<string, Partial<Record<ResourceConstant, number>>>

interface warData{
  tower: Record<string, { count: number;data: TowerRangeMapData }> // 防御塔伤害数据
  enemy: Record<string, { time: number;data: Creep[] }> // 敌方房间爬虫数据
  structure: Record<string, { time: number;data: StructureData }> // 敌方房间建筑数据
  flag: Record<string, { time: number;data: Flag[] }> // 敌方房间旗帜数据
}

type TowerRangeMapData = Record<string, ARH>

interface ARH {
  attack: number
  repair: number
  heal: number
}

type StructureData = Record<string, Structure[]>

/* 任务爬虫特殊体型 */
type MissionSpecialBody = Record<string, Record<string, import('@/utils').BodyParam>>

type NarrowStructure<T extends AnyStructure['structureType'], N = AnyStructure> = N extends { structureType: T } ? N : never

type StorageStructures<T extends AnyStructure = AnyStructure> = T extends { store: unknown } ? T : never
