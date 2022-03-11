

/* 房间原型拓展   --行为  --采矿任务 */
export default class RoomMissonMineExtension extends Room {
    /* 房间内矿资源采集发布任务 */
    public Task_monitorMineral():void{
        if ((Game.time - global.Gtime[this.name] ) % 67) return
        if(this.controller.level < 6) return
        if (!this.memory.StructureIdData.mineralID) return
        if (this.MissionNum('Creep','原矿开采') > 0) return
        var mineral = Game.getObjectById(this.memory.StructureIdData.mineralID) as Mineral
        if (!mineral || mineral.ticksToRegeneration) return
        if (!this.memory.mineralType) this.memory.mineralType = mineral.mineralType
        if (this.controller.level >= 6 && !this.memory.StructureIdData.extractID)
        {
            /* 寻找矿物点 在其附近撒下建筑 */
            if (!mineral.pos.GetStructure('extractor') && mineral.pos.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0)
            {
                mineral.pos.createConstructionSite('extractor')
                return
            }
            return
        }
        /* 寻找mineralContainerID */
        var container_ = mineral.pos.findInRange(FIND_STRUCTURES,1,{filter:(stru)=>{
            return stru.structureType == 'container'
        }})
        var container_cons = mineral.pos.findInRange(FIND_MY_CONSTRUCTION_SITES,1,{filter:(stru)=>{
            return stru.structureType == 'container'
        }})
        if (container_.length <= 0 && container_cons.length<=0)
        {
            /* 建立container */
            var result:RoomPosition[] = []
            var terrain = new Room.Terrain(this.name)
            var xs = [mineral.pos.x-1,mineral.pos.x,mineral.pos.x+1]
            var ys = [mineral.pos.y-1,mineral.pos.y,mineral.pos.y+1]
            xs.forEach(
                x=>ys.forEach(
                    y=>{
                        if (terrain.get(x,y) != TERRAIN_MASK_WALL)
                        {
                            result.push(new RoomPosition(x,y,this.name))
                        }
                    }
                )
            )
            for (var p of result)
            {
                if (p.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0 && p.lookFor(LOOK_STRUCTURES).length <=0)
                {
                    p.createConstructionSite('container')
                    return
                }
            } 
            return   
        }
        if (container_.length <= 0)
        {
            return
        }
        /* 建筑都到位了，开始下任务 */
        var storage_ = Game.getObjectById(this.memory.StructureIdData.storageID) as StructureStorage
        if (!storage_) return
        /* 如果矿物饱和，挂任务卖原矿 */
        if (storage_.store.getUsedCapacity(this.memory.mineralType) > 200000)
        {
            if (!this.memory.market) this.memory.market = {}
            if (!this.memory.market['deal']) this.memory.market['deal'] = []
            var bR = true
            for (var od of this.memory.market['deal'])
            {
                if (od.rType == this.memory.mineralType)
                bR = false
            }
            if (bR){
                /* 下达自动deal的任务 */
                this.memory.market['deal'].push({rType:this.memory.mineralType,num:30000})
            }
        }
        /* 防止挖矿致死 */
        if (storage_.store.getFreeCapacity() > 200000 && storage_.store.getUsedCapacity(this.memory.mineralType) < 200000)
        {
            // 下达挖矿任务
            var thisTask:MissionModel = {
                name:'原矿开采',
                range:'Creep',
                delayTick:50000,
                level:10,
                Data:{
                },
            }
            thisTask.CreepBind = {'mineral':{num:1,bind:[]}}
            this.AddMission(thisTask)
        }
    }
}