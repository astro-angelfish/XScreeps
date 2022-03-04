import { Colorful, compare, isInArray } from "@/utils"

// terminal 扩展
export default class terminalExtension extends StructureTerminal {
    public ManageMission():void{
        if (this.room.MissionNum('Creep','急速冲级') > 0) return   // 急速冲级状态下停止terminal功能
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
        if (allmyTask.length >= 1)
            allmyTask.sort(compare('level'))
        thisTask = allmyTask[0]
        if (!thisTask || !isInArray(['资源传送'],thisTask.name))
        {
            /* terminal默认操作*/
            this.ResourceBalance()  // 资源平衡
            this.ResourceMarket()   // 资源买卖
            if (!thisTask) return
        }
        if (thisTask.delayTick < 99995)
            thisTask.delayTick--
        switch (thisTask.name){
            case "资源传送":{this.ResourceSend(thisTask);break}
            case "资源购买":{this.ResourceDeal(thisTask);break}
        }
    }

    /**
     * 资源平衡函数，用于平衡房间中资源数量以及资源在terminal和storage中的分布，尤其是能量和原矿
     */
    public ResourceBalance():void{
        this.RsourceMemory()
        // terminal资源平衡
        if ((Game.time - global.Gtime[this.room.name]) % 7) return
        let storage_ = global.Stru[this.room.name]['storage'] as StructureStorage
        if (!storage_) {console.log(`找不到global.Stru['${this.room.name}']['storage]!`);return}
        for (var i in this.store)
        {
            if (this.room.RoleMissionNum('manage','物流运输') >= 1) return
            let num = this.store[i]     // 数量
            if (!this.room.memory.TerminalData[i] || !this.room.memory.TerminalData[i].num)  // terminalData里没有该数据
            {
                if (storage_.store.getFreeCapacity() < 40000) continue
                let thisTask = this.room.Public_Carry({'manage':{num:1,bind:[]}},20,this.room.name,this.pos.x,this.pos.y,this.room.name,storage_.pos.x,storage_.pos.y,i as ResourceConstant,num)
                this.room.AddMission(thisTask)
            }
            else
            {
                if (num > this.room.memory.TerminalData[i].num)
                {
                    if (storage_.store.getFreeCapacity() < 40000) continue
                    let thisTask = this.room.Public_Carry({'manage':{num:1,bind:[]}},20,this.room.name,this.pos.x,this.pos.y,this.room.name,storage_.pos.x,storage_.pos.y,i as ResourceConstant,num-this.room.memory.TerminalData[i].num)
                    this.room.AddMission(thisTask)
                }
                else if (num < this.room.memory.TerminalData[i].num)
                {
                    if (this.store.getFreeCapacity() < 5000) continue
                    if (i == 'energy')
                    {
                        if (storage_.store.getUsedCapacity('energy') <= 20000) continue
                    }
                    else
                    {
                        if ( storage_.store.getUsedCapacity(i as ResourceConstant) <= 500 && storage_.store.getUsedCapacity(i as ResourceConstant) + num < this.room.memory.TerminalData[i].num) continue
                    }
                    let thisTask = this.room.Public_Carry({'manage':{num:1,bind:[]}},20,this.room.name,storage_.pos.x,storage_.pos.y,this.room.name,this.pos.x,this.pos.y,i as ResourceConstant,this.room.memory.TerminalData[i].num - num)
                    this.room.AddMission(thisTask)
                }
            }
        }

    }   

    /**
     * 资源记忆更新函数
     * */
    public RsourceMemory():void{
        /* terminal自身资源管理 */
        var terminalData = this.room.memory.TerminalData
        for (var i in terminalData)
        {
            /* 数量小于0就删除数据，节省memory */
            if (terminalData[i].num <= 0) delete terminalData[i]
        }
    }

    /**
     * 资源买卖函数 未完成   目标：只买能量、挂单、卖 (不deal买资源)
     */
    public ResourceMarket():void{
        if ((Game.time - global.Gtime[this.room.name]) % 27) return
        // 能量自动购买区 [与MarketData无关] storage内能量小于200000时自动购买
        /* 清理过期订单 */
        if (Object.keys(Game.market.orders).length > 80)
        {
            for (let j in Game.market.orders)
            {
                let order = Game.market.getOrderById(j);
                if (order.remainingAmount) Game.market.cancelOrder(j);
            }
        }
        let storage_ = global.Stru[this.room.name]['storage'] as StructureStorage
        if (!storage_) {console.log(`找不到global.Stru['${this.room.name}']['storage]!`);return}
        if (storage_.store.getUsedCapacity('energy') + this.store.getUsedCapacity('energy') < 250000)
        {
            /* 计算平均价格 */
            let history = Game.market.getHistory('energy')
            let allprice = 0
            for (var ii=12;ii<15;ii++)
                allprice += history[ii].avgPrice
            let avePrice = allprice/3 + (Memory.marketAdjust['energy']?Memory.marketAdjust['energy']:0.5) // 平均能量价格
            if (avePrice > 20) avePrice = 20    // 最大不超过20
            /* 下单 */
            let thisRoomOrder = Game.market.getAllOrders(order =>
                order.type == ORDER_BUY && order.resourceType == 'energy' && order.price >= avePrice - 0.5 && order.roomName == this.room.name)
            if ((!thisRoomOrder || thisRoomOrder.length <= 0))
            {
                console.log("房间",this.room.name,"订单操作中")
                Game.market.createOrder({
                    type: ORDER_BUY,
                    resourceType: 'energy',
                    price: avePrice,
                    totalAmount: 100000,
                    roomName: this.room.name   
                });
                console.log(Colorful(`房间${this.room.name}创建能量订单，价格:${avePrice};数量:100000`,'yellow',true))
            }
        }
        // 其他类型资源的买卖函数 暂缺
    }

    /**
     * 资源传送
     */
    public ResourceSend(task:MissionModel):void{
        if (this.cooldown && this.cooldown > 0) return
        if (!task.Data || !task.Data.disRoom)       // 任务数据有问题
        {
            this.room.DeleteMission(task.id)
            return
        }
        if (!task.state) task.state = 1     // 1状态下，搜集资源
        if (task.state == 1)
        {
            if (Game.time % 10) return  /* 每10tick监测一次 */
            if (task.Data.num <= 0 || task.Data.num == undefined) this.room.DeleteMission(task.id)
            if (this.room.RoleMissionNum('manage','物流运输') > 0) return // manage爬虫有任务时就不管
            // 路费
            var wastage = Game.market.calcTransactionCost(task.Data.num,this.room.name,task.Data.disRoom)
            /* 如果非能量资源且路费不够，发布资源搬运任务，优先寻找storage */
            var storage_ = global.Stru[this.room.name]['storage'] as StructureStorage
            // terminal的剩余资源
            var remain = this.store.getFreeCapacity()
            /* 路费判断 */
            if (wastage > this.store.getUsedCapacity('energy'))
            {
                /* 只有在能量富裕的情况下才会允许进入下一阶段 */
                if (storage_ && (storage_.store.getUsedCapacity('energy') + this.store.getUsedCapacity('energy') - 5000) > wastage && remain > (wastage-this.store.getUsedCapacity('energy')))
                {
                    /* 下布搬运任务 */
                    var thisTask = this.room.Public_Carry({'manage':{num:1,bind:[]}},40,this.room.name,storage_.pos.x,storage_.pos.y,this.room.name,this.pos.x,this.pos.y,'energy',wastage-this.store.getUsedCapacity('energy'))
                    this.room.AddMission(thisTask)
                    return
                }
                /* 条件不满足就自动删除任务 */
                this.room.DeleteMission(task.id)
                return
            }
            console.log('资源传送任务监控中: ###########################\n 房间:',this.room.name,'--->',task.Data.disRoom,' 运送资源：',task.Data.rType)
            console.log('路费:',Colorful(`${wastage}`,'yellow'),'energy  ','终端拥有能量:',Colorful(`${this.store.getUsedCapacity('energy')}`,'yellow'),'energy')
            /* 资源判断 */
            var cargoNum:number = task.Data.rType == 'energy'?this.store.getUsedCapacity(task.Data.rType)-wastage:this.store.getUsedCapacity(task.Data.rType)
            console.log('终端拥有资源量:',Colorful(`${cargoNum}`,'blue'),' 仓库拥有资源量:',storage_.store.getUsedCapacity(task.Data.rType),' 任务所需资源量:',task.Data.num)
            if (task.Data.num > cargoNum)
            {
                if (storage_ && (storage_.store.getUsedCapacity(task.Data.rType) + this.store.getUsedCapacity(task.Data.rType)) >= (task.Data.num - 1600) && remain > task.Data.num-cargoNum)
                {
                    /* 下布搬运任务 */
                    var thisTask = this.room.Public_Carry({'manage':{num:1,bind:[]}},40,this.room.name,storage_.pos.x,storage_.pos.y,this.room.name,this.pos.x,this.pos.y,task.Data.rType,task.Data.num-cargoNum)
                    this.room.AddMission(thisTask)
                    return
                }
                /* 条件不满足就自动删除任务 */
                this.room.DeleteMission(task.id)
                return
            }
            /* 都满足条件了就进入状态2 */
            task.state = 2
        }
        else if (task.state == 2)
        {
            let result = this.send(task.Data.rType as ResourceConstant,task.Data.num,task.Data.disRoom as string)
            if (result == -6)   /* 能量不够就重新返回状态1 */
            {
                console.log(Colorful(`房间${this.room.name}发送资源${task.Data.rType}失败!`,'read',true))
                task.state = 1
                return
            }
            else if (result == OK)
            {
                /* 如果传送成功，就删除任务 */
                this.room.DeleteMission(task.id)
                return
            }
        }
    }

    /**
     * 资源购买 (deal)
     */
    public ResourceDeal(task:MissionModel):void{
        if((Game.time - global.Gtime[this.room.name] )% 10) return
        if (this.cooldown || this.store.getUsedCapacity('energy') < 50000) return
        if (!task.Data){this.room.DeleteMission(task.id);return}
        let money = Game.market.credits
        if (money <= 0 || task.Data.num > 50000){this.room.DeleteMission(task.id);return}
        let rType = task.Data.rType
        let num = task.Data.num
        var HistoryList = Game.market.getHistory(rType)
        var allNum:number = 0
        for (var iii = 13;iii<15;iii++)
        {
            allNum += HistoryList[iii].avgPrice
        }
        var avePrice = allNum/2     // 平均价格 [近两天]
        // 获取该资源的平均价格
        var maxPrice = avePrice + (task.Data.range?task.Data.range:50 )  // 范围
        /* 在市场上寻找 */
        var orders = Game.market.getAllOrders(order => order.resourceType == rType &&
            order.type == ORDER_SELL && order.price <= maxPrice)
        if (orders.length <= 0) return
        /* 寻找价格最低的 */
        var newOrderList = orders.sort(compare('price'))
        for (var ii of newOrderList)
        {
            if (ii.price > maxPrice) return
            if (ii.amount >= num)
            {
                if (Game.market.deal(ii.id,num,this.room.name) == OK)
                {
                    this.room.DeleteMission(task.id)
                    return
                }
                else return
            }
            else
            {
                if(Game.market.deal(ii.id,ii.amount,this.room.name) == OK)
                task.Data.num -= ii.amount
                return
            }
        }
    }
}