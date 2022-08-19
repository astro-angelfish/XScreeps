import { AppLifecycleCallbacks } from "../framework/types"

export function pixel():void{
    if (Memory.pixelInfo.buyNum > 0) {
        let buyOrder: string;
        for (let i in Game.market.orders) {
            let order = Game.market.getOrderById(i);
            if (order.resourceType === PIXEL && order.type === ORDER_BUY){
                buyOrder = order.id;
                break;
            }
        }
        let order = Game.market.getOrderById(buyOrder);
        if (order) {
            if (order.remainingAmount === 0){
                if (Game.market.extendOrder(order.id, 1) === OK) {
                    Memory.pixelInfo.buyNum -= 1;
                }
            }
        }
    }
    if (Memory.pixelInfo.sellNum > 0) {
        let sellOrder: string;
        for (let i in Game.market.orders) {
            let order = Game.market.getOrderById(i);
            if (order.resourceType === PIXEL && order.type === ORDER_SELL){
                sellOrder = order.id;
                break;
            }
        }
        let order = Game.market.getOrderById(sellOrder);
        if (order) {
            if (order.remainingAmount === 0){
                if (Game.market.extendOrder(order.id, 1) === OK) {
                    Memory.pixelInfo.sellNum -= 1;
                }
            }
        }
    }
    if (!Game.cpu.generatePixel) return
    if (Game.cpu.bucket >= 10000) {
        if (!Memory.StopPixel) {
            Game.cpu.generatePixel()
        }
    }
}

export const pixelManager:AppLifecycleCallbacks = {
    tickEnd:pixel
}