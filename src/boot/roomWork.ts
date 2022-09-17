import { ResourceDispatch } from "@/module/dispatch/resource"
import { processRoomDataVisual } from "@/module/visual/visual"

/* [通用]房间运行主程序 */
export const roomRunner = function (room: Room): void {
    if (!Memory.RoomControlData[room.name]) return  // 非框架控制不运行
    if (!room?.controller?.my) return
    var cpu_test = false
    if (Memory.Systemswitch.Showtestroom) {
        cpu_test = true
      }
    let cpu_list = [];
    /* 房间核心 */
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    room.RoomInit()         // 房间数据初始化
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    room.RoomEcosphere()    // 房间状态、布局
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    room.SpawnMain()        // 常驻爬虫的孵化管理 [不涉及任务相关爬虫的孵化]
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    /* 房间运维 */
    room.MissionManager()   // 任务管理器
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    room.SpawnExecution()   // 孵化爬虫
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    room.TowerWork()        // 防御塔工作
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    room.StructureMission() // terminal link factory 工作
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    ResourceDispatch(room)      // 资源调度
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    processRoomDataVisual(room)        // 房间可视化
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    room.LevelMessageUpdate()        // 房间等级Memory信息更新
    if (cpu_test) {
        cpu_list.push(Game.cpu.getUsed())
        console.log(
            room.name,
            '初始化' + (cpu_list[1] - cpu_list[0]).toFixed(3),
            '房间布局' + (cpu_list[2] - cpu_list[1]).toFixed(3),
            '孵化管理' + (cpu_list[3] - cpu_list[2]).toFixed(3),

            '任务管理' + (cpu_list[4] - cpu_list[3]).toFixed(3),
            '孵化爬虫' + (cpu_list[5] - cpu_list[4]).toFixed(3),
            '防御塔' + (cpu_list[6] - cpu_list[5]).toFixed(3),

            'T-L-F' + (cpu_list[7] - cpu_list[6]).toFixed(3),
            '资源调度' + (cpu_list[8] - cpu_list[7]).toFixed(3),
            '房间可视' + (cpu_list[9] - cpu_list[8]).toFixed(3),

            '总计' + (cpu_list[10] - cpu_list[0]).toFixed(3),
        )
    }
}


