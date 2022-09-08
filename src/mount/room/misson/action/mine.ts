import { Colorful, isInArray, unzipPosition, zipPosition } from "@/utils"
import { zipMap } from "@/constant/ResourceConstant"

/* 房间原型拓展   --行为  --采矿任务 */
export default class RoomMissonMineExtension extends Room {
    /* 房间内矿资源采集发布任务 */
    public Task_monitorMineral(): void {
        if ((Game.time - global.Gtime[this.name]) % 67) return
        if (this.controller.level < 6) return
        if (!this.memory.StructureIdData.mineralID) return
        if (this.MissionNum('Creep', '原矿开采') > 0) return
        var mineral = Game.getObjectById(this.memory.StructureIdData.mineralID) as Mineral
        if (!mineral || mineral.ticksToRegeneration) return
        if (!this.memory.mineralType) this.memory.mineralType = mineral.mineralType
        if (this.controller.level >= 6 && !this.memory.StructureIdData.extractID) {
            /* 寻找矿物点 在其附近撒下建筑 */
            if (!mineral.pos.GetStructure('extractor') && mineral.pos.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0) {
                mineral.pos.createConstructionSite('extractor')
                return
            }
            return
        }
        /* 寻找mineralContainerID */
        var container_ = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: (stru) => {
                return stru.structureType == 'container'
            }
        })
        var container_cons = mineral.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {
            filter: (stru) => {
                return stru.structureType == 'container'
            }
        })
        if (container_.length <= 0 && container_cons.length <= 0) {
            /* 建立container */
            var result: RoomPosition[] = []
            var terrain = new Room.Terrain(this.name)
            var xs = [mineral.pos.x - 1, mineral.pos.x, mineral.pos.x + 1]
            var ys = [mineral.pos.y - 1, mineral.pos.y, mineral.pos.y + 1]
            xs.forEach(
                x => ys.forEach(
                    y => {
                        if (terrain.get(x, y) != TERRAIN_MASK_WALL) {
                            result.push(new RoomPosition(x, y, this.name))
                        }
                    }
                )
            )
            for (var p of result) {
                if (p.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0 && p.lookFor(LOOK_STRUCTURES).length <= 0) {
                    p.createConstructionSite('container')
                    return
                }
            }
            return
        }
        if (container_.length <= 0) {
            return
        }
        /* 建筑都到位了，开始下任务 */
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        /* 如果矿物饱和，自动进行打包操作 */
        if (storage_.store.getUsedCapacity(this.memory.mineralType) > 100000) {
            let factory_ = this.GetStructData(STRUCTURE_FACTORY) as StructureFactory
            // console.log('矿物饱和打包',this.name,zipMap[this.memory.mineralType],Object.keys(this.memory.productData.unzip).length,JSON.stringify(factory_))
            if (factory_ && zipMap[this.memory.mineralType] && Object.keys(this.memory.productData.unzip).length < 1) {
                // console.log('矿物饱和打包',this.name,this.memory.productData.state)
                // let storage_zip_number = Number(storage_.store.getUsedCapacity(zipMap[this.memory.mineralType]))
                // factory_.add(zipMap[this.memory.mineralType], 6000 + storage_zip_number)
                if (this.memory.productData.state == 'sleep') {
                    this.memory.productData.state = 'base'
                    this.memory.productData.producing = { com: zipMap[this.memory.mineralType], num: 6000 }
                }
            }
            // if (!this.memory.market) this.memory.market = {}
            // if (!this.memory.market['deal']) this.memory.market['deal'] = []
            // var bR = true
            // for (var od of this.memory.market['deal']) {
            //     if (od.rType == this.memory.mineralType)
            //         bR = false
            // }
            // if (bR) {
            //     /* 下达自动deal的任务 */
            //     this.memory.market['deal'].push({ rType: this.memory.mineralType, num: 30000, mTyep: 'sell'  })
            // }
        }
        /* 防止挖矿致死 */
        if (storage_.store.getFreeCapacity() > 100000 && storage_.store.getUsedCapacity(this.memory.mineralType) < 220000) {
            // 下达挖矿任务
            var thisTask: MissionModel = {
                name: '原矿开采',
                range: 'Creep',
                delayTick: 50000,
                level: 10,
                Data: {
                },
            }
            thisTask.CreepBind = { 'mineral': { num: 1, bind: [] } }
            this.AddMission(thisTask)
        }
    }

    /* 房间外矿处理任务 只适用于一般外矿 */
    public Task_OutMine(misson: MissionModel): void {
        if ((Game.time - global.Gtime[this.name]) % 13) return
        if (!misson.Data.state) misson.Data.state = 1   // 默认状态1
        misson.CreepBind['out-claim'].num = 1
        let disRoomName = misson.Data.disRoom
        if (!Memory.outMineData[disRoomName]) Memory.outMineData[disRoomName] = { road: [], startpoint: misson.Data.startpoint, minepoint: [], mineType: 'normal' }
        // 相关爬虫死亡后的数据擦除

        if (Memory.outMineData[disRoomName].minepoint && Memory.outMineData[disRoomName].minepoint.length > 0 && Memory.outMineData[disRoomName].mineType == 'normal') {
            for (var obj of Memory.outMineData[disRoomName].minepoint) {
                if (obj.bind && obj.bind.harvest && !Game.creeps[obj.bind.harvest]) delete obj.bind.harvest
                if (obj.bind && obj.bind.car && !Game.creeps[obj.bind.car]) delete obj.bind.car
            }
        }
        if (misson.Data.state == 1) // 初始化状态
        {
            /* 状态1下仅仅获取外矿信息和派出claimer */
            if (Game.rooms[disRoomName]) {
                var sources = Game.rooms[disRoomName].find(FIND_SOURCES)
                if (sources.length <= 0) {
                    Game.notify(`房间${disRoomName}未发现能量点！删除外矿任务！`)
                    this.DeleteMission(misson.id)
                    return
                }
                /* 说明有该房间的视野了 先查找矿点 */
                if (Memory.outMineData[disRoomName].minepoint.length < sources.length) {
                    LoopS:
                    for (var s of sources) {
                        for (var m of Memory.outMineData[disRoomName].minepoint) {
                            if (m.pos == zipPosition(s.pos))
                                continue LoopS
                        }
                        Memory.outMineData[disRoomName].minepoint.push({ pos: zipPosition(s.pos), bind: {} })
                    }
                    return
                }
                /* 矿点信息更新完毕了 接下来更新路线信息 */
                if (!misson.Data.roadUpdated) {
                    Memory.outMineData[disRoomName].road = [];
                    var startpos = unzipPosition(Memory.outMineData[disRoomName].startpoint)
                    if (!startpos) { console.log(`${startpos}不能解压成RoomPosition对象`); return }
                    /* 每个矿点都要有一个路线信息 */
                    for (var s of sources) {
                        var results = s.pos.FindPath(startpos, 1, misson.Data.roadUpdatedforce)
                        LoopB:
                        for (var p of results) {
                            if (p.isNearTo(s.pos)) continue
                            if (isInArray([0, 49], p.x) || isInArray([0, 49], p.y)) continue LoopB
                            /* 如果不再路径点缓存中，就push进路径列表中 */
                            if (!isInArray(Memory.outMineData[disRoomName].road, zipPosition(p))) {
                                Memory.outMineData[disRoomName].road.push(zipPosition(p))
                            }
                        }
                    }
                    misson.Data.roadUpdated = true
                    misson.Data.roadUpdatedforce = false;
                    return
                }
                /* 先看路径点中是否有本房间的位置点，有的话就创建工地 */
                for (var mess of Memory.outMineData[disRoomName].road) {
                    if (unzipPosition(mess).roomName == this.name) {
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
            if (Memory.outMineData[disRoomName].car) {
                misson.CreepBind['out-car'].num = Memory.outMineData[disRoomName].minepoint.length
            }
            else misson.CreepBind['out-car'].num = 0
        }
        else if (misson.Data.state == 3)    // 防御状态
        {
            misson.CreepBind['out-harvest'].num = 0
            misson.CreepBind['out-car'].num = 0
            misson.CreepBind['out-defend'].num = 1
            if (Game.rooms[misson.Data.disRoom]) {
                var enemys = Game.rooms[misson.Data.disRoom].find(FIND_HOSTILE_CREEPS, {
                    filter: (creep) => {
                        return !isInArray(Memory.whitesheet, creep.owner.username) && (creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0)
                    }
                })
                var InvaderCore = Game.rooms[misson.Data.disRoom].find(FIND_STRUCTURES, {
                    filter: (stru) => {
                        return stru.structureType == STRUCTURE_INVADER_CORE
                    }
                })
                if (enemys.length <= 0 && InvaderCore.length <= 0)
                    misson.Data.state = 2
            }
        }
    }

    /* 过道采集监控发布任务 */
    public Task_Cross(misson: MissionModel): void {

        if (this.controller.level < 8 || !this.memory.StructureIdData.ObserverID) return
        if (Game.cpu.bucket < 9500 && Memory.StopPixel) return/*CPU不足情况下不进行任务发布*/
        if (this.memory.switch.StopCross) return
        var observer_ = Game.getObjectById(this.memory.StructureIdData.ObserverID) as StructureObserver
        if (!observer_) { delete this.memory.StructureIdData.ObserverID; return }
        if (!misson.Data.relateRooms) misson.Data.relateRooms = []
        if (misson.Data.relateRooms.length <= 0) return
        if (!misson.Data.index) misson.Data.index = 0
        if (!misson.Data.state) misson.Data.state = 1
        if (misson.Data.state == 1) {
            // let a = Game.cpu.getUsed();
            /* 观察房间 */
            if (misson.Data.relateRooms[misson.Data.index]) {
                observer_.observeRoom(misson.Data.relateRooms[misson.Data.index])
            }
            // console.log(`observer正在观察房间${misson.Data.relateRooms[misson.Data.index]}`)
            /* 获取上个tick的房间名 */
            let beforRoom: string
            if (misson.Data.relateRooms.length == 1) beforRoom = misson.Data.relateRooms[0]
            else if (misson.Data.relateRooms.length > 1) {
                if (misson.Data.index == 0) beforRoom = misson.Data.relateRooms[misson.Data.relateRooms.length - 1]
                else beforRoom = misson.Data.relateRooms[misson.Data.index - 1]
            }
            if (Game.rooms[beforRoom]) {
                /* 查找power和deposit */
                // console.log('扫描房间',this.name)
                if (misson.Data.power) {
                    this.Add_Cross_power(beforRoom);
                }
                if (misson.Data.deposit) {
                    this.Add_Cross_deposit(beforRoom);
                }
            }

            if (misson.Data.index > misson.Data.relateRooms.length) {
                misson.Data.index = 0
                misson.Data.time = Game.time
                misson.Data.state = 2
            } else {
                misson.Data.index++
            }
            // let b = Game.cpu.getUsed();
            // console.log(this.name, beforRoom, b - a)
        }
        else if (misson.Data.state == 2) {
            if (Game.time - misson.Data.time != 0 && (Game.time - misson.Data.time) % 60 == 0) {
                misson.Data.state = 1
                // console.log(Colorful("进入观察模式",'blue'))
            }
        }

    }
    public Add_Cross_deposit(beforRoom) {
        if (this.MissionNum('Creep', 'deposit采集') >= 2) return
        var deposit = Game.rooms[beforRoom].find(FIND_DEPOSITS, {
            filter: (stru) => {
                return stru.ticksToDecay >= 3800 && stru.lastCooldown < 100
            }
        })
        if (deposit.length < 1) return
        for (let _dp of deposit) {
            let _ob_pos = zipPosition(_dp.pos)
            let BR = true
            if (Memory.ObserverList[_ob_pos]) continue;/*这里将会过滤无法到达的位置以及已经进行任务发布的任务*/
            for (var i of this.memory.Misson['Creep']) {
                if (i.name == 'deposit采集' && i.Data.room == beforRoom) {
                    BR = false
                }
            }
            if (BR) {
                /*检查shard 以及是否需要新手区检测*/
                // if (!this.Check_Cross_newbies(_dp.pos)) continue;
                /*检测dp可以挖掘的位置数量*/
                var harvest_void: RoomPosition[] = _dp.pos.getSourceVoid()
                /* 下达采集任务 */
                var thisTask = this.public_DepositHarvest(beforRoom, _dp.pos.x, _dp.pos.y, _dp.depositType, harvest_void.length)
                if (thisTask != null) {
                    thisTask.Data.deposit_id = _dp.id;
                    this.AddMission(thisTask)
                    Memory.ObserverList[_ob_pos] = Game.time;/*进行状态标记操作*/
                }
            }
        }

    }

    public Add_Cross_power(beforRoom) {
        if (this.MissionNum('Creep', 'power采集') >= 2) return
        var powerbank = Game.rooms[beforRoom].find(FIND_STRUCTURES, {
            filter: (stru) => {
                return stru.structureType == 'powerBank' && stru.ticksToDecay >= 3600 && stru.power > 3000
            }
        }) as StructurePowerBank[]
        if (powerbank.length < 1) return
        for (let _pw of powerbank) {
            let _ob_pos = zipPosition(_pw.pos)
            let BR = true
            if (Memory.ObserverList[_ob_pos]) continue;/*这里将会过滤无法到达的位置以及已经进行任务发布的任务*/
            for (var i of this.memory.Misson['Creep']) {
                if (i.name == 'power采集' && i.Data.room == beforRoom && i.Data.x == _pw.pos.x && i.Data.y == _pw.pos.y) {
                    BR = false
                }
            }
            if (BR) {
                /*检查shard 以及是否需要新手区检测*/
                // if (!this.Check_Cross_newbies(_pw.pos)) continue;
                /* 下达采集任务 */
                var thisTask = this.public_PowerHarvest(beforRoom, _pw.pos.x, _pw.pos.y, _pw.power)
                if (thisTask != null) {
                    this.AddMission(thisTask)
                    Memory.ObserverList[_ob_pos] = Game.time;/*进行状态标记操作*/
                }
            }
        }
    }

    // public Check_Cross_newbies(pos: RoomPosition): boolean {
    //     if (Game.shard.name != 'shard3') return true;
    //     const targets = [
    //         Game.rooms[pos.roomName].getPositionAt(pos.x, pos.y)
    //     ];
    //     const closest = this.storage.pos.findClosestByRange(targets);
    //     if (closest) return true;
    //     /*如果不存在路径则进行存储防止后续的刷新操作*/
    //     console.log(this.name, JSON.stringify(pos), '无法到达', JSON.stringify(closest))
    //     let _ob_pos = zipPosition(pos)
    //     Memory.ObserverList[_ob_pos] = Game.time;
    //     return false;
    // }

    /* Power采集 */
    public Task_PowerHarvest(misson: MissionModel): void {
        if (this.controller.level < 8) return
        if (!misson.Data.state) misson.Data.state = 1
        if (misson.Data.state == 1) {
            misson.CreepBind['power-carry'].num = 0
        }
        else if (misson.Data.state == 2) {
            if (!misson.Data.down) misson.Data.down = false
            if (!misson.Data.down) {
                misson.CreepBind['power-carry'].num = Math.ceil(misson.Data.num / 1600)
                misson.Data.down = true
            }
            misson.CreepBind['power-attack'].num = 0
            misson.CreepBind['power-heal'].num = 0
            if (misson.CreepBind['power-carry'].num == misson.CreepBind['power-carry'].bind.length && misson.CreepBind['power-carry'].num != 0) {
                misson.CreepBind['power-carry'].num = 0
            }
            if (misson.CreepBind['power-attack'].bind.length <= 0 && misson.CreepBind['power-heal'].bind.length <= 0 && misson.CreepBind['power-carry'].bind.length <= 0
                && misson.CreepBind['power-carry'].num <= 0) {
                this.DeleteMission(misson.id)
            }
        }
    }

}