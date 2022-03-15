/**
 * 任务相关声明
 */
interface Creep{
    ManageMisson():void

    // 任务
    handle_feed():void
    handle_carry():void
    handle_repair():void
    handle_planC():void
    handle_dismantle():void
    handle_quickRush():void
    handle_expand():void
    handle_support():void
    handle_control():void
    handle_helpBuild():void
    handle_sign():void
    handle_aio():void
    handle_mineral():void
    handle_outmine():void
}

interface CreepMemory{
    MissionData?:any
    double?:string  // 双人小队
    captain?:boolean
    swith?:boolean
    disPos?:string
    num?:number
    bindpoint?:string
}