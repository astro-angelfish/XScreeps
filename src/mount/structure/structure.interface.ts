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