import { ResourceMapData } from "@/constant/ResourceConstant"
import { isInArray } from "@/utils"

// 计算平均价格
export function avePrice(res:ResourceConstant,day:number):number{
    if (day > 15) return 0  // 0
    let allprice = 0
    let history = Game.market.getHistory(res)
    for (var ii=15-day;ii<15;ii++)
    allprice += history[ii].avgPrice
    let avePrice = allprice/day // 平均能量价格
    return avePrice
}

// 判断是否已经有相应order了s
export function haveOrder(roomName:string,res:ResourceConstant,mtype:'sell'|'buy',nowPrice?:number,range?:number):boolean{
    if (!nowPrice)  //  不考虑价格
    {
        for (let i in Game.market.orders)
        {
            let order = Game.market.getOrderById(i);
            if (order.remainingAmount <=0) {Game.market.cancelOrder(i);continue;}
            if (order.roomName == roomName && order.resourceType == res && order.type == mtype)
            return true
        }
        return false
    }
    else        // 考虑价格区间
    {
        for (let i in Game.market.orders)
        {
            let order = Game.market.getOrderById(i);
            if (order.amount <=0 || !order.active) {Game.market.cancelOrder(i);continue;}
            if (order.roomName == roomName && order.resourceType == res && order.type == mtype && order.price >= (nowPrice+range))
            return true
        }
        return false
    }
}

// 计算一定范围内的最高价格
export function highestPrice(res:ResourceConstant,mtype:'sell'|'buy',mprice?:number):number{
    let allOrder = Game.market.getAllOrders({type: mtype, resourceType: res})
    let highestPrice = 0
    for (var i of allOrder)
    {
        if (i.price > highestPrice)
        {
            if (mprice){
                if (i.price <= mprice) highestPrice = i.price
            }
            else
            {
                highestPrice = i.price
            }
        }
    }
    if (mprice && highestPrice == 0) highestPrice = mprice
    return highestPrice
}

// 识别lab 合成 or 底物  [轮子]
export function RecognizeLab(roomname: string):{raw1:string,raw2:string,com:string[]} {
    var room = Game.rooms[roomname];
    if (!room) return null
    var labs = room.find(FIND_STRUCTURES, { filter: { structureType: STRUCTURE_LAB } }) as StructureLab[];
    if (labs.length < 3) return null
    var centerLabs: [StructureLab, StructureLab, StructureLab[]] = [, , []];
    var obj = { centerLabs: [], otherLabs: [] };
    for (let i = 0; i < labs.length; i++) {
        let labA = labs[i];
        for (let j = i + 1; j < labs.length; j++) {
            let labB = labs[j]
            let otherLabs = [];
            if (labA.pos.inRangeTo(labB, 5))
                labs.forEach(labC => {
                    if (labC != labA && labC != labB && labA.pos.inRangeTo(labC, 2) && labB.pos.inRangeTo(labC, 2)) {
                        otherLabs.push(labC)
                    }
                });
            if (otherLabs.length > centerLabs[2].length) {
                centerLabs = [labA, labB, otherLabs];
                if (centerLabs[0]) {
                    obj.centerLabs = [centerLabs[0].id, centerLabs[1].id];
                    obj.otherLabs = centerLabs[2].map(e => e.id);
                } else {
                    obj.centerLabs = [];//中央lab
                    obj.otherLabs = [];//剩下lab
                }
            }
        }
    }
    if (obj.centerLabs.length <2 || obj.otherLabs.length <=0 ) return null
    return {raw1:obj.centerLabs[0],raw2:obj.centerLabs[1],com:obj.otherLabs}
}

// 判断是否存在该房间相关资源的调用信息 true 存在 false 不存在
export function checkDispatch(roomName:string,resource:ResourceConstant):boolean {
    for (let i of Memory.ResourceDispatchData)
    {
        if (i.sourceRoom == roomName && i.rType == resource) return true
    }
    return false
}

// 该房间资资源调度数量
export function DispatchNum(roomName:string):number{
    let num = 0
    for (let i of Memory.ResourceDispatchData)
    {
        if (i.sourceRoom == roomName) num ++
    }
    return num
}
// 判断其他房间是否存在往该房间的资源调度
export function checkSend(roomName:string,resource:ResourceConstant):boolean{
    for (let i in Memory.RoomControlData)
    {
        if (!Game.rooms[i] || !Game.rooms[i].memory.Misson || !Game.rooms[i].memory.Misson['Structure']) continue
        for (var t of Game.rooms[i].memory.Misson['Structure'])
        {
            if (t.name == '资源传送' && t.Data.rType == resource && t.Data.disRoom == roomName) return true
        }
    }
    return false
}

// 判断自己房间是否有资源购买任务
export function checkBuy(roomName:string,resource:ResourceConstant):boolean{
    for (var t of Game.rooms[roomName].memory.Misson['Structure'])
    {
        if (t.name == '资源购买' && t.Data.rType == resource) return true
    }
    return false
}

// 判断是否有实验室绑定该种类型资源 true代表有
export function checkLabBindResource(roomName:string,resource:ResourceConstant):boolean{
    let room_ = Game.rooms[roomName]
    if (!room_) return false
    for (var i in room_.memory.RoomLabBind)
    {
        if (room_.memory.RoomLabBind[i].rType == resource) return true
    }
    return false
}

/* 判断目标资源的上级资源是否已经达到要求 */
export function resourceMap(rType:ResourceConstant,disType:ResourceConstant):ResourceConstant[]{
    if (isInArray(['XGH2O','XGHO2','XLH2O','XLHO2','XUH2O','XUHO2','XKH2O','XKHO2','XZH2O','XZHO2'],rType)){console.log("是",rType,' 返回空列表');return []}
    for (var i of ResourceMapData)
    {
        if (i.source == rType && i.dis == disType)
        {
            return i.map as ResourceConstant[]
        }
    }
    console.log("resourceMap返回了空列表")
    return []
}