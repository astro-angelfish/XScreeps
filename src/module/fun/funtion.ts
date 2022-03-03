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
            if (order.amount <=0 || !order.active) {Game.market.cancelOrder(i);continue;}
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