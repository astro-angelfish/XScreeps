import { isOPWR } from "./constant"

export default class PowerCreepMissonAction extends PowerCreep {
    public handle_pwr_storage():void{
        var storage_ = global.Stru[this.memory.belong]['storage'] as StructureStorage
        if (!storage_) return
        if (!this.OpsPrepare()) return
        if (!this.pos.isNearTo(storage_))
        {
            this.goTo(storage_.pos,1)
            return
        }
        else this.usePower(PWR_OPERATE_STORAGE,storage_)

        if (isOPWR(storage_))
        {
            if (Game.rooms[this.memory.belong].GainMission(this.memory.MissionData.id))
            Game.rooms[this.memory.belong].DeleteMission(this.memory.MissionData.id)
            else
            this.memory.MissionData = {}
        }
    }
    // public handle_pwr_tower():void
    // {
    //     for (var id of this.memory.MissonData.data.tower)
    //     {
    //         var tower_ = Game.getObjectById(id) as StructureTower
    //         if (!isPWR(tower_))
    //         {
    //             if (!this.pos.isNearTo(tower_))
    //             {
    //                 this.goTo(tower_.pos,1)
    //             }
    //             else
    //             {
    //                 this.usePower(PWR_OPERATE_TOWER,tower_)
    //             }
    //             return
    //         }
    //     }
    //     if (Game.rooms[this.memory.belong].GainMisson(this.memory.MissonData.MisssonID))
    //     Game.rooms[this.memory.belong].DeleteMisson(this.memory.MissonData.MisssonID)
    //     else
    //     this.memory.MissonData = {}
    // }
    // public handle_pwr_lab():void{
    //     if (this.powers[PWR_OPERATE_LAB] && this.powers[PWR_OPERATE_LAB].cooldown)
    //     {
    //         if (Game.rooms[this.memory.belong].GainMisson(this.memory.MissonData.MisssonID))
    //         Game.rooms[this.memory.belong].DeleteMisson(this.memory.MissonData.MisssonID)
    //         else
    //         this.memory.MissonData = {}
    //         return
    //     }
    //     for (var id of this.memory.MissonData.data.lab)
    //     {
    //         var lab_ = Game.getObjectById(id) as StructureTower
    //         if (!isPWR(lab_))
    //         {
    //             if (!this.pos.isNearTo(lab_))
    //             {
    //                 this.goTo(lab_.pos,1)
    //             }
    //             else
    //             {
    //                 this.usePower(PWR_OPERATE_LAB,lab_)
    //             }
    //             return
    //         }
    //     }
    // }

    // public handle_pwr_extension():void{
    //     var storage_ = global.Stru[this.memory.belong]['storage'] as StructureStorage
    //     if (!storage_) return
    //     if (this.powers[PWR_OPERATE_EXTENSION] && this.powers[PWR_OPERATE_EXTENSION].cooldown)
    //     {
    //         if (Game.rooms[this.memory.belong].GainMisson(this.memory.MissonData.MisssonID))
    //         Game.rooms[this.memory.belong].DeleteMisson(this.memory.MissonData.MisssonID)
    //         else
    //         this.memory.MissonData = {}
    //         return
    //     }
    //     if (!this.pos.inRangeTo(storage_,3))
    //     {
    //         this.goTo(storage_.pos,3)
    //         return
    //     }
    //     else this.usePower(PWR_OPERATE_EXTENSION,storage_)
    // }

    // /* 操作孵化 */
    // public handle_pwr_spawn():void{
    //     var storage_ = global.Stru[this.memory.belong]['storage'] as StructureStorage
    //     if (!storage_) return
    //     if (this.powers[PWR_OPERATE_SPAWN] && this.powers[PWR_OPERATE_SPAWN].cooldown)
    //     {
    //         if (Game.rooms[this.memory.belong].GainMisson(this.memory.MissonData.MisssonID))
    //         Game.rooms[this.memory.belong].DeleteMisson(this.memory.MissonData.MisssonID)
    //         else
    //         this.memory.MissonData = {}
    //         return
    //     }
    //     var spawningSpawn = this.pos.findClosestByRange(FIND_STRUCTURES,{filter:(stru)=>{
    //         return stru.structureType == 'spawn' 
    //     }})
    //     if (!this.pos.inRangeTo(spawningSpawn,3))
    //     {
    //         this.goTo(spawningSpawn.pos,3)
    //         return
    //     }
    //     else this.usePower(PWR_OPERATE_SPAWN,spawningSpawn)
    // }
}