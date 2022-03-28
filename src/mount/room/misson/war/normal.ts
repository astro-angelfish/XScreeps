import { GenerateAbility, generateID } from "@/utils"

/* 房间原型拓展   --任务  --常规战争 */
export default class NormalWarExtension extends Room {
    // 拆迁黄球
    public Task_dismantle(mission:MissionModel):void{
        if ((Game.time - global.Gtime[this.name]) % 10) return
        if (mission.Data.boost)
        {
            // 体型
            global.SpecialBodyData[this.name]['dismantle'] = GenerateAbility(40,0,10,0,0,0,0,0)
            // boost lab填充检查
            if(!this.Check_Lab(mission,'transport','complex')) return
        }
        /* 数量投放 */
        if (mission.CreepBind['dismantle'].num == 0)
        mission.CreepBind['dismantle'].num = mission.Data.num
    }

    // 一体机
    public Task_aio(mission:MissionModel):void{
        if (mission.Data.boost)
        {
            // 体型
            global.SpecialBodyData[this.name]['aio'] = GenerateAbility(0,0,10,0,6,23,0,11)
            if ((Game.time - global.Gtime[this.name]) % 10) return
            // boost lab填充检查
            if(!this.Check_Lab(mission,'transport','complex')) return
        }
        else
        {
            if ((Game.time - global.Gtime[this.name]) % 10) return
        }
        if (mission.CreepBind['aio'].num == 0)
        mission.CreepBind['aio'].num = mission.Data.num
    }

    // 双人小队
    public Task_double(mission:MissionModel):void{
        if ((Game.time - global.Gtime[this.name])% 11) return
        if (!this.Check_Lab(mission,'transport','complex')) return
    }

    // 四人小队
    public Task_squad(mission:MissionModel):void{
        if ((Game.time - global.Gtime[this.name])% 7) return
        if (!mission.Data.squadID)
        {
            if (!Memory.squadMemory) Memory.squadMemory = {}
            for (var i = 1;i<100;i++)
            {
                if (!Memory.squadMemory[`${mission.Data.flag}${i}|${Game.shard.name}`])
                {
                    mission.Data.squadID = `${mission.Data.flag}${i}|${Game.shard.name}`
                    break
                }
            }
        }
        else
        {
            if (Memory.squadMemory[mission.Data.squadID] && Object.keys(Memory.squadMemory[mission.Data.squadID].creepData).length >= 4)
            {
                delete mission.Data.squadID
            }
        }
        if (!this.Check_Lab(mission,'transport','complex')) return
    }

    // 紧急支援
    public Task_HelpDefend(mission:MissionModel):void{
        if (mission.Data.sType =='aio' && mission.Data.boost)
        {
            global.SpecialBodyData[this.name]['aio'] = GenerateAbility(0,0,10,0,6,23,0,11)
        }
        if ((Game.time-global.Gtime[this.name]) % 7) return
        if (mission.LabBind)
        {
            if(!this.Check_Lab(mission,'transport','complex')) return
        }
    }
}