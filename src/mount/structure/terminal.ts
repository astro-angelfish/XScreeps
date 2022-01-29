import { compare, isInArray } from "@/utils"

// terminal 扩展
export default class terminalExtension extends StructureTerminal {
    public ManageMission():void{
        var allmyTask = []
        for (var task of this.room.memory.Misson['Structure'])
        {
            if (!task.structure) continue
            if (isInArray(task.structure,this.id))
            {
                allmyTask.push(task)
            }
        }
        let thisTask = null
        /* 按照优先级排序 */
        if (allmyTask.length <= 0)
        {
        }
        else if (allmyTask.length >= 1)
            allmyTask.sort(compare('level'))
        thisTask = allmyTask[0]
        if (!thisTask || !isInArray(['资源传送'],thisTask[0].name))
        {
            /* terminal默认操作*/

            if (!thisTask) return
        }
        if (thisTask.delayTick < 99995)
            thisTask.delayTick--
        switch (thisTask.name){
            case "资源传送":{break}
            case "资源购买":{break}
        }
    }

    /**
     * 资源平衡函数，用于平衡房间中资源数量以及资源在terminal和storage中的分布，尤其是能量和原矿
     */
    public ResourceBalance():void{
        // let manageMissionNum = this.room.RoleMissionNum('manage','物流运输')
        // if (manageMissionNum >= 2) return       // 中央搬运工运输任务太多就不进行资源平衡了
        /* 初始化资源memory */
    }

    public RsourceMemory():void{
        if (!this.room.memory.TerminalData) this.room.memory.TerminalData = {}
        /* terminal自身资源管理 */
        var terminalData = this.room.memory.TerminalData
        if (this.room.GainMission('急速冲级')) return
        for (var i in terminalData)
        {
            /* 数量小于0就删除数据，节省memory */
            if (terminalData[i].num <= 0) delete terminalData[i]
            else
            {
                if (terminalData[i].num < this.store.getUsedCapacity(i as ResourceConstant))
                {
    
                }
                else if (terminalData[i].num > this.store.getUsedCapacity(i as ResourceConstant))
                {
                    
                }
            }
        }
        /* 能量购买 */
        
    }
}