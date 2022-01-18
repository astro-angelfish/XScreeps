import structure from "@/mount/structure"
import { filter_structure, GenerateAbility, isInArray } from "@/utils"

/* 爬虫原型拓展   --任务  --任务行为 */
export default class CreepMissonActionExtension extends Creep {
    // 刷墙 未完成
    public handle_repair():void{
        let missionData = this.memory.MissionData
        let id = missionData.id
        let mission = Game.rooms[this.memory.belong].GainMission(id)
        if (!id) return
        let storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.StructureIdData.storageID) as StructureStorage
        // if (!storage_){delete Game.rooms[this.memory.belong].memory.StructureIdData.storageID;return}
        this.workstate('energy')
        /* boost检查 暂缺 */
        if (mission.Data.RepairType == 'global')
        {
            if (this.memory.working)
            {
                if (this.memory.targetID)
                {
                    this.say("🛠️")
                    var target_ = Game.getObjectById(this.memory.targetID) as StructureRampart
                    if (!target_) delete this.memory.targetID
                    this.repair_(target_)
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
                var leastRam = this.room.getListHitsleast([STRUCTURE_RAMPART,STRUCTURE_WALL],3)
                if (!leastRam) return
                this.memory.targetID = leastRam.id
                if(storage_)
                this.withdraw_(storage_,'energy')
                else
                {
                    let closestStore = this.pos.findClosestByRange(FIND_STRUCTURES,{filter:(stru)=>{return (stru.structureType == 'container' || stru.structureType == 'tower') && stru.store.getUsedCapacity('energy') >= this.store.getFreeCapacity()}})
                    if (closestStore)this.withdraw_(closestStore,'energy')
                }
            }
        }
    }

    // C计划
    public handle_planC():void{
        let missionData = this.memory.MissionData
        let id = missionData.id
        let mission = Game.rooms[this.memory.belong].GainMission(id)
        if (Game.rooms[mission.Data.disRoom] && !Game.rooms[mission.Data.disRoom].controller.safeMode) Game.rooms[mission.Data.disRoom].controller.activateSafeMode()
        if (this.memory.role == 'cclaim')
        {
            if (!Game.rooms[mission.Data.disRoom])
            {
                this.goTo(new RoomPosition(25,25,mission.Data.disRoom),20)
                return
            }
            if (!this.pos.isNearTo(Game.rooms[mission.Data.disRoom].controller))
            this.goTo(Game.rooms[mission.Data.disRoom].controller.pos,1)
            else
            {
                this.claimController(Game.rooms[mission.Data.disRoom].controller)
                this.say("cclaim")
            }
            if (Game.rooms[mission.Data.disRoom].controller.level && Game.rooms[mission.Data.disRoom].controller.owner)
            {
                mission.CreepBind[this.memory.role].num = 0
            }
        }
        else
        {
            this.workstate('energy')
            if (this.room.name == this.memory.belong && !this.memory.working)
            {
                let store = this.pos.findClosestByRange(FIND_STRUCTURES,{filter:(stru)=>{
                    return (stru.structureType == 'container' ||
                    stru.structureType == 'tower' ||
                    stru.structureType == 'storage')&& stru.store.getUsedCapacity('energy') >= this.store.getFreeCapacity()}})
                if (store)
                {
                    this.withdraw_(store,'energy')
                }
                return
            }
            if (!Game.rooms[mission.Data.disRoom])
            {
                this.goTo(new RoomPosition(25,25,mission.Data.disRoom),20)
                return
            }
            if (Game.rooms[mission.Data.disRoom].controller.level >= 2)
            {
                global.SpecialBodyData[this.memory.belong]['cupgrade'] = GenerateAbility(1,1,1,0,0,0,0,0)
            }
            if (this.memory.working)
            {
                if (this.room.name != mission.Data.disRoom)
                {
                    this.goTo(Game.rooms[mission.Data.disRoom].controller.pos,1)
                    return
                }
                let cons = this.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
                if (cons) this.build_(cons)
                else {this.upgrade_();this.say("cupgrade")}
            }
            else
            {
                let source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
                if (source) this.harvest_(source)
            }
        }
    }

}