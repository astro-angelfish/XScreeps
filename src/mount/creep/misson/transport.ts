/* 爬虫原型拓展   --任务  --搬运工任务 */

export default class CreepMissonTransportExtension extends Creep {
    public handle_feed():void{
        if (!this.room.memory.StructureIdData.storageID) return
        var storage_ = Game.getObjectById(this.room.memory.StructureIdData.storageID as string) as StructureStorage
        if (! storage_) return
        this.workstate('energy')
        for (var r in this.store)
        {
            if (r != 'energy')
            {
                this.say("🚽")
                /* 如果是自己的房间，则优先扔到最近的storage去 */
                if (this.room.name == this.memory.belong)
                {
                    if (!this.room.memory.StructureIdData.storageID) return
                    var storage = Game.getObjectById(this.room.memory.StructureIdData.storageID) as StructureStorage
                    if (!storage) return
                    if (storage.store.getUsedCapacity() > this.store.getUsedCapacity())
                    {
                        this.transfer_(storage,r as ResourceConstant)
                    }
                    else return
                }
                return
            }
        }
        if (this.memory.working)
        {
            this.say("🍉")
            var extensions = this.pos.findClosestByRange(FIND_STRUCTURES,{filter:(structure)=>{
                return (structure.structureType == 'spawn' || structure.structureType == 'extension') && structure.store.getFreeCapacity('energy') > 0
            }})
            if (extensions)
            {
                if (this.transfer(extensions,'energy') == ERR_NOT_IN_RANGE)
                    this.goTo(extensions.pos,1)
            }
            else
            {
                /* 完成就删除任务和自己的记忆 */
                Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.MisssonID)
                this.memory.MissionData = {}
            }
        }
        else
        {
            /* 获取capacity信息 */
            if (this.store.getCapacity() < 600 && this.room.controller.level == 8 && this.room.energyAvailable >= 2000) this.suicide()
            if (storage_.store['energy'] >= this.store.getCapacity())
            this.withdraw_(storage_,'energy')
        }
    }
}