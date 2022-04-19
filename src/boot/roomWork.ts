import { ResourceDispatch } from '@/module/dispatch/resource'
import { RoomDataVisual } from '@/module/visual/visual'

/* [通用]房间运行主程序 */
export default () => {
  if (!Memory.roomControlData)
    Memory.roomControlData = {}
  for (const roomName in Memory.roomControlData) {
    const thisRoom = Game.rooms[roomName]
    if (!thisRoom)
      continue
    /* 房间核心 */
    thisRoom.initRoom() // 房间数据初始化
    thisRoom.processRoomEcosphere() // 房间状态、布局
    thisRoom.spawnMain() // 常驻爬虫的孵化管理 [不涉及任务相关爬虫的孵化]

    /* 房间运维 */
    thisRoom.processMission() // 任务管理器

    thisRoom.spawnExecution() // 孵化爬虫

    thisRoom.processTowers() // 防御塔工作

    thisRoom.runStructureMission() // terminal link factory 工作

    ResourceDispatch(thisRoom) // 资源调度

    RoomDataVisual(thisRoom) // 房间可视化

    thisRoom.updateLevelCache() // 房间等级Memory信息更新
  }
}
