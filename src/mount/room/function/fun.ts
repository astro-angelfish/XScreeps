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
}