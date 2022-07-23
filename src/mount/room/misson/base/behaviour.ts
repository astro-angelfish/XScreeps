import { ResourceCanDispatch } from "@/module/dispatch/resource"
import { checkBuy, checkDispatch, checkSend, DispatchNum, resourceMap } from "@/module/fun/funtion"
import { Colorful, isInArray, GenerateAbility } from "@/utils"
import { LabMap, unzipMap } from "@/constant/ResourceConstant"

/* 房间原型拓展   --任务  --基本功能 */
export default class RoomMissonBehaviourExtension extends Room {
    // 搬运基本任务
    public Task_Carry(misson: MissionModel): void {
        /* 搬运任务需求 sourcePosX,Y sourceRoom targetPosX,Y targetRoom num  rType  */
        // 没有任务数据 或者数据不全就取消任务
        if (!misson.Data) this.DeleteMission(misson.id)
        if (!misson.CreepBind) this.DeleteMission(misson.id)
    }

    // 搬运基本任务
    public Task_Carrysenior(mission: MissionModel): void {
        /* 搬运任务需求 sourcePosX,Y sourceRoom targetPosX,Y targetRoom num  rType  */
        // 没有任务数据 或者数据不全就取消任务
        if (mission.CreepBind.truckshard.num > 0) {
            let level = mission.Data.level
            if (level == 'T3') {
                global.MSB[mission.id] = { 'truckshard': GenerateAbility(0, 40, 10, 0, 0, 0, 0, 0) }
            }
            if ((Game.time - global.Gtime[this.name]) % 8) return
            if (mission.LabBind) {
                if (!this.Check_Lab(mission, 'transport', 'complex')) { }
            }
        }

        if (!mission.Data) this.DeleteMission(mission.id)
        if (!mission.CreepBind) this.DeleteMission(mission.id)
    }
    // 建造任务
    public Constru_Build(): void {
        if (Game.time % 51) return
        if (this.controller.level < 5) return
        var myConstrusion = this.find(FIND_MY_CONSTRUCTION_SITES)
        if (myConstrusion.length > 0) {
            /* 添加一个进孵化队列 */
            if (this.memory.state == 'war') {
                this.NumSpawn('build', 1)
            } else {
                if (myConstrusion.length > 10) {
                    let _number = Math.ceil(myConstrusion.length / 10);
                    _number = _number > 3 ? 3 : _number;
                    this.NumSpawn('build', _number)
                } else {
                    this.NumSpawn('build', 1)
                    // if ((!this.storage || !this.terminal) && this.controller.level >= 8) {
                    //     this.NumSpawn('build', 3)
                    // }
                }
            }
        }
        else {
            if (this.memory.SpawnConfig['build']) { delete this.memory.SpawnConfig['build'] }
        }
    }

    // 资源link资源转移至centerlink中
    public Task_CenterLink(): void {
        if ((global.Gtime[this.name] - Game.time) % 2) return
        if (!this.memory.StructureIdData.source_links) this.memory.StructureIdData.source_links = []
        if (!this.memory.StructureIdData.center_link || this.memory.StructureIdData.source_links.length <= 0) return
        // let center_link = Game.getObjectById(this.memory.StructureIdData.center_link) as StructureLink
        // if (!center_link) { delete this.memory.StructureIdData.center_link; return }
        // else { if (center_link.store.getUsedCapacity('energy') > 750) return }
        // this.getStructure(STRUCTURE_LINK)
        let source_links = this.getStructureData(STRUCTURE_LINK, 'source_links', this.memory.StructureIdData.source_links)
        for (let source_link of source_links as StructureLink[]) {
            // let source_link = Game.getObjectById(id) as StructureLink
            if (!source_link) {
                let index = this.memory.StructureIdData.source_links.indexOf(source_link.id)
                this.memory.StructureIdData.source_links.splice(index, 1)
                return
            }
            if (source_link.cooldown > 0) { continue; }
            if (source_link.store.getUsedCapacity('energy') < 700) { continue; }
            /*检查up_link状态*/
            if (this.memory.StructureIdData.upgrade_link) {
                let upgrade_link = this.getStructureData(STRUCTURE_LINK, 'upgrade_link', [this.memory.StructureIdData.upgrade_link])[0] as StructureLink
                // let upgrade_link = Game.getObjectById(this.memory.StructureIdData.upgrade_link) as StructureLink
                if (upgrade_link && upgrade_link.store.getFreeCapacity('energy') > 600) {
                    var thisTask = this.public_link([source_link.id], upgrade_link.id, 10)
                    this.AddMission(thisTask)
                    return
                }
            }
            /*检查中央link*/
            if (this.memory.StructureIdData.center_link) {
                let center_link = this.getStructureData(STRUCTURE_LINK, 'center_link', [this.memory.StructureIdData.center_link])[0] as StructureLink
                // let center_link = Game.getObjectById(this.memory.StructureIdData.center_link) as StructureLink
                if (center_link && center_link.store.getFreeCapacity('energy') > 600) {
                    var thisTask = this.public_link([source_link.id], center_link.id, 10)
                    this.AddMission(thisTask)
                }
                /*没有对应任务提前结束*/
                return
            }
            // if (source_link.store.getUsedCapacity('energy') >= 600 && this.Check_Link(source_link.pos, center_link.pos)) {
            //     var thisTask = this.public_link([source_link.id], center_link.id, 10)
            //     this.AddMission(thisTask)
            //     return
            // }
        }
    }

    // 消费link请求资源 例如升级Link
    public Task_ComsumeLink(): void {
        if ((global.Gtime[this.name] - Game.time) % 7) return
        if (!this.memory.StructureIdData.center_link) return
        let center_link = this.getStructureData(STRUCTURE_LINK, 'center_link', [this.memory.StructureIdData.center_link])[0] as StructureLink
        // let center_link = Game.getObjectById(this.memory.StructureIdData.center_link) as StructureLink
        if (!center_link) { delete this.memory.StructureIdData.center_link; return }
        if (this.memory.StructureIdData.upgrade_link) {
            let upgrade_link = this.getStructureData(STRUCTURE_LINK, 'upgrade_link', [this.memory.StructureIdData.upgrade_link])[0] as StructureLink
            // let upgrade_link = Game.getObjectById(this.memory.StructureIdData.upgrade_link) as StructureLink
            if (!upgrade_link) { delete this.memory.StructureIdData.upgrade_link; return }
            if (upgrade_link.store.getUsedCapacity('energy') < 400) {
                var thisTask = this.public_link([center_link.id], upgrade_link.id, 25)
                this.AddMission(thisTask)
                return
            }
            if (this.memory.StructureIdData.comsume_link.length > 0) {
                let comsume_link = this.getStructureData(STRUCTURE_LINK, 'comsume_link', [this.memory.StructureIdData.comsume_link]) as StructureLink[]
                for (var l of comsume_link) {
                    // let l = Game.getObjectById(i) as StructureLink
                    if (!l) {
                        let index = this.memory.StructureIdData.comsume_link.indexOf(l.id)
                        this.memory.StructureIdData.comsume_link.splice(index, 1)
                        return
                    }
                    if (l.store.getUsedCapacity('energy') > 500) {
                        var thisTask = this.public_link([center_link.id], l.id, 35)
                        this.AddMission(thisTask)
                        return
                    }
                }
            }
        }
    }

    // lab合成任务 （底层）
    public Task_Compound(misson: MissionModel): void {
        if (Game.time % 5) return
        if (!this.memory.StructureIdData.labInspect || Object.keys(this.memory.StructureIdData.labInspect).length < 3) return
        let storage_ = this.storage as StructureStorage
        let terminal_ = this.terminal as StructureTerminal
        if (misson.Data.num <= -50 || !storage_ || !terminal_)  // -50 为误差允许值
        {
            this.DeleteMission(misson.id)
            return
        }
        let raw1 = Game.getObjectById(this.memory.StructureIdData.labInspect.raw1) as StructureLab
        let raw2 = Game.getObjectById(this.memory.StructureIdData.labInspect.raw2) as StructureLab
        if (!raw1 || !raw2) {
            this.DeleteMission(misson.id)
            return
        }
        if (raw1.mineralType && raw1.mineralType != misson.Data.raw1 && this.Check_Carry('transport', raw1.pos, storage_.pos, raw1.mineralType)) {
            var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 30, this.name, raw1.pos.x, raw1.pos.y, this.name, storage_.pos.x, storage_.pos.y, raw1.mineralType, raw1.store.getUsedCapacity(raw1.mineralType))
            this.AddMission(thisTask)
            return
        }
        if (raw2.mineralType && raw2.mineralType != misson.Data.raw2 && this.Check_Carry('transport', raw2.pos, storage_.pos, raw2.mineralType)) {
            var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 30, this.name, raw2.pos.x, raw2.pos.y, this.name, storage_.pos.x, storage_.pos.y, raw2.mineralType, raw2.store.getUsedCapacity(raw2.mineralType))
            this.AddMission(thisTask)
            return
        }
        let re = false
        let comData = []
        for (let bindLab in misson.LabBind) {
            if (!isInArray([misson.Data.raw1, misson.Data.raw2], misson.LabBind[bindLab])) comData.push(bindLab)
        }
        for (let i of comData) {
            var thisLab = Game.getObjectById(i) as StructureLab
            if (!thisLab) {
                let index = this.memory.StructureIdData.labs.indexOf(i)
                this.memory.StructureIdData.labs.splice(index, 1)
                continue
            }
            if (thisLab.mineralType && thisLab.mineralType != misson.LabBind[i] && this.Check_Carry('transport', thisLab.pos, storage_.pos, thisLab.mineralType)) {
                // 说明该lab内有异物
                var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 30, this.name, thisLab.pos.x, thisLab.pos.y, this.name, storage_.pos.x, storage_.pos.y, thisLab.mineralType, thisLab.store.getUsedCapacity(thisLab.mineralType))
                this.AddMission(thisTask)
                return
            }
            if (thisLab.cooldown) continue
            let comNum = 5
            if (thisLab.effects && thisLab.effects.length > 0) {
                for (var effect_ of thisLab.effects) {
                    if (effect_.effect == PWR_OPERATE_LAB) {
                        var level = effect_.level
                        comNum += level * 2
                    }
                }
            }
            if (thisLab.runReaction(raw1, raw2) == OK) { misson.Data.num -= comNum }
            if (thisLab.mineralType && thisLab.store.getUsedCapacity(thisLab.mineralType) >= 2500 && this.RoleMissionNum('transport', '物流运输') < 2 && this.Check_Carry('transport', thisLab.pos, storage_.pos, thisLab.mineralType)) {
                /* 资源快满了就要搬运 */
                re = true
                var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 30, this.name, thisLab.pos.x, thisLab.pos.y, this.name, storage_.pos.x, storage_.pos.y, thisLab.mineralType, thisLab.store.getUsedCapacity(thisLab.mineralType))
                this.AddMission(thisTask)
                continue
            }
        }
        if (re) return
        /* 源lab缺资源就运 */
        if (storage_.store.getUsedCapacity(misson.Data.raw1) > 0)
            if (raw1.store.getUsedCapacity(misson.Data.raw1) < 500 && this.RoleMissionNum('transport', '物流运输') < 2 && this.Check_Carry('transport', storage_.pos, raw1.pos, misson.Data.raw1)) {
                var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 30, this.name, storage_.pos.x, storage_.pos.y, this.name, raw1.pos.x, raw1.pos.y, misson.Data.raw1, storage_.store.getUsedCapacity(misson.Data.raw1) >= 1000 ? 1000 : storage_.store.getUsedCapacity(misson.Data.raw1))
                this.AddMission(thisTask)
            }
        if (storage_.store.getUsedCapacity(misson.Data.raw2) > 0)
            if (raw2.store.getUsedCapacity(misson.Data.raw2) < 500 && this.RoleMissionNum('transport', '物流运输') < 2 && this.Check_Carry('transport', storage_.pos, raw2.pos, misson.Data.raw2)) {
                var thisTask = this.public_Carry({ 'transport': { num: 1, bind: [] } }, 30, this.name, storage_.pos.x, storage_.pos.y, this.name, raw2.pos.x, raw2.pos.y, misson.Data.raw2, storage_.store.getUsedCapacity(misson.Data.raw2) >= 1000 ? 1000 : storage_.store.getUsedCapacity(misson.Data.raw2))
                this.AddMission(thisTask)
            }
        /* 资源调度 */
        var needResource: ResourceConstant[] = [misson.Data.raw1, misson.Data.raw2]
        if (this.MissionNum('Structure', '资源购买') > 0) return // 存在资源购买任务的情况下，不执行资源调度
        if (DispatchNum(this.name) >= 2) return // 资源调度数量过多则不执行资源调度
        let buy = false
        if (!Game.cpu.generatePixel) { buy = true }
        for (var resource_ of needResource) {
            // 原矿 资源调用
            if (storage_.store.getUsedCapacity(resource_) + terminal_.store.getUsedCapacity(resource_) < 10000 && isInArray(['H', 'O', 'K', 'L', 'X', 'U', 'Z'], resource_)) {
                if (checkDispatch(this.name, resource_)) continue  // 已经存在调用信息的情况
                if (checkSend(this.name, resource_)) continue  // 已经存在其它房间的传送信息的情况
                console.log(Colorful(`[资源调度]<lab com> 房间${this.name}没有足够的资源[${resource_}],将执行资源调度!`, 'yellow'))
                let dispatchTask: RDData = {
                    sourceRoom: this.name,
                    rType: resource_,
                    num: 10000,
                    delayTick: 200,
                    conditionTick: 35,
                    buy: buy,
                    mtype: 'deal'
                }
                Memory.ResourceDispatchData.push(dispatchTask)
                return
            }
            // 其他中间物 资源调用
            else if (storage_.store.getUsedCapacity(resource_) + terminal_.store.getUsedCapacity(resource_) < 1000 && !isInArray(['H', 'O', 'K', 'L', 'X', 'U', 'Z'], resource_)) {
                if (checkDispatch(this.name, resource_)) continue  // 已经存在调用信息的情况
                if (checkSend(this.name, resource_)) continue  // 已经存在其它房间的传送信息的情况
                console.log(Colorful(`[资源调度]<lab com> 房间${this.name}没有足够的资源[${resource_}],将执行资源调度!`, 'yellow'))
                let dispatchTask: RDData = {
                    sourceRoom: this.name,
                    rType: resource_,
                    num: 2000,
                    delayTick: 100,
                    conditionTick: 25,
                    buy: buy,
                    mtype: 'deal'
                }
                Memory.ResourceDispatchData.push(dispatchTask)
                return
            }
        }
    }
    /*Factory自动压缩和解压操作基于房间的设定*/
    public Task_FactoryAutomatic(): void {
        if ((Game.time - global.Gtime[this.name]) % 35) return
        /*必须storage terminal 同时存在*/
        if (!this.storage) return;
        if (!this.terminal) return;

        /*解压缩设定*/
        if (this.memory.DynamicConfig.Dynamicfactoryuncondense) {
            if (!_.isEmpty(this.memory.productData.unzip)) return   /*已有解压任务的情况下不做处理*/
            /*检索以下特定资源*/
            for (let bar in unzipMap) {
                let resource = unzipMap[bar];
                let resource_store = this.storage.store.getUsedCapacity(resource as ResourceConstant) + this.terminal.store.getUsedCapacity(resource as ResourceConstant)
                let bar_store = this.storage.store.getUsedCapacity(bar as ResourceConstant) + this.terminal.store.getUsedCapacity(bar as ResourceConstant)
                if (bar_store < 1000) continue;
                if (bar_store > 0 && resource_store < (resource == RESOURCE_ENERGY ? 300000 : 20000)) {
                    let un_number = bar_store > 1000 ? 1000 : bar_store;
                    this.memory.productData.unzip[bar] = { num: Math.trunc(un_number / 100) * 100 }
                    return
                }
            }
        }
        if (this.memory.DynamicConfig.Dynamicfactorycondense) {

        }
    }

    // Lab自动合成 根据预想设定在目标房间中保持固定数量的对应资源
    public Task_LabAutomatic(): void {
        if ((Game.time - global.Gtime[this.name]) % 50) return
        if (!this.memory.Labautomatic.automaticState) return
        if (this.memory.Labautomatic.automaticData.length < 1) { this.memory.Labautomatic.automaticState = false; return }
        /*进行自动合成操作*/
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        var terminal_ = this.terminal as StructureTerminal
        if (!terminal_) return
        let MissionName = this.MissionName('Room', '资源合成')
        if (MissionName) {

            /*有任务的情况下检查是否满足继续合成的要求*/
            /*进行任务规则匹配操作-首先获取任务目标信息*/
            let Type = null;
            let Raw = [];
            let RawState = false;
            for (let Message in MissionName.LabMessage) {

                switch (MissionName.LabMessage[Message]) {
                    case 'com':
                        Type = Message;
                        break;
                    case 'raw':
                        Raw.push(Message)
                        break;
                }
            }

            if (!Type) {/*获取合成产物失败,取消任务同时终止*/this.DeleteMission(MissionName.id); return }
            /*检查是否完整占用任务*/
            if (Object.keys(this.memory.RoomLabBind).length < 10) {
                this.DeleteMission(MissionName.id)
                var thisTask = this.public_Compound(MissionName.Data.num, Type)
                if (thisTask) {
                    /*进行任务发布*/
                    this.AddMission(thisTask)
                }
                return;
            }
            let automaticData = null;
            for (let i_Data of this.memory.Labautomatic.automaticData) {
                if (i_Data.Type == Type) {
                    automaticData = i_Data;
                }
            }
            if (!automaticData) {/*获取自动规划失败,取消任务同时终止*/this.DeleteMission(MissionName.id); return }
            /*检查仓库 以及终端的库存信息*/
            let use_number = storage_.store.getUsedCapacity(Type) + terminal_.store.getUsedCapacity(Type)
            if (use_number < automaticData.Num) {
                /*继续进行Lab数量的检查*/
                for (let lab_id in MissionName.LabBind) {
                    var lab_data = Game.getObjectById(lab_id as Id<StructureLab>) as StructureLab;
                    if (!lab_data) continue;
                    if (MissionName.LabBind[lab_id] == Type) {
                        use_number += lab_data.store.getUsedCapacity(Type)
                    } else {
                        /*原材料的容器*/
                        if (lab_data.store.getUsedCapacity(Type) < 100) {
                            /*原料容器资源过少-检查仓库的资源情况*/
                            RawState = true
                        }
                    }
                }
            }
            /*如果超出数量则自动暂停*/
            if (use_number >= automaticData.Num) {
                // console.log(this.name, '自动规划', '已满足合成要求')
                this.DeleteMission(MissionName.id)
                return;
            }
            /**
             * 如果尚未完成自动合成操作那么检查备用材料是否足够，以及是否存在其他房间调度的可能
             * 会跨房检索两种资源信息
             * */
            if (!RawState) { return }
            if (!LabMap[Type]) {
                /*无法检测合成配方-自动终止*/
                // console.log(this.name, '自动规划', '无法检测合成配方-自动终止')
                this.DeleteMission(MissionName.id)
                return;
            }
            var raw1str = LabMap[Type].raw1
            var raw2str = LabMap[Type].raw2
            /*检查其他库存资源的情况*/
            if (!this.Check_ResourceType(raw1str, 1000) || !this.Check_ResourceType(raw2str, 1000)) {
                /*已有的资源数量不足终止任务*/
                // console.log(this.name, '自动规划', '任务不足自动取消')
                this.DeleteMission(MissionName.id)
                return;
            }
            // console.log(this.name, '自动规划', '检测完成')
        } else {
            /*没有任务的情况下进行任务规划*/
            // console.log(this.name, '自动规划')
            /*先对Lab进行一次检查*/
            let LabTypeList = {};
            for (let lab_id of this.memory.StructureIdData.labs) {
                let lab_data = Game.getObjectById(lab_id) as StructureLab;
                if (!lab_data) continue;
                if (!lab_data.mineralType) continue;
                if (!LabTypeList[lab_data.mineralType]) {
                    LabTypeList[lab_data.mineralType] = 0;
                }
                LabTypeList[lab_data.mineralType] += lab_data.store.getUsedCapacity(lab_data.mineralType);
            }
            for (let i in this.memory.Labautomatic.automaticData) {
                let _Data = this.memory.Labautomatic.automaticData[i];
                // console.log(this.name, '自动规划', _Data.Type)
                /*检查资源是否已经满足要求*/
                let use_number = storage_.store.getUsedCapacity(_Data.Type) + terminal_.store.getUsedCapacity(_Data.Type)
                let defect_numer = _Data.Num - use_number
                if (defect_numer >= 5000) {
                    /*检查Lab的信息*/
                    if (LabTypeList[_Data.Type]) {
                        defect_numer -= LabTypeList[_Data.Type];
                        if (defect_numer <= 0) continue;
                    }
                    /**
                     * 当库存缺损超过5000的情况下执行合成操作
                     * 检查合成所需材料的信息
                     * */
                    if (!LabMap[_Data.Type]) { continue; }
                    var raw1str = LabMap[_Data.Type].raw1
                    var raw2str = LabMap[_Data.Type].raw2
                    if (this.Check_ResourceType(raw1str, 5000) && this.Check_ResourceType(raw2str, 5000)) {
                        /*有足够的资源-执行合成操作*/
                        var thisTask = this.public_Compound(defect_numer, _Data.Type)
                        if (thisTask) {
                            /*进行任务发布*/
                            if (this.AddMission(thisTask)) {
                                /*任务发布成功终止筛选*/
                                return
                            }
                        }
                    }
                }
            }

        }
    }

    // 合成规划     (中层)    目标化合物 --> 安排一系列合成
    public Task_CompoundDispatch(): void {
        if ((Game.time - global.Gtime[this.name]) % 50) return
        if (this.memory.Labautomatic.automaticState) return
        if (this.memory.switch.AutoDefend) return
        if (this.RoleMissionNum('transport', '物流运输') > 0) return
        if (Object.keys(this.memory.ComDispatchData).length <= 0) return //  没有合成规划情况
        if (this.MissionNum('Room', '资源合成') > 0) return  // 有合成任务情况
        var storage_ = this.storage as StructureStorage
        if (!storage_) return
        var terminal_ = this.terminal as StructureTerminal
        if (!terminal_) return
        /* 没有房间合成实验室数据，不进行合成 */
        if (!this.memory.StructureIdData.labInspect.raw1) { console.log(`房间${this.name}不存在合成实验室数据！`); return }
        // /* 查看合成实验室的被占用状态 */
        // if (this.memory.RoomLabBind[this.memory.StructureIdData.labInspect.raw1] || this.memory.RoomLabBind[this.memory.StructureIdData.labInspect.raw2]) { console.log(`房间${this.name}的源lab被占用!`); return }
        // var comLabs = []
        // for (var otLab of this.memory.StructureIdData.labInspect.com) {
        //     if (!this.memory.RoomLabBind[otLab]) comLabs.push(otLab)
        // }
        // if (comLabs.length <= 0) { console.log(`房间${this.name}的合成lab全被占用!`); return }
        // /* 确认所有目标lab里都没有其他资源 */
        // for (var i of this.memory.StructureIdData.labs) {
        //     var thisLab = Game.getObjectById(i) as StructureLab
        //     if (!thisLab) continue
        //     if (thisLab.mineralType && !this.memory.RoomLabBind[i]) return
        // }
        /**
         * 正式开始合成规划
         *  */
        var data = this.memory.ComDispatchData
        LoopA:
        for (var disType in data) {
            let storeNum = storage_.store.getUsedCapacity(disType as ResourceConstant)
            let dispatchNum = this.memory.ComDispatchData[disType].dispatch_num
            // 不是最终目标资源的情况下
            if (Object.keys(data)[Object.keys(data).length - 1] != disType)
                if (storeNum + 50 < dispatchNum)    // +50 是误差容许
                {
                    let diff = dispatchNum - storeNum
                    /* 先判定一下是否已经覆盖，如果已经覆盖就不合成 例如：ZK 和 G的关系，只要G数量满足了就不考虑 */
                    var mapResource = resourceMap(disType as ResourceConstant, Object.keys(data)[Object.keys(data).length - 1] as ResourceConstant)
                    if (mapResource.length > 0) {
                        for (var mR of mapResource) {
                            if (storage_.store.getUsedCapacity(mR) >= data[disType].dispatch_num)
                                continue LoopA
                        }
                    }
                    // 先判断能不能调度，如果能调度，就暂时 return
                    let identify = ResourceCanDispatch(this, disType as ResourceConstant, dispatchNum - storeNum)
                    if (identify == 'can') {
                        console.log(`[dispatch]<lab> 房间${this.name}将进行资源为${disType}的资源调度!`)
                        let dispatchTask: RDData = {
                            sourceRoom: this.name,
                            rType: disType as ResourceConstant,
                            num: dispatchNum - storeNum,
                            delayTick: 220,
                            conditionTick: 35,
                            buy: false,
                        }
                        Memory.ResourceDispatchData.push(dispatchTask)
                    }
                    else if (identify == 'running') return
                    // 如果terminal存在该类型资源，就暂时return
                    if (terminal_.store.getUsedCapacity(disType as ResourceConstant) > (this.memory.TerminalData[disType] ? this.memory.TerminalData[disType].num : 0)) return
                    // 如果存在manage搬运任务 就 return
                    if (!this.Check_Carry("manage", terminal_.pos, storage_.pos, disType as ResourceConstant)) return
                    // 下达合成命令
                    var thisTask = this.public_Compound(diff, disType as ResourceConstant)
                    if (this.AddMission(thisTask)) {
                        data[disType].ok = true
                    }
                    return
                }
            // 是最终目标资源的情况下
            if (Object.keys(data)[Object.keys(data).length - 1] == disType) {
                // 下达合成命令
                var thisTask = this.public_Compound(data[disType].dispatch_num, disType as ResourceConstant)
                if (this.AddMission(thisTask)) this.memory.ComDispatchData = {}
                return
            }

        }
    }

    /* 烧Power发布函数任务 */
    public Task_montitorPower(): void {
        if (Game.cpu.bucket < 6000 && Memory.StopPixel) return/*CPU不足情况下暂停*/
        if (Game.time % 15) return
        if (this.controller.level < 8) return
        if (!this.memory.switch.StartPower && !Memory.SystemEconomy) return
        let storage_ = this.storage as StructureStorage
        //  powerspawn_ = global.Stru[this.name]['powerspawn'] as StructurePowerSpawn
        if (!storage_ || !this.terminal) return
        let storage_number = storage_.store.getUsedCapacity('power');
        if (storage_number + this.terminal.store.getUsedCapacity('power') <= 5000) {
            // console.log(this.name, '等待帕瓦供应')
            /*将补充信息添加到待处理的列表中*/
            global.PowerDemand = _.uniq([...global.PowerDemand, this.name])
        } else {
            if (global.PowerDemand.length > 0) {
                global.PowerDemand = _.difference(global.PowerDemand, this.name)
            }
        }
        // 有任务了就不发布烧帕瓦的任务
        if (this.MissionNum('Room', 'power升级') > 0) return
        if (!Memory.SystemStopPower) {
            /* 检测类型*/
            let SavePower = this.memory.switch.SavePower;
            if (!SavePower && Memory.SystemEconomy && !this.memory.switch.StartPower) {
                SavePower = true;
            }
            // SavePower 是节省能量的一种"熔断"机制 防止烧power致死

            if (storage_.store.getUsedCapacity('energy') > (SavePower ? 250000 : 150000) && storage_number > 100) {
                /* 发布烧power任务 */
                var thisTask: MissionModel = {
                    name: 'power升级',
                    delayTick: 200,
                    range: 'Room',
                    state: 1
                }
                this.AddMission(thisTask)
            }
        }
    }

    /* 烧Power执行函数 */
    public Task_ProcessPower(misson: MissionModel): void {
        let storage_ = this.storage as StructureStorage
        let powerspawn_ = Game.rooms[this.name].GetStruDate('powerspawn') as StructurePowerSpawn
        let terminal_ = this.terminal as StructureTerminal
        if (!storage_ || !powerspawn_ || !terminal_) return
        if (misson.state == 1) {
            if (this.RoleMissionNum('manage', '物流运输') > 0) return
            if (powerspawn_.store.getFreeCapacity('energy') > 0) {
                var carryTask = this.public_Carry({ 'manage': { num: 1, bind: [] } }, 10, this.name, storage_.pos.x, storage_.pos.y, this.name, powerspawn_.pos.x, powerspawn_.pos.y, 'energy', powerspawn_.store.getFreeCapacity('energy'))
                this.AddMission(carryTask)
                return
            }
            if (powerspawn_.store.getFreeCapacity('power') > 0) {
                var carryTask = this.public_Carry({ 'manage': { num: 1, bind: [] } }, 10, this.name, storage_.pos.x, storage_.pos.y, this.name, powerspawn_.pos.x, powerspawn_.pos.y, 'power', powerspawn_.store.getFreeCapacity('power'))
                this.AddMission(carryTask)
                return
            }
            misson.state = 2

        }
        else if (misson.state == 2) {
            let result = powerspawn_.processPower()
            if (result != OK) {
                this.DeleteMission(misson.id)
            }
        }
    }

}