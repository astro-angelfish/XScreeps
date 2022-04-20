import { processResourceDispatch } from '@/module/dispatch/resource'
import { processRoomDataVisual } from '@/module/visual/visual'

/* [通用]房间运行主程序 */
export default () => {
  if (!Memory.roomControlData)
    Memory.roomControlData = {}

  for (const roomName in Memory.roomControlData) {
    const thisRoom = Game.rooms[roomName]
    if (!thisRoom)
      continue

    // 房间核心
    // 房间数据初始化
    thisRoom.initRoom()
    // 房间状态、布局
    thisRoom.processRoomEcosphere()
    // 常驻爬虫的孵化管理 [不涉及任务相关爬虫的孵化]
    thisRoom.spawnMain()

    // 房间运维
    // 任务管理器
    thisRoom.processMission()
    // 孵化爬虫
    thisRoom.spawnExecution()
    // 防御塔工作
    thisRoom.processTowers()
    // terminal link factory 工作
    thisRoom.processStructureMission()
    // 资源调度
    processResourceDispatch(thisRoom)
    // 房间可视化
    processRoomDataVisual(thisRoom)
    // 房间等级 Memory 信息更新
    thisRoom.updateLevelCache()
  }
}
