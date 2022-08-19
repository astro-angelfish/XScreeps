import { AppLifecycleCallbacks } from "../framework/types"
import { highestPrice, lowestPrice } from "./funtion";

export function pixel():void{
    let buy = Memory.pixelInfo.buy;
    if (buy.num > 0 && Game.time % (2 * buy.unit) === 0) {
        let buyOrder: string;
        if (!Game.market.getOrderById(buy.order)) {
            for (let i in Game.market.orders) {
                let order = Game.market.getOrderById(i);
                if (order.resourceType === PIXEL && order.type === ORDER_BUY) {
                    buyOrder = order.id;
                    break;
                }
            }
        } else buyOrder = buy.order;
        let order = Game.market.getOrderById(buyOrder);
        buy.order = buyOrder;
        if (order) {
            if (order.remainingAmount === 0){
                let extendAmount = Math.min(buy.unit, buy.num);
                if (Game.market.extendOrder(order.id, extendAmount) === OK) {
                    buy.num -= extendAmount;
                }
            }
            //自动调价
            if (Game.time % (11 * buy.unit) === 0) {
                let highest = Math.max(highestPrice(PIXEL, "buy", buy.price) + 0.001, buy.floor);
                if (highest < buy.price || buy.price < buy.floor) {
                    buy.price = highest
                    Game.market.changeOrderPrice(order.id, buy.price);
                    console.log(`[Pixel] 像素购入价格变更! 新价格: ${buy.price}`);
                }
            }
        }
    }
    let sell = Memory.pixelInfo.sell;
    if (sell.num > 0 && Game.time % (2 * sell.unit) === 0) {
        let sellOrder: string;
        if (!Game.market.getOrderById(sell.order)) {
            for (let i in Game.market.orders) {
                let order = Game.market.getOrderById(i);
                if (order.resourceType === PIXEL && order.type === ORDER_SELL) {
                    sellOrder = order.id;
                    break;
                }
            }
        } else sellOrder = sell.order;
        let order = Game.market.getOrderById(sellOrder);
        sell.order = sellOrder;
        if (order) {
            if (order.remainingAmount === 0){
                let extendAmount = Math.min(sell.unit, sell.num);
                if (Game.market.extendOrder(order.id, extendAmount) === OK) {
                    sell.num -= extendAmount;
                }
            }
            if (Game.time % (13 * sell.unit) === 0) {
                let lowest = Math.min(lowestPrice(PIXEL, "sell", buy.price * 1.05 / 0.95 * 1.10) - 0.001, sell.ceil); //至少10%利润
                if (sell.price < lowest || sell.price > sell.ceil) {
                    sell.price = lowest;
                    Game.market.changeOrderPrice(order.id, sell.price);
                    console.log(`[Pixel] 像素卖出价格变更! 新价格: ${sell.price}`);
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