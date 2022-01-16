/* 爬虫原型拓展   --任务  --任务行为 */
export default class CreepMissonActionExtension extends Creep {
    public handle_repair():void{
        let missionData = this.memory.MissionData
        let id = missionData.id
        let mission = Game.rooms[this.memory.belong].GainMission(id)
        if (!id) return
        this.say("work")
        let storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.StructureIdData.storageID) as StructureStorage
        if (!storage_){delete Game.rooms[this.memory.belong].memory.StructureIdData.storageID;return}
        this.workstate('energy')
        /* boost检查 暂缺 */
        if (mission.Data.RepairType == 'global')
        {
            if (this.memory.working)
            {
                if (this.memory.targetID)
                {
                    var target_ = Game.getObjectById(this.memory.targetID) as StructureRampart
                    if (!target_) delete this.memory.targetID
                    if (this.repair(target_) == ERR_NOT_IN_RANGE)
                    {
                        this.goTo(target_.pos,3)
                    }
                }
                else
                {
                    var leastRam = this.room.getListHitsleast([STRUCTURE_RAMPART,STRUCTURE_WALL],3)
                    if (!leastRam) return
                    this.memory.targetID = leastRam.id
                }
            }
            else
            {
                /* 寻找hits最小的墙 */
                this.say("×")
                var leastRam = this.room.getListHitsleast([STRUCTURE_RAMPART,STRUCTURE_WALL],3)
                if (!leastRam) return
                this.memory.targetID = leastRam.id
                this.withdraw_(storage_,'energy')
            }
        }
    }
}