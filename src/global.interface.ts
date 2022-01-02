/* 存放全局声明 */
declare module NodeJS {
    interface Global {
        /* 用于判定全局扩展是否已经挂载 */
        Mounted:boolean
        CreepBodyData:{[roomName:string]:{[creepRole:string]:BodyPartConstant[]}}    // 每种类型爬虫的体型数据
        CreepNumData:{[roomName:string]:{[creepRole:string]:number}}    // 每种类型爬虫的实际数量
    }
}