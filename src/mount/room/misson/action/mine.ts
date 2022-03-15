import { isInArray, unzipPosition, zipPosition } from "@/utils"


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

    /* 房间外矿处理任务 只适用于一般外矿 */
    public Task_OutMine(misson:MissionModel):void{
        if ((Game.time - global.Gtime[this.name]) % 13) return
        if (!misson.Data.state) misson.Data.state = 1   // 默认状态1
        misson.CreepBind['out-claim'].num = 1
        let disRoomName = misson.Data.disRoom
        if (!Memory.outMineData[disRoomName]) Memory.outMineData[disRoomName] = {road:[],startpoint:misson.Data.startpoint,minepoint:[],mineType:'normal'}
        // 相关爬虫死亡后的数据擦除
        if (Memory.outMineData[disRoomName].minepoint && Memory.outMineData[disRoomName].minepoint.length > 0)
        {
            for (var obj of Memory.outMineData[disRoomName].minepoint)
            {
                if (obj.bind && obj.bind.harvest && !Game.creeps[obj.bind.harvest]) delete obj.bind.harvest
                if (obj.bind && obj.bind.car && !Game.creeps[obj.bind.car]) delete obj.bind.car
            }
        }
        if (misson.Data.state == 1) // 初始化状态
        {
            /* 状态1下仅仅获取外矿信息和派出claimer */
            if (Game.rooms[disRoomName])
            {
                var sources = Game.rooms[disRoomName].find(FIND_SOURCES)
                if (sources.length <= 0)
                {
                    Game.notify(`房间${disRoomName}未发现能量点！删除外矿任务！`)
                    this.DeleteMission(misson.id)
                    return
                }
                /* 说明有该房间的视野了 先查找矿点 */
                if (Memory.outMineData[disRoomName].minepoint.length < sources.length)
                {
                    LoopS:
                    for (var s of sources)
                    {
                        for (var m of Memory.outMineData[disRoomName].minepoint)
                        {
                            if (m.pos == zipPosition(s.pos))
                                continue LoopS
                        }
                        Memory.outMineData[disRoomName].minepoint.push({pos:zipPosition(s.pos),bind:{}})
                    }
                    return
                }
                /* 矿点信息更新完毕了 接下来更新路线信息 */
                if (!misson.Data.roadUpdated)
                {
                    var startpos = unzipPosition(Memory.outMineData[disRoomName].startpoint)
                    if (!startpos) {console.log(`${startpos}不能解压成RoomPosition对象`);return}
                    /* 每个矿点都要有一个路线信息 */
                    for (var s of sources)
                    {
                        var results = startpos.FindPath(s.pos,1)
                        LoopB:
                        for (var p of results)
                        {
                            if (p.isNearTo(s.pos)) continue
                            if (isInArray([0,49],p.x) || isInArray([0,49],p.y)) continue LoopB
                            /* 如果不再路径点缓存中，就push进路径列表中 */
                            if (!isInArray(Memory.outMineData[disRoomName].road,zipPosition(p)))
                            {
                                Memory.outMineData[disRoomName].road.push(zipPosition(p))
                            }
                        }
                    }
                    misson.Data.roadUpdated = true
                    return
                }
                /* 先看路径点中是否有本房间的位置点，有的话就创建工地 */
                for (var mess of Memory.outMineData[disRoomName].road)
                {
                    if (unzipPosition(mess).roomName == this.name)
                    {
                        unzipPosition(mess).createConstructionSite('road')
                        //var index = Memory.outMineData[disRoomName].road.indexOf(mess)
                        //Memory.outMineData[disRoomName].road.splice(index,1)
                    }
                }
                /* 路线信息更新完毕 接下来进入阶段2 */
                misson.Data.state = 2
            }
        }
        else if (misson.Data.state == 2)    // 采集状态 [正常状态]
        {
            misson.CreepBind['out-harvest'].num = Memory.outMineData[disRoomName].minepoint.length
            misson.CreepBind['out-defend'].num = 0
            if (Memory.outMineData[disRoomName].car)
            {
                misson.CreepBind['out-car'].num = Memory.outMineData[disRoomName].minepoint.length
            }
            else misson.CreepBind['out-car'].num = 0
        }
        else if (misson.Data.state == 3)    // 防御状态
        {
            misson.CreepBind['out-harvest'].num = 0
            misson.CreepBind['out-car'].num = 0
            misson.CreepBind['out-defend'].num = 2
            if (Game.rooms[misson.Data.disRoom])
            {
                var enemys = Game.rooms[misson.Data.disRoom].find(FIND_HOSTILE_CREEPS,{filter:(creep)=>{
                    return !isInArray(Memory.whitesheet,creep.owner.username)
                }})
                var InvaderCore = Game.rooms[misson.Data.disRoom].find(FIND_STRUCTURES,{filter:(stru)=>{
                    return stru.structureType == STRUCTURE_INVADER_CORE
                }})
                if (enemys.length <=0 && InvaderCore.length <= 0)
                    misson.Data.state = 2
            }
        }
    }
}