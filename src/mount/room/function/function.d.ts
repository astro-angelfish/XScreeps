interface Room {
  // fun
  getStructureWithType<T extends AnyStructure['structureType']>(type: T): NarrowStructure<T>[]
  bindLab(rTypes: ResourceConstant[]): MissionLabBind | undefined
  getStructureHitsLeast<T extends AnyStructure['structureType']>(types: T[], mode: 0 | 1 | 2 | 3): NarrowStructure<T>
  getStructureWithTypes<T extends AnyStructure['structureType']>(type: T[]): NarrowStructure<T>[]
  runStructureMissionWithTypes(strus: StructureConstant[]): void
  runStructureMission(): void
  updateLevelCache(): void
  // tower
  TowerWork(): void
  // 建筑缓存
  cacheStructures(): void
  _cacheStructuresByType: CacheStructuresByType
  _cacheSBTUpdated: number
}

interface RoomMemory {

}

type CacheStructuresByType<T extends AnyStructure['structureType'] = AnyStructure['structureType']> = { [K in T]: NarrowStructure<K>[] }
