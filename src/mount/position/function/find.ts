import { filter_structure, LeastHit} from "@/utils"
/* 位置原型拓展   --方法  --寻找 */
export default class PositionFunctionFindExtension extends RoomPosition {
    /* 获取指定范围内，指定列表类型建筑 范围 模式 0 代表无筛选，1代表hit受损的 2代表hit最小 */
    public  getRangedStructure(sr:StructureConstant[],range:number,mode:number):Structure[] |undefined | Structure{
        let resultstructure:Structure[]
        switch(mode){
            case 0:{
                // 无筛选
                resultstructure = this.findInRange(FIND_STRUCTURES,range,{filter:(structure)=>{
                    return filter_structure(structure,sr)
                }})
                return resultstructure
            }
            case 1:{
                // 筛选hit
                resultstructure = this.findInRange(FIND_STRUCTURES,range,{filter:(structure)=>{
                    return filter_structure(structure,sr) && structure.hits <structure.hitsMax
                }})
                return resultstructure
            }
            case 2:{
                resultstructure = this.findInRange(FIND_STRUCTURES,range,{filter:(structure)=>{
                    return filter_structure(structure,sr) && structure.hits <structure.hitsMax
                }})
                var s_l = LeastHit(resultstructure,2)
                return s_l
            }
            default:{
                return undefined
            }
        }
    }
    /* 获取距离最近的指定列表里类型建筑 0 代表无筛选，1代表hit受损 */
    public  getClosestStructure(sr:StructureConstant[],mode:number):Structure | undefined
    {
        let resultstructure:Structure
        switch(mode){
            case 0:{
                // 无筛选
                resultstructure = this.findClosestByRange(FIND_STRUCTURES,{filter:(structure)=>{
                    return filter_structure(structure,sr)
                }})
                return resultstructure
            }
            case 1:{
                // 筛选hit
                resultstructure = this.findClosestByRange(FIND_STRUCTURES,{filter:(structure)=>{
                    return filter_structure(structure,sr) && structure.hits <structure.hitsMax
                }})
                return resultstructure
            }
            default:{
                return undefined
            }
        }
    }
    /* 获取最近的store能量有空的spawn或扩展 */
    public getClosestStore():StructureExtension | StructureSpawn | StructureLab | undefined{
        return this.findClosestByPath(FIND_STRUCTURES,{filter:(structure:StructureExtension |StructureSpawn)=>{
            return filter_structure(structure,[STRUCTURE_EXTENSION,STRUCTURE_SPAWN,STRUCTURE_LAB]) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }}) as StructureExtension | StructureSpawn  | undefined
    }
}