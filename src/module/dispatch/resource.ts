/* 资源调度模块 */

import { t1, t2, t3 } from "@/constant/ResourceConstant"
import { Colorful, isInArray } from "@/utils"
import { avePrice, haveOrder } from "../fun/funtion"


// 主调度函数
export function ResourceDispatch(thisRoom:Room):void{
    if ((Game.time - global.Gtime[thisRoom.name]) % 15) return
    // 处理订单前检查
    let storage_ = global.Stru[thisRoom.name]['storage'] as StructureStorage
    let terminal_ = global.Stru[thisRoom.name]['terminal'] as StructureTerminal
    if (thisRoom.controller.level < 6 || !storage_ || !terminal_ ) return
    if (thisRoom.MissionNum('Structure','资源传送') >= 1) return    // 如果房间有资源传送任务，则不执行
    for (let i of Memory.ResourceDispatchData)
    {
        // 执行资源调度
        if (i.sourceRoom == thisRoom.name)
        {
            // 执行买操作
            if (i.conditionTick <= 0 && i.buy)
            {
                console.log(`[资源调度] 房间${thisRoom.name}需求资源[${i.rType}]无法调度,将进行购买!`)
                if (isInArray(['ops','energy'],i.rType))
                {
                    // 基础资源
                    let aveprice:number
                    if (i.rType == 'energy')
                    {
                        if (!i.mtype) i.mtype = "order"
                        if (i.mtype == 'deal')  // 如果是deal
                        {
                            if (thisRoom.Check_Buy(i.rType) || thisRoom.MissionNum('Structure','资源购买') >= 2) continue
                            let task = thisRoom.Public_Buy(i.rType,i.num,10,20)
                            if (task) {thisRoom.AddMission(task);i.delayTick = 0}
                            continue
                        }   
                        // order
                        aveprice = avePrice(i.rType,3) + 0.15  // 选取近两天的平均价格
                        if (!haveOrder(thisRoom.name,i.rType,'buy',aveprice,-0.15))
                        {
                            let result = Game.market.createOrder({
                                type: ORDER_BUY,
                                resourceType: 'energy',
                                price: aveprice,
                                totalAmount: i.num,
                                roomName: thisRoom.name   
                            });
                            if (result != OK){console.log("[资源调度]创建能量订单出错,房间",thisRoom.name);continue}
                            console.log(Colorful(`房间${thisRoom.name}创建${i.rType}订单,价格:${aveprice};数量:${i.num}`,'green',true))
                            i.delayTick = 0
                        }
                    }
                    else
                    {
                        if (!i.mtype) i.mtype = "deal"
                        if (i.mtype == 'deal')  // 如果是deal
                        {
                            if (thisRoom.Check_Buy(i.rType) || thisRoom.MissionNum('Structure','资源购买') >= 2) continue
                            let task = thisRoom.Public_Buy(i.rType,i.num,2.5,5)
                            if (task) {thisRoom.AddMission(task);i.delayTick = 0}
                            continue
                        }   
                        aveprice = avePrice(i.rType,2) +0.1
                        if (!haveOrder(thisRoom.name,i.rType,'buy',aveprice,-0.1))
                        {
                            let result = Game.market.createOrder({
                                type: ORDER_BUY,
                                resourceType: 'ops',
                                price: aveprice,
                                totalAmount: i.num,
                                roomName: thisRoom.name   
                            });
                            if (result != OK){console.log("[资源调度]创建能量订单出错,房间",thisRoom.name);continue}
                            console.log(Colorful(`房间${thisRoom.name}创建${i.rType}订单,价格:${aveprice};数量:${i.num}`,'green',true))
                            i.delayTick = 0
                        }
                    }
                    // 查找是否已经有了类似订单了
                    continue
                }
                if (!i.mtype) i.mtype = 'deal'
                // 已经存在相应任务或任务数量太多则不再挂载任务
                if (i.mtype == 'deal') if (thisRoom.Check_Buy(i.rType) || thisRoom.MissionNum('Structure','资源购买') >= 2) continue
                if (isInArray(['X','L','H','O','Z','K','U','G','OH'],i.rType))
                {
                    // 原矿
                    if (i.mtype == 'order')
                    {
                        let aveprice = avePrice(i.rType,3) + 0.5  // 选取近两天的平均价格
                        if (!haveOrder(thisRoom.name,i.rType,'buy',aveprice,-0.5))
                        {
                            let result = Game.market.createOrder({
                                type: ORDER_BUY,
                                resourceType: i.rType,
                                price: aveprice,
                                totalAmount: i.num,
                                roomName: thisRoom.name   
                            });
                            if (result != OK){console.log("[资源调度]创建能量订单出错,房间",thisRoom.name);continue}
                            console.log(Colorful(`房间${thisRoom.name}创建${i.rType}订单,价格:${aveprice};数量:${i.num}`,'green',true))
                            i.delayTick = 0
                        }
                        continue
                    }
                    let task = thisRoom.Public_Buy(i.rType,i.num,10,30)
                    if (task) {thisRoom.AddMission(task);i.delayTick = 0}
                }
                else if (isInArray(t3,i.rType))
                {
                    // t3
                    let task = thisRoom.Public_Buy(i.rType,i.num,50,150)
                    if (task) {thisRoom.AddMission(task);i.delayTick = 0}
                }
                else if (isInArray(t2,i.rType) || isInArray(t1,i.rType))
                {
                    // t1 t2
                    let task = thisRoom.Public_Buy(i.rType,i.num,20,65)
                    if (task) {thisRoom.AddMission(task);i.delayTick = 0}
                }
                else if (i.rType == 'power')
                {
                    // power
                    let task = thisRoom.Public_Buy(i.rType,i.num,20,60)
                    if (task) {thisRoom.AddMission(task);i.delayTick = 0}
                }
                else
                {
                    // 商品或其他
                    let task = thisRoom.Public_Buy(i.rType,i.num,50,200)
                    if (task) {thisRoom.AddMission(task);i.delayTick = 0}
                }
                continue
            }
        }
        else
        {
            if(i.dealRoom) continue
            if (storage_.store.getUsedCapacity(i.rType))
            var limitNum = thisRoom.memory.ResourceLimit[i.rType]?thisRoom.memory.ResourceLimit[i.rType]:0
            if (storage_.store.getUsedCapacity(i.rType) <= 0) continue  // 没有就删除
            // storage里资源大于等于调度所需资源
            if ((storage_.store.getUsedCapacity(i.rType) + limitNum) >= i.num)
            {
                var SendNum = i.num > 50000?50000:i.num
                let task = thisRoom.Public_Send(i.sourceRoom,i.rType,SendNum)
                if (task && thisRoom.AddMission(task))
                {
                    if (i.num <= 50000) i.dealRoom = thisRoom.name // 如果调度数量大于50k 则只减少num数量
                    console.log(`房间${thisRoom.name}接取房间${i.sourceRoom}的资源调度申请,资源:${i.rType},数量:${SendNum}`)
                    i.num -= SendNum
                    return
                }
            }
            // sotrage里资源小于调度所需资源
            if (storage_.store.getUsedCapacity(i.rType)-limitNum > 0 && storage_.store.getUsedCapacity(i.rType)-limitNum < i.num)
            {
                let SendNum = storage_.store.getUsedCapacity(i.rType)-limitNum
                let task = thisRoom.Public_Send(i.sourceRoom,i.rType,SendNum)
                if (task && thisRoom.AddMission(task))
                {
                    console.log(`房间${thisRoom.name}接取房间${i.sourceRoom}的资源调度申请,资源:${i.rType},数量:${SendNum}`)
                    i.num -= SendNum
                    return
                }
            }
        }
    }
}


// 调度信息超时管理器
export function ResourceDispatchTick():void{
    for (let i of Memory.ResourceDispatchData)
    {
        // 超时将删除调度信息
        if (!i.delayTick || i.delayTick <=0 || i.num <= 0 || !i.rType)
        {
            console.log(`[资源调度]房间${i.sourceRoom}的[${i.rType}]资源调度删除!原因:调度任务已部署|超时|无效调度`)
            let index = Memory.ResourceDispatchData.indexOf(i)
            Memory.ResourceDispatchData.splice(index,1)
        }
        if (i.delayTick > 0)
        i.delayTick --
        if (i.conditionTick > 0)
        i.conditionTick --
    }
}