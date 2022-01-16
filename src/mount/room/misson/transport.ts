/* 房间原型拓展   --任务  --运输工任务 */
export default class RoomMissonTransportExtension extends Room {
    // 虫卵填充任务
    public Task_Feed():void{
    /* 每11 tick 观察一次 */
        if (Game.time % 10) return
        if (!this.memory.StructureIdData.storageID) return
        if (this.RoleMissionNum('transport','虫卵填充') < 1)
        {
            let thisPos = new RoomPosition(Memory.RoomControlData[this.name].center[0],Memory.RoomControlData[this.name].center[1],this.name)
            let emptyExtensions = thisPos.findClosestByRange(FIND_MY_STRUCTURES,{filter:(structure)=>{
                return (structure.structureType == 'spawn' || structure.structureType == 'extension') && structure.store.getFreeCapacity('energy') > 0
            }})
            if (emptyExtensions)
            {
            /* 满足条件则触发虫卵填充任务 */
                var thisMisson:MissionModel = {
                name: "虫卵填充",
                range:"Creep",
                delayTick:50,
                cooldownTick:4,
                CreepBind:{'transport':{num:2,bind:[]}},
                Data:{}
                }
                this.AddMission(thisMisson)
            }
        }
    }
}
