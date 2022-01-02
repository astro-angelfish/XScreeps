/* 房间原型拓展   --方法  --寻找 */
export default class RoomFunctionFindExtension extends Room {
    /* 获取指定structureType的建筑列表 */
    public getStructure(sc:StructureConstant):Structure[]
    {
        return this.find(FIND_STRUCTURES,{filter:{structureType:sc}})
    }

    /* 获取指定范围内的建筑 */
    

}