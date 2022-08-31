/* screeps战争框架声明文件 */

/**
 * 设计思想
 * 爬虫的孵化 boost由常规任务控制
 * boost操作完成后 将爬虫投入战争框架运行  战争框架是一个独立的函数，在主程序中运行,专门负责处理各类战争任务
 * 
 * 当然 还涉及一个战争框架数据的跨shard传输的问题，我的建议是由爬虫传输
*/

interface Memory {
    warframe: warframeData
}

interface warframeData {
    creep: {[creepName:string]:string}  // 受战争框架控制爬虫 {爬虫名：爬虫所属战争任务}
    task: {[taskID:string]:warTaskData}      // 战争任务数据
}

interface warTaskData {
    warType: "war" | "patrol"   // 战争类型 战争 or 巡逻
    teamType: "aio" | "double" | "tre" | "squad" // 组队类型 单独 双人 三人 四人
    disRoom: string         // 目标房间
    disShard:string         // 目标shard
    unitRoom?:string         // 集合房间  进攻前的休整房间 非必须  主要用于需要组队的任务
    creepBind: {[creepName:string]:{rTyPe?:string}}     // 绑定爬虫 包含爬虫的一些信息  比如 四人小队 rType为heal和attack的执行不同操作
    taskData:any        // 具体任务的数据 用于存放其他杂项
}
