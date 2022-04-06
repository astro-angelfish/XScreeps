import { avePrice, haveOrder, highestPrice } from "@/module/fun/funtion";
import { Colorful, GenerateAbility } from "@/utils";

/* 房间原型拓展   --行为  --维护任务 */
export default class RoomMissonVindicateExtension extends Room {
    public Task_Repair(mission:MissionModel):void{
        if (mission.LabBind)
        {
            if (!this.Check_Lab(mission,'transport','complex')) return
        }
        if (mission.Data.RepairType == 'global')
        {

        }
        else if (mission.Data.RepairType == 'special')
        {

        }
        else if (mission.Data.RepairType == 'nuker')
        {

        }
    }

    /* 急速冲级 */
    public Task_Quick_upgrade(mission:MissionModel):void{
        if (this.controller.level >= 8) {this.DeleteMission(mission.id);console.log(`房间${this.name}等级已到8级，删除任务!`);return}
        if (!this.memory.StructureIdData.terminalID) return
        /* 能量购买 */
        let terminal_ = Game.getObjectById(this.memory.StructureIdData.terminalID) as StructureTerminal
        if (!terminal_) return
        if (!mission.Data.standed) mission.Data.standed = true
        /* 如果terminal附近已经充满了爬虫，则standed为false */
        let creeps = terminal_.pos.findInRange(FIND_MY_CREEPS,1)
        if (creeps.length >= 8) mission.Data.standed= false
        else mission.Data.standed = true
        if(!this.Check_Lab(mission,'transport','complex')) return
        if (Game.time % 40) return
        if (terminal_.store.getUsedCapacity('energy') < 100000 && Game.market.credits >= 1000000)
        {
            let ave = avePrice('energy',2)
            let highest = highestPrice('energy','buy',ave+6)
            if (!haveOrder(this.name,'energy','buy',highest,-0.2))
            {
                let result = Game.market.createOrder({
                    type: ORDER_BUY,
                    resourceType: 'energy',
                    price: highest + 0.1,
                    totalAmount: 100000,
                    roomName: this.name   
                });
                if (result != OK){console.log("创建能量订单出错,房间",this.name)}
                console.log(Colorful(`[急速冲级]房间${this.name}创建energy订单,价格:${highest + 0.01};数量:100000`,'green',true))
            }
        }
    }

    /* 紧急援建 */
    public Task_HelpBuild(mission:MissionModel):void{
        if (!mission.Data.defend)
        {
            global.MSB[mission.id] ={'architect':GenerateAbility(15,24,10,0,0,1,0,0)}
        }
        if ((Game.time - global.Gtime[this.name]) % 9) return
        if (mission.LabBind)
        {
            if(!this.Check_Lab(mission,'transport','complex')) return // 如果目标lab的t3少于 1000 发布搬运任务
        }
        
    }

}