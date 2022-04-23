interface RoomPosition {
  getRangedStructure<T extends AnyStructure['structureType']>(types: T[], range: number, mode: 0 | 1): NarrowStructure<T>[]
  getRangedStructure<T extends AnyStructure['structureType']>(types: T[], range: number, mode: 2): NarrowStructure<T> | undefined
  getRangedStructure<T extends AnyStructure['structureType']>(types: T[], range: number, mode: number): NarrowStructure<T>[] | NarrowStructure<T> | undefined
  getClosestStructure<T extends AnyStructure['structureType']>(types: T[], mode: number): NarrowStructure<T> | null
  directionToPos(direction: DirectionConstant): RoomPosition | undefined
  getClosestStore(): StructureExtension | StructureSpawn | StructureLab | null
  getSourceVoid(): RoomPosition[]
  getSourceLinkVoid(): RoomPosition[] | null
  getStructure<T extends AnyStructure['structureType']>(type: T): NarrowStructure<T> | null
  getStructureList<T extends AnyStructure['structureType']>(types: T[]): NarrowStructure<T>[]
  getRuin(): Ruin | null
  findPath(pos: RoomPosition, range: number): RoomPosition[] | null
  findRangeCreep(num: number): Creep[]
  calcTowerRangeData(target: StructureTower, tempData: ARH): void
  getStraightDistanceTo(pos: RoomPosition): number
  isWalkable(): boolean
}
