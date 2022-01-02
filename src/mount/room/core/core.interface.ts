interface Room {
    // init
    RoomInit():void
    RoomMemoryInit():void
    RoomStructureInit():void
    RoomSpawnListInit():void
}

interface RoomMemory {
    StructureIdData:any // 存放房间内建筑ID信息
    RoomLabBind:RoomLabBind // 存放房间lab调用相关绑定信息
    SpawnMessage:SpawnMessageData // 存放房间孵化信息
    SpawnList:SpawnList[]
    originLevel:number          // 房间控制器等级，房间等级变化会跟着变化
}

/* 房间记忆实验室绑定数据格式 */
interface RoomLabBind{
    [id:string]:{missonID:string[],rType:ResourceConstant,occ?:boolean}     // occ为true时不允许新增占用lab
}

/**
 *  孵化根据机制分为三类，补员型【少于一定数量就孵化】，间隔型【每xx时间添加一次孵化任务】，任务型【根据不同任务需要添加孵化任务】
 *  其中：SpanObjectList类型里，有interval视为间隔型，其他存在SpawnMessageData里的任务为补员型，否则就为任务型
 *  SpawnMessage = 
 * {
 *      ...
 *      "harvester":{num:2,must:true},
 *      "scouter":{num:1,interval:400,time:390},
 *      ...
 * }
 */
interface SpawnMessageData {
    [role:string]:SpawnObjectList
}

interface SpawnObjectList {
    /* 手动设置参数 */      
    num:number,        // 数量 【必备参数】
    must?:boolean,      // 是否无论何时也要孵化
    adaption?:boolean,  // 是否自适应体型
    interval?:number,       // 孵化间隔时间 【重要参数，会根据是否有这个参数执行对应孵化逻辑】
    /* 程序运行参数 */
    time?:number    // 孵化冷却
}

interface SpawnList {
    role:string // 爬虫角色
    body:number[]   // 爬虫身体部件
    memory?:SpawnMemory     // 是否有额外的记忆需要添加
}

interface SpawnMemory {
    [mem:string]:any
}
