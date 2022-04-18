import { RoleLevelData, roleData } from '@/constant/spawnConstant'
import { generateBody, getBodyEnergyCost } from '@/utils'

/* [通用]爬虫运行主程序 */
export default () => {
  /* powercreep */
  for (const pc in Game.powerCreeps) {
    if (Game.powerCreeps[pc].ticksToLive)
      Game.powerCreeps[pc].manageMission()
  }
  /* creep */
  let adaption = true // 每tick执行一次adaption检查
  for (const c in Game.creeps) {
    const thisCreep = Game.creeps[c]
    if (!thisCreep)
      continue
    if (thisCreep.spawning) {
      /* 爬虫出生角色可视化 */
      thisCreep.room.visual.text(`${thisCreep.memory.role}`, thisCreep.pos.x, thisCreep.pos.y, { color: '#ffffff', font: 0.4, align: 'center', backgroundColor: '#696969', opacity: 0.3 })
    }
    /* 跨shard找回记忆 */
    if (!thisCreep.memory.role) {
      const InshardMemory = JSON.parse(InterShardMemory.getLocal()) || {}
      if (InshardMemory.creep && InshardMemory.creep[c]) {
        Game.creeps[c].memory = InshardMemory.creep[c].MemoryData
        InshardMemory.creep[c].state = 1
      }
      continue
    }
    if (!roleData[thisCreep.memory.role])
      continue
    // 自适应体型生产的爬虫执行恢复体型的相关逻辑
    if (adaption && thisCreep.memory.adaption && thisCreep.store.getUsedCapacity() == 0) {
      const room = Game.rooms[thisCreep.memory.belong]
      if (!room)
        continue
      const bodyData = RoleLevelData[thisCreep.memory.role][room.controller.level].bodypart
      const allSpawnenergy = CalculateEnergy(GenerateAbility(bodyData[0], bodyData[1], bodyData[2], bodyData[3], bodyData[4], bodyData[5], bodyData[6], bodyData[7]))
      if (bodyData && room.energyAvailable >= allSpawnenergy && room.memory.spawnQueue && room.memory.spawnQueue.length <= 0) {
        thisCreep.suicide()
        adaption = false
      }
      /* adaption爬虫执行自S */
    }
    /* 非任务类型爬虫 */
    if (roleData[thisCreep.memory.role].func)
      roleData[thisCreep.memory.role].func(thisCreep)

    /* 任务类型爬虫 */
    else
      thisCreep.manageMission()
  }
}
