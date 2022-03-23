import { ResourceDispatch } from "@/module/dispatch/resource"

/* [通用]房间运行主程序 */
export default ()=>{

    if (!Memory.RoomControlData) Memory.RoomControlData = {}
    for (var roomName in Memory.RoomControlData)
    {
        let thisRoom = Game.rooms[roomName]
        if (!thisRoom) continue
        /* 房间核心 */
        thisRoom.RoomInit()         // 房间数据初始化
        thisRoom.RoomEcosphere()    // 房间状态、布局
        thisRoom.SpawnMain()        // 常驻爬虫的孵化管理 [不涉及任务相关爬虫的孵化]

        /* 房间运维 */ 
        thisRoom.MissionManager()   // 任务管理器

        thisRoom.SpawnExecution()   // 孵化爬虫

        thisRoom.TowerWork()        // 防御塔工作

        thisRoom.StructureMission() // terminal link factory 工作
        
        ResourceDispatch(thisRoom)      // 资源调度

        thisRoom.LevelMessageUpdate()        // 房间等级Memory信息更新

    }
}