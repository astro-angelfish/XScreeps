interface StructureLink{
    ManageMission():void
}
interface StructureTerminal{
    ManageMission():void
    ResourceBalance():void
    ResourceSend(task:MissionModel):void
    ResourceDeal(task:MissionModel):void
}

interface RoomMemory{
    TerminalData:{[resource:string]:{num:number,fill?:boolean}}
    market:MarketData
    // Factory:Factory
    productData:factoryData
}

interface MarketData{
    [kind:string]:LittleMarketData[]
}
interface LittleMarketData{
    rType:ResourceConstant
    num:number
    price?:number
    unit?:number    // terminal量
    id?:string      // 交易ID
    continue?:boolean   // 卖完了一批次是否填充
    changePrice?:boolean    // 是否需要修改价格
    time?:number
}

// interface Factory {
//     factoryData: { [resource in CommodityConstant | MineralConstant | "energy" | "G"]?: { num?: number, fill?: boolean } }                       //资源平衡
//     produce: { [resource in CommodityConstant | MineralConstant | "energy" | "G"]?: boolean }               //合成
//     dataProduce: { [resource in CommodityConstant | MineralConstant | "energy" | "G"]?: { num?: number } }//固定数量合成
//     level:number
// }

interface factoryData{
    level:number        // 工厂等级
    state: "sleep" | "flow" | "base"    // 3种状态 休眠、生产线（生产生产线所需商品）、基础（生产基础物资）
    flowCom?: CommodityConstant    // 生产线要生产的物资种类 没有数量
    baseList:{[resource in CommodityConstant | MineralConstant | "energy" | "G"]?: { num: number}} // 基础生产列表、数量
    producing?:{com:CommodityConstant,num?:number}      // 正在生产的材料
    balanceData: { [resource in CommodityConstant | MineralConstant | "energy" | "G"]?: { num?: number, fill?: boolean } } // 平衡数据
    unzip?:{[resource in CommodityConstant | MineralConstant | "energy" | "G"]?: { num: number}} // 解压
}

interface StructureFactory{
    add(res:CommodityConstant,num:number):string
    remove(res:CommodityConstant):string
    set(res:CommodityConstant):string
    del(res:CommodityConstant):string
}