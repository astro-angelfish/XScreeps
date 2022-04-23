import { roleData } from '@/creep/constant/spawn'
import { generateBody, getBodyEnergyCost } from '@/utils'

/* [通用]爬虫运行主程序 */
export function processCreepWork() {
  // powercreep
  for (const pc in Game.powerCreeps) {
    if (Game.powerCreeps[pc].ticksToLive)
      Game.powerCreeps[pc].manageMission()
  }

  // creep
  let reducedToEA = true // 每tick执行一次adaption检查
  for (const c in Game.creeps) {
    const thisCreep = Game.creeps[c]
    if (!thisCreep)
      continue

    // 爬虫出生角色可视化
    if (thisCreep.spawning)
      thisCreep.room.visual.text(`${thisCreep.memory.role}`, thisCreep.pos.x, thisCreep.pos.y, { color: '#ffffff', font: 0.4, align: 'center', backgroundColor: '#696969', opacity: 0.3 })

    // 跨 shard 找回记忆
    if (!thisCreep.memory.role) {
      const InshardMemory = global.intershardData
      if (InshardMemory.creep[c]) {
        Game.creeps[c].memory = InshardMemory.creep[c].MemoryData
        InshardMemory.creep[c].state = 1
      }
      continue
    }

    const thisRoleData = roleData[thisCreep.memory.role]
    if (!thisRoleData)
      continue

    // 自适应体型生产的爬虫执行恢复体型的相关逻辑
    if (reducedToEA && thisCreep.memory.reducedToEA && thisCreep.store.getUsedCapacity() === 0) {
      const belongRoom = Game.rooms[thisCreep.memory.belong]
      if (!belongRoom)
        continue

      // 如果 global 有该爬虫的部件信息，优先用 global 的数据
      let bodyParam = global.SpecialBodyData[belongRoom.name][thisCreep.memory.role]
       ?? belongRoom.memory.spawnConfig[thisCreep.memory.role].body

      // 任务爬虫特殊体型处于最高优先级
      if (thisCreep.memory?.msb && thisCreep.memory.taskRB) {
        if (global.MSB[thisCreep.memory.taskRB]?.[thisCreep.memory.role])
          bodyParam = global.MSB[thisCreep.memory.taskRB][thisCreep.memory.role]
      }

      if (bodyParam) {
        const body = generateBody(bodyParam)
        const bodyCost = getBodyEnergyCost(body)

        if (belongRoom.energyAvailable >= bodyCost && belongRoom.memory.spawnQueue && belongRoom.memory.spawnQueue.length <= 0) {
          thisCreep.suicide()
          reducedToEA = false
        }
      }
      // adaption爬虫执行自S
    }

    // 非任务类型爬虫
    if (thisRoleData.func)
      thisRoleData.func(thisCreep)
    // 任务类型爬虫
    else
      thisCreep.manageMission()
  }
}
