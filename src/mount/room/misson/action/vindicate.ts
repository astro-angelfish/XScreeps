import { avePrice, haveOrder, highestPrice, checkDispatch, checkSend } from "@/module/fun/funtion";
import { Colorful, StatisticalResources } from "@/utils";
import { times } from "lodash";

/* 房间原型拓展   --行为  --维护任务 */
export default class RoomMissonVindicateExtension extends Room {
    public Task_Repair(mission: MissionModel): void {
        if (mission.LabBind) {
            if (!this.Check_Lab(mission, 'transport', 'complex')) return
        }
        if (mission.Data.RepairType == 'global') {

        }
        else if (mission.Data.RepairType == 'special') {

        }
        else if (mission.Data.RepairType == 'nuker') {

        }
    }

    /* 核弹填充 */
    public Task_Nuker(mission: MissionModel): void {
        if (!this.memory.StructureIdData.NukerID || !this.memory.StructureIdData.storageID) return
        var nuker = Game.getObjectById(this.memory.StructureIdData.NukerID) as StructureNuker
        var storage_ = this.storage
        if (!nuker) { delete this.memory.StructureIdData.NukerID; return }
        if (!storage_) { delete this.memory.StructureIdData.storageID; return }
        let num = 5000 - nuker.store.G;
        if (storage_.store.getUsedCapacity('G') < num && !(checkDispatch(this.name, 'G') || checkSend(this.name, 'G'))) {
            if (StatisticalResources('G') >= num) {
                let dispatchTask: RDData = {
                    sourceRoom: this.name,   // 请求调度资源的房间
                    rType: 'G',  // 资源类型
                    num: num - storage_.store.getUsedCapacity('G'),      // 数量
                    delayTick: 500,        // 超时时间 默认 500 tick
                    buy: false,        // 超时过后是否会寻求购买
                }
                Memory.ResourceDispatchData.push(dispatchTask);
            }
        }
        if (nuker.store.getUsedCapacity('G') < 5000 && storage_.store.getUsedCapacity('G') >= 5000) {
            var thisTask = this.Public_Carry({ 'transport': { num: 1, bind: [] } }, 40, this.name, storage_.pos.x, storage_.pos.y, this.name, nuker.pos.x, nuker.pos.y, 'G', 5000 - nuker.store.getUsedCapacity('G'))
            this.AddMission(thisTask)
            return
        }
        if (nuker.store.getUsedCapacity('energy') < 300000 && storage_.store.getUsedCapacity('energy') > 130000) {
            var thisTask = this.Public_Carry({ 'transport': { num: 1, bind: [] } }, 40, this.name, storage_.pos.x, storage_.pos.y, this.name, nuker.pos.x, nuker.pos.y, 'energy', 300000 - nuker.store.getUsedCapacity('energy'))
            this.AddMission(thisTask)
            return
        }
    }

    /* 急速冲级 */
    public Task_Quick_upgrade(mission: MissionModel): void {
        if (this.controller.level >= 8) { this.DeleteMission(mission.id); console.log(`房间${this.name}等级已到8级，删除任务!`); return }
        if (!this.memory.StructureIdData.terminalID) return
        /* 能量购买 */
        let terminal_ = Game.getObjectById(this.memory.StructureIdData.terminalID) as StructureTerminal
        if (!terminal_) return
        if (!mission.Data.standed) mission.Data.standed = true
        /* 把升级把数量设置为0 */
        if (this.memory.SpawnConfig.upgrade.num) this.memory.SpawnConfig.upgrade.num = 0;
        /* 如果terminal附近已经充满了爬虫，则standed为false */
        let creeps = terminal_.pos.findInRange(FIND_MY_CREEPS, 1)
        if (creeps.length >= 8) mission.Data.standed = false
        else mission.Data.standed = true
        if (!this.Check_Lab(mission, 'transport', 'complex')) return
        if (Game.time % 40) return
        if (terminal_.store.getUsedCapacity('energy') < 100000 && Game.market.credits >= 10000000) {
            /* 计算最高价格 */
            let history = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: 'energy' });
            let avePrice = 0;
            let j = -1;
            for (let i = 0; i < history.length; i++) {
                if (history[i].price > avePrice && history[i].price <= 4 && history[i].roomName != this.name) { avePrice = history[i].price + 0.001; }//符合条件
            }

            //* 清理过期订单 */
            if (Object.keys(Game.market.orders).length > 150) {
                for (let j in Game.market.orders) {
                    let order = Game.market.getOrderById(j)
                    if (!order.active) delete Game.market.orders[j]
                }
            }
            /* 判断有无自己的订单 */
            //let thisRoomOrder = Game.market.getAllOrders(order => order.type == ORDER_BUY && order.resourceType == 'energy' && order.roomName == this.name)//&& order.price >= avePrice - 0.5
            let thisOrder = Game.market.orders;
            let thisRoomOrder: Order;
            for (let i in thisOrder) {
                let Order = thisOrder[i];
                if (Order.roomName == terminal_.room.name && Order.type == 'buy' && Order.resourceType == 'energy' && Order.remainingAmount > 0) { thisRoomOrder = Order; break; }
            }
            /* 没有就创建订单 或者添加容量 ，有就更新最高价格*/
            if (!thisRoomOrder) {
                for (let i in thisOrder) {
                    let Order = thisOrder[i];
                    if (Order.roomName == terminal_.room.name && Order.type == 'buy' && Order.resourceType == 'energy' && Order.remainingAmount == 0) {
                        Game.market.extendOrder(Order.id, 100000);//添加容量
                        Game.market.changeOrderPrice(Order.id, avePrice)//修改单价 不管高低都要刷新，因为怕被人钓鱼
                        return;
                    }
                }

                console.log("订单创建中")
                Game.market.createOrder({
                    type: ORDER_BUY,
                    resourceType: 'energy',
                    price: avePrice,
                    totalAmount: 100000,
                    roomName: this.name
                });
                console.log(Colorful(`[急速冲级]房间${this.name}创建能量订单，价格:${avePrice};数量:100000`, 'green', true))
            }
            else {
                Game.market.changeOrderPrice(thisRoomOrder.id, avePrice)//修改单价
            }
        }
    }

    /* 紧急援建 */
    public Task_HelpBuild(mission: MissionModel): void {
        if ((Game.time - global.Gtime[this.name]) % 9) return
        if (mission.LabBind) {
            if (!this.Check_Lab(mission, 'transport', 'complex')) return
        }
    }

    /* 紧急支援 */
    public Task_HelpDefend(mission: MissionModel): void {
        // if ((Game.time - global.Gtime[this.name]) % 9) return
        if (mission.LabBind) {
            if (!this.Check_Lab(mission, 'transport', 'complex')) return
        }
    }

    /* 双人攻击 */
    public Task_doubleDismantle(mission: MissionModel): void {
        // if ((Game.time - global.Gtime[this.name]) % 9) return
        if (mission.LabBind) {
            if (!this.Check_Lab(mission, 'transport', 'complex')) return
        }
    }
}