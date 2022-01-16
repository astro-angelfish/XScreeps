interface Room {
    // fun
    getStructure(sc:StructureConstant):Structure[]
    Bind_Lab(rTypes:ResourceConstant[]):MissonLabBind | null
    getListHitsleast(sc:StructureConstant[],mode?:number):Structure | undefined
}

interface RoomMemory {

}