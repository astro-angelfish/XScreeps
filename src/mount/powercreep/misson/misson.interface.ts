interface PowerCreepMemory{
    role?:string
    belong?:string
    spawn?:string
    MissionData?:any  // 处理任务过程中任务的信息
    MissionState?:number
    shard?:shardName
    working?:boolean
}

interface PowerCreep{
    ManageMisson():void
    OpsPrepare(): boolean

    handle_pwr_storage():void

    withdraw_(distination:Structure,rType:ResourceConstant) : void
    transfer_(distination:Structure,rType:ResourceConstant) : void
}