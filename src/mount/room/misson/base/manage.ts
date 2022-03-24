import { isInArray } from "@/utils";

/* 房间原型拓展   --任务  --中央运输工任务 */
export default class RoomMissonManageExtension extends Room {
    /* 链接送仓   即中央链接能量转移至仓库 */
    public Task_Clink():void{
        if (( Game.time - global.Gtime[this.name]) % 3) return
        if (!this.memory.StructureIdData.center_link) return
        var center_link = Game.getObjectById(this.memory.StructureIdData.center_link as string) as StructureLink
        if (!center_link) {delete this.memory.StructureIdData.center_link;return}
        var structure:StructureStorage|StructureTerminal;
        var storage_ =  global.Stru[this.name]['storage'] as StructureStorage
        var terminal_=global.Stru[this.name]['terminal'] as StructureTerminal
        structure=storage_?storage_:terminal_
        if (!structure) {return}
        if (structure.store.getFreeCapacity() <= 10000) return   // storage满了就不挂载任务了
        for (var i of this.memory.Misson['Structure'])
        {
            if (i.name == '链传送能' && isInArray(i.structure,this.memory.StructureIdData.center_link))
            return
        }
        if (center_link.store.getUsedCapacity('energy') >= 400 && this.Check_Carry('manage',center_link.pos,structure.pos,'energy'))
        {
            var thisTask = this.Public_Carry({'manage':{num:1,bind:[]}},20,this.name,center_link.pos.x,center_link.pos.y,this.name,structure.pos.x,structure.pos.y,'energy')
            this.AddMission(thisTask)   
        }
    }

}