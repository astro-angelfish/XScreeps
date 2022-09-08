import { random, slice } from "lodash"
import { AppLifecycleCallbacks } from "../framework/types"
/**
 * Memory初始化
 */
export const MemoryInit = function (): void {
    if (!Memory.whitesheet) Memory.whitesheet = []
    if (!Memory.bypassRooms) Memory.bypassRooms = []
    if (!Memory.ignoreMissonName) Memory.ignoreMissonName = []
    if (!Memory.ignoreLab) Memory.ignoreLab = false
    if (!Memory.RoomControlData) Memory.RoomControlData = {}
    if (!global.Gtime) global.Gtime = {}
    for (let i in Memory.RoomControlData) if (!global.Gtime[i]) {global.Gtime = {}; initGTime();}
    if (!global.SpecialBodyData) global.SpecialBodyData = {}
    for (let i in Memory.RoomControlData) if (!global.SpecialBodyData[i]) global.SpecialBodyData[i] = {}
    // if (!global.intervalData) global.intervalData = {}
    // for (let i in global.intervalData) if (!global.intervalData[i]) global.intervalData[i] = {}
    if (!global.Stru) global.Stru = {}
    if (!global.HostileData) global.HostileData = {}
    if (!global.HostileTowerData) global.HostileTowerData = {}
    if (!global.HostileCreeps) global.HostileCreeps = {}
    if (!global.HostileCreepsData) global.HostileCreepsData = {}
    if (!global.HostileGroup) global.HostileGroup = {}
    if (!Memory.marketAdjust) Memory.marketAdjust = {}
    if (!Memory.ResourceDispatchData) Memory.ResourceDispatchData = []
    if (!global.ResourceLimit) global.ResourceLimit = {}
    if (!Memory.outMineData) Memory.outMineData = {}
    if (!global.warData) global.warData = { tower: {}, enemy: {}, flag: {}, structure: {} }
    if (!global.MSB) global.MSB = {}
    if (!Memory.StopPixel) Memory.StopPixel = false
    if (!Memory.pixelInfo || !Memory.pixelInfo.buy || !Memory.pixelInfo.sell) Memory.pixelInfo = {buy: {num: 0, price: 0, unit: 1, floor: 0, order: ""}, sell: {num: 0, price: 0, unit: 1, ceil: 0, order: ""}}
    if (!global.Repairlist) global.Repairlist = {}
    if (!Memory.creepscpu) { Memory.creepscpu = {} }
    if (!global.getStructure) global.getStructure = {}
    if (!global.getStructureData) global.getStructureData = {}
    if (!global.controllerData) { global.controllerData = {} }
    if (!Memory.PowerSupply) { Memory.PowerSupply = [] }
    if (!Memory.ObserverList) { Memory.ObserverList = {} }
    if (!global.PowerDemand) global.PowerDemand = []
    if (!global.RoleMissionNum) global.RoleMissionNum = {}
    global.Marketorder = {};/*tick重置已有的订单列表信息*/
    global.RoomDataVisual = null
    global.Adaption = {}
    global.RoomResource = {}
    global.HostileCreepsData = {}
    global.MarketAveprice = {}
    
    // Memory.SystemEconomy = false;
    if (Game.time % 100) {
        for (let rooms in Memory.rooms) {
            if (!Game.rooms[rooms]) {
                delete Memory.rooms[rooms]
            }
        }
    }
}
export const MemoryTickStart = function (): void {

}

export const memoryInit: AppLifecycleCallbacks = {
    tickStart: MemoryInit
}

function shuffle(array) {
    var i = array.length, j = 0, temp;
    while (i--) {
        j = Math.floor(Math.random() * (i+1));
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function initGTime() {
    let j = 0;
    //打乱房间执行顺序，避免多个房间在同一tick执行任务
    let order = shuffle([...Array(Object.keys(Memory.RoomControlData).length).keys()]);
    for (let i in Memory.RoomControlData) global.Gtime[i] = Game.time - order[j++] - 1;
}