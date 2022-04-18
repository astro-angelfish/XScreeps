import { ResourceDispatch } from "@/module/dispatch/resource"
import { RoomDataVisual } from "@/module/visual/visual"

/* [通用]房间运行主程序 */
export default () => {

    if (!Memory.RoomControlData) Memory.RoomControlData = {}
    global.Marketorder = {};/*tick重置已有的订单列表信息*/
    // console.log(Game.time, "-----------------------------cpu消耗分析----------------------------------------")
    for (var roomName in Memory.RoomControlData) {
        let thisRoom = Game.rooms[roomName]
        if (!thisRoom) continue
        // let cpu_list = [];
        // cpu_list.push(Game.cpu.getUsed())
        /* 房间核心 */
        thisRoom.RoomInit()         // 房间数据初始化
        // cpu_list.push(Game.cpu.getUsed())
        thisRoom.RoomEcosphere()    // 房间状态、布局
        // cpu_list.push(Game.cpu.getUsed())
        thisRoom.SpawnMain()        // 常驻爬虫的孵化管理 [不涉及任务相关爬虫的孵化]
        // cpu_list.push(Game.cpu.getUsed())

        /* 房间运维 */
        thisRoom.MissionManager()   // 任务管理器
        // cpu_list.push(Game.cpu.getUsed())
        thisRoom.SpawnExecution()   // 孵化爬虫
        // cpu_list.push(Game.cpu.getUsed())
        thisRoom.TowerWork()        // 防御塔工作
        // cpu_list.push(Game.cpu.getUsed())
        thisRoom.StructureMission() // terminal link factory 工作
        // cpu_list.push(Game.cpu.getUsed())
        ResourceDispatch(thisRoom)      // 资源调度
        // cpu_list.push(Game.cpu.getUsed())
        RoomDataVisual(thisRoom)        // 房间可视化
        // cpu_list.push(Game.cpu.getUsed())
        thisRoom.LevelMessageUpdate()        // 房间等级Memory信息更新
        // cpu_list.push(Game.cpu.getUsed())
        // console.log(
        //     '初始化' + (cpu_list[1] - cpu_list[0]).toFixed(2),
        //     '房间状态' + (cpu_list[2] - cpu_list[1]).toFixed(2),
        //     '孵化管理' + (cpu_list[3] - cpu_list[2]).toFixed(2),
        //     '任务管理器' + (cpu_list[4] - cpu_list[3]).toFixed(2),
        //     '孵化爬虫' + (cpu_list[5] - cpu_list[4]).toFixed(2),
        //     '防御塔工作' + (cpu_list[6] - cpu_list[5]).toFixed(2),
        //     '工厂' + (cpu_list[7] - cpu_list[6]).toFixed(2),
        //     '资源调度' + (cpu_list[8] - cpu_list[7]).toFixed(2),
        //     '房间可视化' + (cpu_list[9] - cpu_list[8]).toFixed(2),
        //     'Memory信息更新' + (cpu_list[10] - cpu_list[9]).toFixed(2),
        //     thisRoom,
        // )
    }
}