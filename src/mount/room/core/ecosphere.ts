import { devPlanConstant } from "@/constant/PlanConstant"
import { Colorful } from "@/utils"

/* 房间原型拓展   --内核  --房间生态 */
export default class RoomCoreEcosphereExtension extends Room {
    /* 房间生态主函数 */
    public RoomEcosphere():void {
        this.RoomPlan()
    }
    
    /* 自动布局 */
    public RoomPlan():void {
        // 没有中心点不进行自动布局
        let centerList = Memory.RoomControlData[this.name].center
        if (!centerList || centerList.length < 2) return
        let level = this.controller.level
        if (level > this.memory.originLevel)
        {
            let LayOutPlan = Memory.RoomControlData[this.name].arrange
            switch (LayOutPlan)
            {
                case 'man':{break;}
                case 'hoho':{break;}
                case 'dev':{this.RoomRuleLayout(level,devPlanConstant);break;}
            }
            /* link */
        }
        /* 自动重建 */
        if (Game.shard.name == 'shard3'){if (Game.time % 25) return}
        else{if (Game.time % 5) return}

    }

    /* 房间状态 */
    public RoomState():void {
        
    }
    
    /* 房间自动布局 */
    public RoomRuleLayout(level:number,map:BluePrint):void{
        let center_point:RoomPosition  = null
        let centerList = Memory.RoomControlData[this.name].center
        center_point = new RoomPosition(centerList[0],centerList[1],this.name)
        for (let obj of map)
        {
            if (level >= obj.level)
            {
                let new_point = new RoomPosition(center_point.x+obj.x,center_point.y+obj.y,this.name)
                // 忽略越界位置
                if (new_point.x >= 49 || new_point.x <= 0 || new_point.y >= 49 || new_point.y <= 0) continue
                // 墙壁不建造东西
                if (new_point.lookFor(LOOK_TERRAIN)[0] == 'wall') continue
                let posOcp:boolean = false
                let new_point_structures = new_point.lookFor(LOOK_STRUCTURES)
                if (new_point_structures.length > 0)
                for (let j of new_point_structures)
                {if(j.structureType != 'rampart') posOcp = true}
                if (new_point && new_point.lookFor(LOOK_CONSTRUCTION_SITES).length <= 0 && !posOcp)
                {
                    let result = new_point.createConstructionSite(obj.structureType)
                    if (result != 0)
                    {
                        let str = Colorful(`房间${this.name}创建工地${obj.structureType}失败! 位置: x=${obj.x}|y=${obj.y}`,'orange',false)
                        console.log(str)
                    }
                    else
                    {
                        let str = Colorful(`房间${this.name}创建工地${obj.structureType}成功! 位置: x=${obj.x}|y=${obj.y}`,'green',false)
                        console.log(str)
                    }
                }



            }
            else return // 不遍历无关建筑
        }
    }
}