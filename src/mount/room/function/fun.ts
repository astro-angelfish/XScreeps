import { filter_structure, isInArray, LeastHit } from "@/utils"

/* 房间原型拓展   --方法  --寻找 */
export default class RoomFunctionFindExtension extends Room {
    /* 获取指定structureType的建筑列表 */
    public getStructure(sc:StructureConstant):Structure[]
    {
        return this.find(FIND_STRUCTURES,{filter:{structureType:sc}})
    }

    /* 任务lab绑定数据生成便捷函数 */
    public Bind_Lab(rTypes:ResourceConstant[]):MissonLabBind | null{
        var result:MissonLabBind = {}
        var tempList = []
        LoopA:
        for (var i of rTypes)
        {
            /* 计算是否已经存在相关lab */
            for (var occ_lab_id in this.memory.RoomLabBind)
            {
                if (this.memory.RoomLabBind[occ_lab_id].rType == i && !this.memory.RoomLabBind[occ_lab_id].occ)
                {
                    result[occ_lab_id] = i
                    continue LoopA
                }
            }
            LoopB:
            for (var all_lab_id of this.memory.StructureIdData.labs)
            {
                var occ_lab = Object.keys(this.memory.RoomLabBind)
                if (!isInArray(occ_lab,all_lab_id) && !isInArray(tempList,all_lab_id))
                {
                    var thisLab = Game.getObjectById(all_lab_id) as StructureLab
                    if (!thisLab)
                    {
                        var index = this.memory.StructureIdData.labs.indexOf(all_lab_id)
                        this.memory.StructureIdData.labs.splice(index,1)
                        continue LoopB
                    }
                    if (thisLab.store)
                    {
                        if (Object.keys(thisLab.store).length <= 1)
                        {
                            result[all_lab_id] = i
                            tempList.push(all_lab_id)
                            continue LoopA
                        }
                        else if (Object.keys(thisLab.store).length == 1)
                        {
                            if (thisLab.store['energy'] > 0)
                            {
                                result[all_lab_id] = i
                                tempList.push(all_lab_id)
                                continue LoopA
                            }
                            continue LoopB
                        }
                        else if (Object.keys(thisLab.store).length > 1)
                        continue LoopB
                    }
                }
            }
            return null
        }
        return result
    }

    /* -----------------------lab优化区----------------------------(施工中) */

    /* 任务过程中，实时更新占用lab 例如有lab被占用了或者其他情况  */
    public Update_Lab(miss:MissionModel,rTypes:ResourceConstant[]):boolean{
        for (let rtype of rTypes)
        {

        }
        return
    }

    /* 任务过程中，实时解占lab */


    /* 判断任务所需的某种资源类型强化的lab占用数据是否正常 只有返回normal才代表正常 */
    public Check_Occupy(miss:MissionModel,rType:ResourceConstant):'normal' | 'damage' | 'unbind' | 'lost' {
        if (!miss.LabBind) return 'unbind'
        for (let i in miss.LabBind)
        {
            if (miss.LabBind[i] == rType)
            {
                let lab_ = Game.getObjectById(i) as StructureLab
                if (!lab_)
                {
                    return 'damage' // 代表绑定的lab损坏
                }
                if (this.memory.RoomLabBind[i] && miss.LabBind[i] == this.memory.RoomLabBind[i].rType)
                    return 'normal' // 正常运转
                else
                    return 'lost'   // 被其他高优先级绑定占用了，需要重定向
            }
        }
        return 'unbind' // 代表未绑定
    }

    /* 分配lab 返回的是分配lab的数据，如果分配成功返回MissonLabBind对象 如果分配失败返回null */
    public Allot_Occupy(miss:MissionModel):MissonLabBind | null{
        if (!miss.LabMessage) return null          // 没有lab信息，分配失败
        let result:MissonLabBind = {}      // 结果
        let tempList = []           // 临时占用lab的列表
        let rawLabList = []     // 底物lab列表
        if (this.memory.StructureIdData.labInspect.raw1) // 合成用的底物lab1
        {
            let raw1Lab = Game.getObjectById(this.memory.StructureIdData.labInspect.raw1) as StructureLab
            if (!raw1Lab) delete this.memory.StructureIdData.labInspect.raw1
            else rawLabList.push(this.memory.StructureIdData.labInspect.raw1)
            
        }
        if (this.memory.StructureIdData.labInspect.raw2) // 合成用的底物lab2
        {
            let raw2Lab = Game.getObjectById(this.memory.StructureIdData.labInspect.raw2) as StructureLab
            if (!raw2Lab) delete this.memory.StructureIdData.labInspect.raw2
            else rawLabList.push(this.memory.StructureIdData.labInspect.raw2)
            
        }
        LoopA:
        for (let i in miss.LabMessage)
        {
            /* 先判断一下是否已经有相关的lab占用了,当然，这只有LabMessage[i]为boost时才可用 */
            if (miss.LabMessage[i] == 'boost')
            {
                for (let occ_lab_id in this.memory.RoomLabBind)
                {
                    if (this.memory.RoomLabBind[occ_lab_id].rType == i && !this.memory.RoomLabBind[occ_lab_id].occ) // !occ代表允许多任务占用该lab
                    {
                        result[occ_lab_id] = i
                        continue LoopA
                    }
                }
            }
            /* 除了底物之外的lab */
            if (isInArray(['boost','unboost','com'],miss.LabMessage[i]))
            {
                /* 寻找未占用的lab */
                LoopB:
                for (let lab_id of this.memory.StructureIdData.labs)
                {
                    let bind_labs = Object.keys(this.memory.RoomLabBind)
                    if (!isInArray(bind_labs,lab_id) && !isInArray(tempList,lab_id) && !isInArray(rawLabList,lab_id))
                    {
                        let thisLab = Game.getObjectById(lab_id) as StructureLab
                        if (!thisLab)   // lab损坏
                        {
                            var index = this.memory.StructureIdData.labs.indexOf(lab_id)
                            this.memory.StructureIdData.labs.splice(index,1)
                            continue LoopB
                        }
                        if (thisLab.mineralType)
                        {
                            if (thisLab.mineralType == i)   // 相同资源的未占用lab
                            {
                                result[lab_id] = i
                                tempList.push(lab_id)
                                continue LoopA
                            }
                            else continue LoopB
                        }
                        else        // 空lab
                        {
                            result[lab_id] = i
                            tempList.push(lab_id)
                            continue LoopA
                        }
                    }
                }   
            }
            /* 根据优先级强制占用lab */
            if (miss.LabMessage[i] == 'raw')
            {
                LoopRaw:
                for (let rawID of rawLabList)
                {
                    let thisLab = Game.getObjectById(rawID) as StructureLab
                    if (!thisLab) continue LoopRaw
                    // 先检查是否被占用了，如果被占用，就夺回
                    if (this.memory.RoomLabBind[rawID] && this.memory.RoomLabBind[rawID].type && this.memory.RoomLabBind[rawID].type != 'raw'  && !isInArray(tempList,rawID) )
                    {
                        result[rawID] = i
                        tempList.push(rawID)
                        continue LoopA
                    }
                }
            }
            else if (miss.LabMessage[i] == 'boost')
            {
                // 寻找性质为com的lab
                for (let occ_lab_id in this.memory.RoomLabBind)
                {
                    // 只要lab存在，且其ID注册为com 就强制占用
                    if (this.memory.RoomLabBind[occ_lab_id].type && this.memory.RoomLabBind[occ_lab_id].type == 'com' &&  !isInArray(tempList,occ_lab_id) && Game.getObjectById(occ_lab_id) )
                    {
                        result[occ_lab_id] = i
                        tempList.push(occ_lab_id)
                        continue LoopA
                    }
                }
            }
            return null // 代表未找到合适的lab
        }
        return result
        

    }

    /* -----------------------lab优化区----------------------------(施工中) */
    
    /* 获取指定列表中类型的hit最小的建筑 (比值) 返回值： Structure | undefined */
    public getListHitsleast(sc:StructureConstant[],mode?:number):Structure | undefined
    {
        if (!mode) mode = 2
        /* 3 */
        if (mode == 3) mode = 0
        let s_l = this.find(FIND_STRUCTURES,{filter:(structure)=>{
            return filter_structure(structure,sc) && structure.hits < structure.hitsMax
        }})
        let least_ = LeastHit(s_l,mode,)
        return least_
    }

    /* 获取指定类型的建筑 */
    public getTypeStructure(sr:StructureConstant[]):Structure[]
    {
        var resultstructure = this.find(FIND_STRUCTURES,{filter:(structure)=>{
            return filter_structure(structure,sr)
        }})
        return resultstructure
    }

    /* 房间建筑执行任务 */
    public structureMission(strus:StructureConstant[]):void{
        var AllStructures =  this.getTypeStructure(strus) as StructureLink[]
        for (var stru of AllStructures)
        {
            if (stru.ManageMission)
                stru.ManageMission()
        }
    }
    
    /* 获取全局建筑对象变量 由于该对象每tick都不一样，所以需要每tick都获取 */
    public GlobalStructure():void{
        // 目前只支持 storage terminal factory powerspawn 
        if (!global.Stru) global.Stru = {}
        if (!global.Stru[this.name]) global.Stru[this.name] = {}

        if (this.memory.StructureIdData.storageID)
        {
            global.Stru[this.name]['storage'] = Game.getObjectById(this.memory.StructureIdData.storageID) as StructureStorage
            if (!global.Stru[this.name]['storage'])
            {
                delete this.memory.StructureIdData.storageID
            }
        }
        if(this.memory.StructureIdData.terminalID)
        {
            global.Stru[this.name]['terminal'] = Game.getObjectById(this.memory.StructureIdData.terminalID) as StructureTerminal
            if (!global.Stru[this.name]['terminal'])
            {
                delete this.memory.StructureIdData.terminalID
            }
        }
        if (this.memory.StructureIdData.PowerSpawnID)
        {
            global.Stru[this.name]['powerspawn'] = Game.getObjectById(this.memory.StructureIdData.PowerSpawnID) as StructurePowerSpawn
            if (!global.Stru[this.name]['powerspawn'])
            {
                delete this.memory.StructureIdData.PowerSpawnID
            }
        }
        if (this.memory.StructureIdData.FactoryId)
        {
            global.Stru[this.name]['factory'] = Game.getObjectById(this.memory.StructureIdData.FactoryId) as StructureFactory
            if (!global.Stru[this.name]['factory'])
            {
                delete this.memory.StructureIdData.FactoryId
            }
        }
        if (this.memory.StructureIdData.NtowerID)
        {
            global.Stru[this.name]['Ntower'] = Game.getObjectById(this.memory.StructureIdData.NtowerID) as StructureTower
            if (!global.Stru[this.name]['Ntower'])
            {
                delete this.memory.StructureIdData.NtowerID
            }
        }
        if (this.memory.StructureIdData.AtowerID && this.memory.StructureIdData.AtowerID.length > 0)
        {
            var otlist = global.Stru[this.name]['Atower'] = [] as StructureTower[]
            for (var ti of this.memory.StructureIdData.OtowerID)
            {
                var ot = Game.getObjectById(ti) as StructureTower
                if (!ot)
                {
                    var index = this.memory.StructureIdData.OtowerID.indexOf(ti)
                    this.memory.StructureIdData.OtowerID.splice(index,1)
                    continue
                }
                otlist.push(ot)
            }
        }
        

    }

    /* 等级信息更新 */
    public LevelMessageUpdate():void{
        if (this.controller.level > this.memory.originLevel)
        this.memory.originLevel = this.controller.level
    }

        /**
    * 建筑任务初始化 目前包含terminal factory link
    */
    public StructureMission():void{
        let structures = []
        var IdData = this.memory.StructureIdData
        if (IdData.terminalID)
        {
            let terminal = Game.getObjectById(IdData.terminalID) as StructureTerminal
            if (!terminal) {delete IdData.terminalID}
            else structures.push(terminal)
        }
        if (IdData.FactoryId)
        {
            let factory = Game.getObjectById(IdData.FactoryId) as StructureFactory
            if (!factory) {delete IdData.FactoryId}
            else structures.push(factory)
        }
        if (IdData.center_link)
        {
            let center_link = Game.getObjectById(IdData.center_link) as StructureLink
            if (!center_link) {delete IdData.center_link}
            else structures.push(center_link)
        }
        if (IdData.source_links && IdData.source_links.length > 0)
        {
            for (var s of IdData.source_links)
            {
                let sl = Game.getObjectById(s) as StructureLink
                if (!sl)
                {
                    var index = IdData.source_links.indexOf(s)
                    IdData.source_links.splice(index,1)
                }
                else structures.push(sl)
            }
        }
        if (IdData.comsume_link && IdData.comsume_link.length > 0)
        {
            for (var s of IdData.comsume_link)
            {
                let sl = Game.getObjectById(s) as StructureLink
                if (!sl)
                {
                    var index = IdData.comsume_link.indexOf(s)
                    IdData.comsume_link.splice(index,1)
                }
                else structures.push(sl)
            }
        }
        if (structures.length > 0)
        {
            for (var obj of structures)
            {
                if (obj.ManageMission)
                {
                    obj.ManageMission()
                }
            }
        }
    }

}