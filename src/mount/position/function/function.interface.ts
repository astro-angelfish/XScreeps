interface RoomPosition {
    getRangedStructure(sr:StructureConstant[],range:number,mode:number):Structure[] |undefined | Structure
    getClosestStructure(sr:StructureConstant[],mode:number):Structure | undefined
    directionToPos(direction: DirectionConstant) : RoomPosition | undefined
    getClosestStore(cstructure?: StructureExtension | StructureSpawn):StructureExtension | StructureSpawn | StructureLab | undefined
    getVoid(): RoomPosition[] 
    getSourceVoid():RoomPosition[]
    getSourceLinkVoid():RoomPosition[]
    GetStructure(stru:StructureConstant):Structure
    GetStructureList(stru:StructureConstant[]):StructureStorage[]
    GetRuin():Ruin
    FindPath(target:RoomPosition,range:number):RoomPosition[]
}
