/**
 * 任务相关声明
 */
interface Creep{
    ManageMisson():void

    // 任务
    handle_feed():void
}

interface CreepMemory{
    MissionData?:any
}