import { allResource, roomResource } from '../control/local/resource'
import { getStore } from '../control/local/store'
import { colorfyLog } from '@/utils'

/* 与资源相关的 */
export default {
  resource: {
    ls(): string {
      allResource()
      return '[resource] 全局资源统计完毕!'
    },
    room(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[resource] 不存在房间 ${roomName}`

      roomResource(roomName)

      return `[resource] 房间 ${roomName} 资源统计完毕!`
    },
    com(): string {
      return [
        '压缩商品资源:',
        'battery(wn) utrium_bar(U) lemergium_bar(L) keanium_bar(K) zynthium_bar(Z)',
        'ghodium_melt(G) oxidant(O) reductant(H) purifier(X)',
        '基础商品资源:',
        'wire cell alloy condensate composite crystal liquid',
        colorfyLog('机械商品:', '#f8a505', true),
        colorfyLog('tube fixtures frame hydraulics machine', '#f8a505', false),
        colorfyLog('生物商品:', '#05f817', true),
        colorfyLog('phlegm tissue muscle organoid organism', '#05f817', false),
        colorfyLog('电子商品:', 'blue', true),
        colorfyLog('switch transistor microchip circuit device', 'blue', false),
        colorfyLog('奥秘商品:', '#5147ea', true),
        colorfyLog('concentrate extract spirit emanation essence', '#5147ea', false),
      ].join('\n')
    },
  },
  store: {
    ls(): string {
      getStore()
      return '[store] 全局容量信息统计完毕!'
    },
    room(roomName: string): string {
      const thisRoom = Game.rooms[roomName]
      if (!thisRoom)
        return `[store] 不存在房间 ${roomName}`

      getStore(roomName)

      return `[store] 房间 ${roomName} 容量信息统计完毕!`
    },
  },
  /* 任务输出调试屏蔽 */
  missionVisual: {
    add(name: string): string {
      if (!Memory.ignoreMissionName)
        Memory.ignoreMissionName = []

      if (!Memory.ignoreMissionName?.includes(name))
        Memory.ignoreMissionName.push(name)
      return `[ignore] 已经将任务 ${name} 添加进输出调试的忽略名单里!`
    },
    rm(name: string): string {
      if (!Memory.ignoreMissionName?.includes(name))
        return `[ignore] 删除 ${name} 出调试输出忽略名单失败!`

      const index = Memory.ignoreMissionName.indexOf(name)
      Memory.ignoreMissionName.splice(index, 1)

      return `[ignore] 已经将任务 ${name} 删除出输出调试的忽略名单里!`
    },
  },
}
