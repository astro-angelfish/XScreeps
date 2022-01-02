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
    SpawnList:SpawnListData[]
    originLevel:number          // 房间控制器等级，房间等级变化会跟着变化
}

/* 房间记忆实验室绑定数据格式 */
interface RoomLabBind{
    [id:string]:{missonID:string[],rType:ResourceConstant,occ?:boolean}     // occ为true时不允许新增占用lab
}

/**
 * SpawnMessageData和SpawnObjectList组成房间内的孵化的数量信息，结构大致如下
 * Game.rooms['xxxx'].memory.SpawnList:
 * {
 *      counter:        // 计数类型 爬虫少于指定数量即添加该爬虫进孵化队列
 *          {
 *              ...
 *              'manage':{num:1,must:true,adaption:true,level:number},
 *              ...
 *          },
 *      timer:          // 计时类型 过了一定时间后将指定批次的爬虫添加进孵化队列
 *          {
 *              ...
 *              'attacker':{time:1000,num:2,level:number,startTime:number},
 *              ...
 *          }
 * }
 */
interface SpawnMessageData {
    [classification:string]:SpawnObjectList
}

interface SpawnObjectList {
    num?:number,        // 计数目标数量
    must?:boolean,      // 是否无论何时也要孵化
    adaption?:boolean,  // 是否自适应体型
    time?:number,       // 孵化间隔时间
    start?:number       // 计时起始时间
}
/**
 * spawn孵化队列里的基本信息
*/
interface SpawnListData {
    role?:string,
    level?:number
}