import { RoleData } from "@/constant/SpawnConstant"
import { adaption_body, CalculateEnergy, GenerateAbility } from "@/utils"

/* 房间原型拓展   --内核  --房间孵化 */
export default class RoomCoreSpawnExtension extends Room {
    /**
     * 总孵化函数
     */
    public SpawmManager():void{

    }

    /* 获取爬虫配置信息 */

    /* 爬虫配置信息二次加工 【随房间控制等级的变化而变化】 */

    /* 孵化函数 */
    public SpawnExecution():void{
        // 没有孵化任务就return
        if (!this.memory.SpawnList || this.memory.SpawnList.length <= 0) return
        // 如果没有spawn就return
        if (!this.memory.StructureIdData.spawn || this.memory.StructureIdData.spawn.length <= 0) return
        for (let sID of this.memory.StructureIdData.spawn as string[])
        {
            let thisSpawn = Game.getObjectById(sID) as StructureSpawn
            if (!thisSpawn)
            {
                /* 没有该spawn说明spawn已经被摧毁或者被拆除了，删除structureData里的数据 */
                var spawnMemoryList = this.memory.StructureIdData.spawn as string[]
                var index = spawnMemoryList.indexOf(sID)
                spawnMemoryList.splice(index,1)
                continue
            }
            // 正在孵化就跳过该spawn
            if (thisSpawn.spawning) continue
            var spawnlist = this.memory.SpawnList
            let roleName = spawnlist[0].role
            let mem = spawnlist[0].memory
            let bd = spawnlist[0].body
            let body = GenerateAbility(bd[0],bd[1],bd[2],bd[3],bd[4],bd[5],bd[6],bd[7])
            // 如果global有该爬虫的部件信息，优先用global的数据
            if (global.CreepBodyData[this.name][roleName]) body = global.CreepBodyData[this.name][roleName]
            /* 对爬虫数据进行自适应 */
            let allEnergyCapacity = this.energyCapacityAvailable
            if(allEnergyCapacity < CalculateEnergy(body)) adaption_body(body,allEnergyCapacity)
            // 名称整理
            let mark = RoleData[roleName].mark?RoleData[roleName].mark:"＃"
            let timestr = Game.time.toString().substr(Game.time.toString().length - 4)
            let randomStr = Math.random().toString(36).substr(3)
            // 记忆整理
            let bodyData:BoostData = {}
            for (var b of body)
            {
                if (!bodyData[b]) bodyData[b] = {}
            }
            var thisMem = {
                role:roleName,
                belong:this.name,
                shard:Game.shard.name,
                boostData:bodyData,
                working:false
            }
            // 额外记忆添加
            if (mem)
            {
                for (var i in mem)
                {
                    thisMem[i] = mem[i]
                }
            }
            let result = thisSpawn.spawnCreep(body,`【${mark}】${randomStr}|${timestr}`,{memory:thisMem})
            if (result == OK)
            {
                spawnlist.splice(0,1)   // 孵化成功，删除该孵化数据
            }
        }
        /* 说明所有spawn都繁忙或当前能量不适合孵化该creep */
        return
    }
}