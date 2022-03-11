import { avePrice, haveOrder, highestPrice } from "@/module/fun/funtion"
import { Colorful, compare, isInArray } from "@/utils"

export default {
    repair:{
        set(roomName:string,rtype:'global'|'special'|'nuker',num:number,boost:null|ResourceConstant,vindicate:boolean):string{
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[repair] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == '墙体维护' && i.Data.RepairType == rtype)
            {
                return `[repair] 房间${roomName}已经存在类型为${rtype}的刷墙任务了`
            }
            var thisTask = thisRoom.public_repair(rtype,num,boost,vindicate)
            if (thisRoom.AddMission(thisTask))
            return `[repair] 房间${roomName}挂载类型为${rtype}刷墙任务成功`
            return `[repair] 房间${roomName}挂载类型为${rtype}刷墙任务失败`
        },
        remove(roomName:string,Rtype:'global'|'special'|'nuker'):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[repair] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == '墙体维护' && i.Data.RepairType == Rtype)
            {
                if (thisRoom.DeleteMission(i.id))
                return `[repair] 房间${roomName}删除类型为${Rtype}刷墙任务成功`
            }
            return `[repair] 房间${roomName}删除类型为${Rtype}刷墙任务失败!`
        },
    },
    plan:{
        C(roomName:string,disRoom:string,Cnum:number,Unum:number,shard:shardName = Game.shard.name as shardName):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[plan] 不存在房间${roomName}`
            let task = thisRoom.public_planC(disRoom,Cnum,Unum,shard)
            if (thisRoom.AddMission(task))
            return Colorful(`[plan] 房间${roomName}挂载C计划成功 -> ${disRoom}`,'green')
            return Colorful(`[plan] 房间${roomName}挂载C计划失败 -> ${disRoom}`,'red')
        },
        CC(roomName:string):string
        {
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[plan] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == 'C计划' )
            {
                if (thisRoom.DeleteMission(i.id))
                return Colorful(`[plan] 房间${roomName}删除C计划成功`,'green')
            }
            return Colorful(`[plan] 房间${roomName}删除C计划失败`,'red')
        }
    },
    expand:{
        set(roomName:string,disRoom:string,num:number,Cnum:number = 1):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[expand] 不存在房间${roomName}`
            let task = thisRoom.Public_expand(disRoom,num,Cnum)
            if (thisRoom.AddMission(task))
            return Colorful(`[expand] 房间${roomName}挂载扩张援建计划成功 -> ${disRoom}`,'green')
            return Colorful(`[expand] 房间${roomName}挂载扩张援建计划失败 -> ${disRoom}`,'red')
        },
        remove(roomName:string,disRoom:string):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[expand] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == '扩张援建' && i.Data.disRoom == disRoom )
            {
                if (thisRoom.DeleteMission(i.id))
                return Colorful(`[expand] 房间${roomName}删除扩张援建成功`,'green')
            }
            return Colorful(`[expand] 房间${roomName}删除扩张援建失败`,'red')
        },
    },
    war:{
        dismantle(roomName:string,disRoom:string,num:number,boost?:boolean,interval?:number):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[war] 不存在房间${roomName}`
            let interval_ = interval?interval:1000
            let task = thisRoom.Public_dismantle(disRoom,num,interval_,boost)
            if (thisRoom.AddMission(task))
            return Colorful(`[war] 房间${roomName}挂载拆迁任务成功 -> ${disRoom}`,'green')
            return Colorful(`[war] 房间${roomName}挂载拆迁任务失败 -> ${disRoom}`,'red')
        },
        Cdismantle(roomName:string,disRoom:string):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[war] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            {
                if (i.name =='黄球拆迁' && i.Data.disRoom ==disRoom)
                {
                    if (thisRoom.DeleteMission(i.id))
                    return Colorful(`[plan] 房间${roomName}删除拆迁任务成功`,'green')
                }
            }
            return Colorful(`[war] 房间${roomName}删除拆迁任务失败`,'red')
        },
        support(roomName:string,disRoom:string,rType:'double'):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[war] 不存在房间${roomName}`
            let task = thisRoom.Public_support(disRoom,rType,'shard3')
            if (thisRoom.AddMission(task))
            return Colorful(`[war] 房间${roomName}挂载紧急支援任务成功 -> ${disRoom}`,'green')
            return Colorful(`[war] 房间${roomName}挂载紧急支援任务失败 -> ${disRoom}`,'red')
        },
        Csupport(roomName:string,disRoom:string,rType:string):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[war] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            {
                if (i.name =='紧急支援' && i.Data.disRoom ==disRoom && i.Data.sType == rType)
                {
                    if (thisRoom.DeleteMission(i.id))
                    return Colorful(`[war] 房间${roomName}紧急支援任务成功`,'green')
                }
            }
            return Colorful(`[war] 房间${roomName}紧急支援任务失败`,'red')
        },
        control(roomName:string,disRoom:string,interval:number,shard:shardName = Game.shard.name as shardName):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[war] 不存在房间${roomName}`
            let task = thisRoom.Public_control(disRoom,shard,interval)
            if (thisRoom.AddMission(task))
            return Colorful(`[war] 房间${roomName}挂载控制攻击任务成功 -> ${disRoom}`,'green')
            return Colorful(`[war] 房间${roomName}挂载控制攻击任务失败 -> ${disRoom}`,'red')
        },
        Ccontrol(roomName:string,disRoom:string,shard:shardName = Game.shard.name as shardName):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[war] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            {
                if (i.name =='控制攻击' && i.Data.disRoom ==disRoom && i.Data.shard == shard)
                {
                    if (thisRoom.DeleteMission(i.id))
                    return Colorful(`[war] 房间${roomName}控制攻击任务成功`,'green')
                }
            }
            return Colorful(`[war] 房间${roomName}控制攻击任务失败`,'red')
        },
        aio(roomName:string,disRoom:string,CreepNum:number,shard:shardName,time:number = 1000,boost:boolean = true):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[war] 未找到房间${roomName},请确认房间!`
            var thisTask = myRoom.Public_aio(disRoom,shard,CreepNum,time,boost)
            if (myRoom.AddMission(thisTask))
            return `[support] 攻防一体任务挂载成功! ${Game.shard.name}/${roomName} -> ${shard}/${disRoom}`
            return `[support] 攻防一体挂载失败!`
        },
        Caio(roomName:string,disRoom:string,shard:shardName):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[support] 未找到房间${roomName},请确认房间!`
            for (var i of myRoom.memory.Misson['Creep'])
            {
                if (i.name == '攻防一体' && i.Data.disRoom == disRoom && i.Data.shard == shard)
                {
                    if (myRoom.DeleteMission(i.id))
                    return `[support] 删除去往${shard}/${disRoom}的攻防一体任务成功!`
                }
            }
            return `[support] 删除去往${shard}/${disRoom}的攻防一体任务失败!`
        }

    },
    upgrade:{
        quick(roomName:string,num:number,boostType:null| ResourceConstant):string{
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[upgrade] 不存在房间${roomName}`
            var thisTask = thisRoom.Public_quick(num,boostType)
            if (thisTask && thisRoom.AddMission(thisTask))
            return `[upgrade] 房间${roomName}挂载急速冲级任务成功`
            return `[upgrade] 房间${roomName}挂载急速冲级任务失败`
        },
        Cquick(roomName:string):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[repair] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == '急速冲级')
            {
                if (thisRoom.DeleteMission(i.id))
                return `[upgrade] 房间${roomName}删除急速冲级任务成功`
            }
            return `[upgrade] 房间${roomName}删除急速冲级任务失败!`
        },
        Nquick(roomName:string,num:number):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[repair] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == '急速冲级')
            {
                i.CreepBind['rush'].num = num
                return `[upgrade] 房间${roomName}急速冲级任务数量修改为${num}`
            }
            return `[upgrade] 房间${roomName}修改急速冲级任务数量失败!`
        },
    },
    carry:{
        special(roomName:string,res:ResourceConstant,sP:RoomPosition,dP:RoomPosition,CreepNum?:number,ResNum?:number):string{
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[carry] 不存在房间${roomName}`
            let time = 99999
            if (!ResNum) time = 30000
            var thisTask = thisRoom.Public_Carry({'truck':{num:CreepNum?CreepNum:1,bind:[]}},time,sP.roomName,sP.x,sP.y,dP.roomName,dP.x,dP.y,res,ResNum?ResNum:undefined)
            if (thisRoom.AddMission(thisTask)) return `[carry] 房间${roomName}挂载special搬运任务成功`
            return `[carry] 房间${roomName}挂载special搬运任务失败`
        },
        Cspecial(roomName:string):string{
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[carry] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == '物流运输' && i.CreepBind['truck'] && i.Data.rType)
            {
                if(thisRoom.DeleteMission(i.id))
                return `[carry] 房间${roomName}删除special搬运任务成功`
            }
            return `[carry] 房间${roomName}删除special搬运任务失败`
        },
    },
    market:{
        // 交易订单
        deal(roomName:string,id:string,amount:number):number{
            return Game.market.deal(id, amount, roomName);
        },
        // 查询订单
        look(rType:ResourceConstant,marType:"buy"|"sell"):string
        {
            var HistoryList = Game.market.getHistory(rType)
            var allNum:number = 0
            for (var ii of HistoryList)
            {
                allNum += ii.avgPrice
            }
            var avePrice = allNum / HistoryList.length
            var list = Game.market.getAllOrders({type: marType, resourceType: rType});
            /* 按照价格从上到下 */
            var newList = list.sort(compare('price'))
            var result = `当前市场上资源${rType}的${marType}订单如下:\n`
            if (isInArray(['pixel','access_key','cpu_unlock'],rType))
            {
                for (var i of list)
                {
                    result += `\tID:${i.id} 数量:${i.amount} 价格:${i.price} 坐标:${i.roomName} \n`
                }
                return result
            }
            for (var i of newList)
            {
                var priceColor = 'green'
                var roomColor = 'green'
                if (i.price > avePrice && i.price - avePrice > 10) priceColor = 'red'
                if (i.price > avePrice && i.price - avePrice <= 10) priceColor = 'yellow'
                if (i.price <= avePrice) priceColor = 'green'
                LoopB:
                for (var roomName in Memory.RoomControlData)
                {
                    var cost = Game.market.calcTransactionCost(1000,roomName as string,i.roomName)
                    if (cost >= 7000) {roomColor = 'red';break LoopB}
                    else if (cost < 700 && cost >= 500) {roomColor = 'yellow';break LoopB}
                    roomColor = 'green'
                }
                result += `\tID:${i.id} ` + `数量:${i.amount} 价格:`+ Colorful(`${i.price}`,priceColor?priceColor:'blue',true) +` 坐标: ` + Colorful(`${i.roomName}`,roomColor?roomColor:'blue',true) + ' \n'
            }
            return result
        },
        // 下买订单
        buy(roomName:string,rType:ResourceConstant,price:number,amount:number):string{
            var result = Game.market.createOrder({
                type: 'buy' ,
                resourceType: rType,
                price: price,
                totalAmount: amount,
                roomName: roomName   
            });
            if (result == OK) return `[market] ` + Colorful(`买资源${rType}的订单下达成功！ 数量为${amount},价格为${price}`,'blue',true)
            else return `[market] ` + Colorful(`买资源${rType}的订单出现错误，不能下达！`,'red',true)
        },
        // 查询平均价格
        ave(rType:ResourceConstant,day:number=1):string{
            return `[market] 资源${rType}在近${day}天内的平均价格为${ avePrice(rType,day)}`
        },
        // 查询是否有订单
        have(roomName:string,res:ResourceConstant,mtype:"sell"|'buy',p:number=null,r:number=null):string{
            let result = haveOrder(roomName,res,mtype,p,r) 
            if (p)
            return `[market] 房间:${roomName};资源:${res};类型:${mtype}[价格:${p+r}以上]的单子--->${result?"有":"没有"}`
            else
            return `[market] 房间:${roomName};资源:${res};类型:${mtype}的单子--->${result?"有":"没有"}`
        },
        // 查询市场上的最高价格
        highest(rType:ResourceConstant,mtype:'sell'|'buy',mprice:number=0):string{
            let result = highestPrice(rType,mtype,mprice)
            if (mprice)
            return `[market] 资源:${rType};类型:${mtype} 最高价格${result}[低于${mprice}]`
            else
            return `[market] 资源:${rType};类型:${mtype} 最高价格${result}`
        },
        // 卖资源
        sell(roomName:string,rType:ResourceConstant,mType:'deal'|'order',num:number,price?:number,unit:number = 2000):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[support] 不存在房间${roomName}`
            if (!thisRoom.memory.market) thisRoom.memory.market = {}
            if (mType == 'order')
            {
                if (!thisRoom.memory.market['order']) thisRoom.memory.market['order'] = []
                var bR = true
                for (var od of thisRoom.memory.market['order'])
                {
                    if (od.rType == rType)
                    bR = false
                }
                if (bR){
                    thisRoom.memory.market['order'].push({rType:rType,num:num,unit:unit})
                    return `[market] 房间${roomName}成功下达order的资源卖出指令,type:sell,rType:${rType},num:${num},unit:${unit}`
                }
                else return `[market] 房间${roomName}已经存在${rType}的sell订单了`
            }
            else if (mType == 'deal')
            {
                if (!thisRoom.memory.market['deal']) thisRoom.memory.market['deal'] = []
                var bR = true
                for (var od of thisRoom.memory.market['deal'])
                {
                    if (od.rType == rType)
                    bR = false
                }
                if (bR){
                    thisRoom.memory.market['deal'].push({rType:rType,num:num,price:price,unit:unit})
                    return `[market] 房间${roomName}成功下达deal的资源卖出指令,type:sell,rType:${rType},num:${num},price:${price},unit:${unit}`
                }
                else return `[market] 房间${roomName}已经存在${rType}的sell订单了`
            }
        },
        // 查询正在卖的资源
        query(roomName:string):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[support] 不存在房间${roomName}`
            let result = `[market] 目前房间${roomName}存在如下资源卖出订单:\n`
            for (var mtype in thisRoom.memory.market)
            for (var i of thisRoom.memory.market[mtype])
            result += `[${mtype}] 资源:${i.rType} 数量:${i.num}\n`
            return result
        },
        // 取消卖资源
        cancel(roomName:string,mtype:'order'|'deal',rType:ResourceConstant):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[support] 不存在房间${roomName}`
            for (let i of thisRoom.memory.market[mtype])
            {
                if (i.rType == rType)
                {
                    if (mtype == 'order')
                    {
                        if (i.rType != 'energy')
                        delete thisRoom.memory.TerminalData[i.rType]
                        let order = Game.market.getOrderById(i.id)
                        if (order) Game.market.cancelOrder(order.id)
                        var index = thisRoom.memory.market['order'].indexOf(i)
                        thisRoom.memory.market['order'].splice(index,1)
                        return Colorful(`[market] 房间${roomName}取消资源[${rType}----${mtype}]卖出配置成功`,'blue')
                    }
                    else
                    {
                        if (i.rType != 'energy')
                        delete thisRoom.memory.TerminalData[i.rType]
                        var index = thisRoom.memory.market['deal'].indexOf(i)
                        thisRoom.memory.market['deal'].splice(index,1)
                        return Colorful(`[market] 房间${roomName}取消资源[${rType}----${mtype}]卖出配置成功`,'blue')
                    }
                }
            }
            return Colorful(`[market] 房间${roomName}取消资源[${rType}----${mtype}]卖出配置失败`,'red')
        },
    },
    /* 绕过房间api */
    bypass: {
    
    /* 添加要绕过的房间 */
    add(roomNames: string):string {
        if (!Memory.bypassRooms) Memory.bypassRooms = []

        // 确保新增的房间名不会重复
        Memory.bypassRooms = _.uniq([ ...Memory.bypassRooms, roomNames])
        return `[bypass]已添加绕过房间 \n ${this.show()}`
    },

    show():string{
        if (!Memory.bypassRooms || Memory.bypassRooms.length <= 0) return '[bypass]当前无绕过房间'
        return `[bypass]当前绕过房间列表：${Memory.bypassRooms.join(' ')}`
    },
    clean():string{
        Memory.bypassRooms = []
        return `[bypass]已清空绕过房间列表，当前列表：${Memory.bypassRooms.join(' ')}`
    },
    remove(roomNames: string):string {
        if (!Memory.bypassRooms) Memory.bypassRooms = []
        if (roomNames.length <= 0) delete Memory.bypassRooms
        else Memory.bypassRooms = _.difference(Memory.bypassRooms,[roomNames])
        return `[bypass]已移除绕过房间${roomNames}`
    }
    },
    /* 白名单api */
    whitesheet:{
        add(username:string):string{
            if (!Memory.whitesheet) Memory.whitesheet = []
            Memory.whitesheet = _.uniq([...Memory.whitesheet,username])
            return `[whitesheet]已添加用户${username}进白名单！\n${this.show()}`
        },
        show():string{
            if (!Memory.whitesheet || Memory.whitesheet.length <= 0) return "[whitesheet]当前白名单为空！"
            return `[whitesheet]白名单列表：${Memory.whitesheet.join(' ')}`
        },
        clean():string{
            Memory.whitesheet = []
            return '[whitesheet]当前白名单已清空'
        },
        remove(username:string):string{
            // if (! (username in Memory.whitesheet)) return `[whitesheet]白名单里没有玩家“${username}”`
            if (!Memory.whitesheet) Memory.whitesheet = []
            if (Memory.whitesheet.length <= 0) delete Memory.whitesheet
            else Memory.whitesheet = _.difference(Memory.whitesheet,[username])
            return `[whitesheet]已移除${username}出白名单`
        }
    },

    support:{
        // 紧急援建
        build(roomName:string,disRoom:string,num:number,interval:number,shard:shardName = Game.shard.name as shardName):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[support] 不存在房间${roomName}`
            let task = thisRoom.Public_helpBuild(disRoom,num,shard,interval)
            if (thisRoom.AddMission(task))
            return Colorful(`[support] 房间${roomName}挂载紧急援建任务成功 -> ${disRoom}`,'green')
            return Colorful(`[support] 房间${roomName}挂载紧急援建任务失败 -> ${disRoom}`,'red')
        },
        Cbuild(roomName:string,disRoom:string,shard:shardName = Game.shard.name as shardName):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[support] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            {
                if (i.name =='紧急援建' && i.Data.disRoom ==disRoom && i.Data.shard == shard)
                {
                    if (thisRoom.DeleteMission(i.id))
                    return Colorful(`[support] 房间${roomName}紧急援建任务成功`,'green')
                }
            }
            return Colorful(`[support] 房间${roomName}紧急援建任务失败`,'red')
        },
    },

    /* 核弹相关 */
    nuke:{
        /* 发射核弹 */
        launch(roomName:string,disRoom:string,x_:number,y_:number):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[nuke]房间错误，请确认房间${roomName}！`
            var nuke_ = Game.getObjectById(myRoom.memory.StructureIdData.NukerID as string) as StructureNuker
            if (!nuke_) return `[nuke]核弹查询错误!`
            if (nuke_.launchNuke(new RoomPosition(x_,y_,disRoom)) == OK)
                return Colorful(`[nuke]${roomName}->${disRoom}的核弹发射成功!预计---500000---ticks后着陆!`,'yellow',true)
            else
                return Colorful(`[nuke]${roomName}->${disRoom}的核弹发射失败!`,'yellow',true)
        }
    },

    scout:{
        sign(roomName:string,disRoom:string,shard:shardName,str:string):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[scout] 不存在房间${roomName}`
            let task = thisRoom.Public_Sign(disRoom,shard,str)
            if (!task) return '[scout] 任务对象生成失败'
            if (thisRoom.AddMission(task))
            return Colorful(`[scout] 房间${roomName}挂载房间签名任务成功 -> ${disRoom}`,'green')
            return Colorful(`[scout] 房间${roomName}挂载房间签名任务失败 -> ${disRoom}`,'red')
        },
        Csign(roomName:string,disRoom:string,shard:shardName):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[scout] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            {
                if (i.name =='房间签名' && i.Data.disRoom ==disRoom && i.Data.shard == shard)
                {
                    if (thisRoom.DeleteMission(i.id))
                    return Colorful(`[scout] 房间${roomName}房间签名任务成功`,'green')
                }
            }
            return Colorful(`[scout] 房间${roomName}房间签名任务失败`,'red')
        },
    },

    /* 终端行为 */
    terminal:{
        // 默认最多8个传送任务
        send(roomName:string,disRoom:string,rType:ResourceConstant,num:number):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[terminal] 不存在房间${roomName}`
            var thisTask = thisRoom.Public_Send(disRoom,rType,num)
            /* 查看资源是否足够 */
            var terminal_ = Game.getObjectById(thisRoom.memory.StructureIdData.terminalID) as StructureTerminal
            var storage_ = Game.getObjectById(thisRoom.memory.StructureIdData.storageID) as StructureStorage
            if (!terminal_ || !storage_) 
            {delete thisRoom.memory.StructureIdData.terminalID;delete thisRoom.memory.StructureIdData.storageID;return Colorful( `[terminal] 房间${roomName}不存在终端/仓房或记忆未更新！`,'red',true)}
            /* 查询其他资源传送任务中是否有一样的资源 */
            var Num = 0
            if (!thisRoom.memory.Misson['Structure']) thisRoom.memory.Misson['Structure'] = []
            for (var tM of thisRoom.memory.Misson['Structure'])
            {
                if (tM.name == '资源传送' && tM.Data.rType == rType)    Num += tM.Data.num
            }
            /* 计算资源是否满足 */
            if (terminal_.store.getUsedCapacity(rType) + storage_.store.getUsedCapacity(rType) - Num < num)
            return Colorful(`[terminal] 房间${roomName} 资源${rType} 数量总合少于 ${num}，传送任务挂载失败！`,'yellow',true)
            /* 计算路费 */
            var cost = Game.market.calcTransactionCost(num,roomName,disRoom)
            if (terminal_.store.getUsedCapacity('energy') + storage_.store.getUsedCapacity('energy') < cost || cost > 150000)
            return Colorful(`[terminal] 房间${roomName}-->${disRoom}资源${rType}所需路费少于 ${cost}或大于150000，传送任务挂载失败！`,'yellow',true)
            if(thisRoom.AddMission(thisTask))
                return Colorful(`[terminal] 房间${roomName}-->${disRoom}资源${rType}传送挂载成功！数量：${num}；路费：${cost}`,'green',true)
            return Colorful(`[terminal] 房间${roomName}-->${disRoom}资源${rType}传送 不明原因挂载失败！`,'red',true)
        },
        Csend(roomName:string,disRoom:string,rType:ResourceConstant):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[terminal] 不存在房间${roomName}`
            for (var tM of thisRoom.memory.Misson['Structure'])
            {
                if (tM.name == '资源传送' && tM.Data.rType == rType && tM.Data.disRoom == disRoom)
                {
                    if (thisRoom.DeleteMission(tM.id))return Colorful(`[terminal] 房间${roomName}-->${disRoom}资源${rType}传送任务删除成功!`,'blue',true)
                }
            }
            return Colorful(`[terminal] 房间${roomName}-->${disRoom}资源${rType}传送 不明原因删除失败！`,'red',true)
        },
        /* 查看目前房间/全局的资源传送任务 */
        show(roomName?:string):string{
            var roomList:string[] = []
            if (roomName) roomList = [roomName]
            else
            {
                if (!Memory.RoomControlData) Memory.RoomControlData = {}
                for (var rN in Memory.RoomControlData)
                {
                    roomList.push(rN)
                }
            }
            if (roomList.length <= 0) return `[terminal] 未发现房间！`
            for (var rN of roomList)
            {
                if (!Game.rooms[rN]) return `[terminal] 不存在房间${rN}！`
            }
            var str = ''
            for (var rN of roomList)
            {
                if (!Game.rooms[rN].memory.Misson['Structure']) Game.rooms[rN].memory.Misson['Structure'] = []
                if (Game.rooms[rN].MissionNum('Structure','资源传送') <= 0) continue
                str += '房间 ' + Colorful(`${rN}`,'yellow',true) + '：\n'
                for (var m of Game.rooms[rN].memory.Misson['Structure'])
                {
                    if (m.name == '资源传送')
                    {
                        str += '    '+`-->${m.Data.disRoom} | 资源：${m.Data.rType} | 数量：` + m.Data.num + ' \n'
                    }
                }
            }
            if (str == '') return `[terminal] 未发现资源传送任务！`
            return str
        },
    },
}