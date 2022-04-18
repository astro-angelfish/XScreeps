/**
 * 统计所有爬虫归属，统计数目 【已测试】
 */
export function CreepNumStatistic(): void {
  if (!global.creepNumData)
    global.creepNumData = {}
  for (const roomName in Memory.roomControlData) {
    if (Game.rooms[roomName] && !global.creepNumData[roomName])
      global.creepNumData[roomName] = {}
    if (global.creepNumData[roomName]) {
      /* 所有角色数量归零 从0开始统计 */
      for (const roleName in global.creepNumData[roomName])
        global.creepNumData[roomName][roleName] = 0
    }
  }
  /* 计算爬虫 */
  const shard = Game.shard.name
  for (const c in Memory.creeps) {
    const creep_ = Game.creeps[c]
    /* 代表爬虫死亡或进入星门，清除记忆 */
    if (!creep_) {
      delete Memory.creeps[c]
      // console.log(`爬虫${c}的记忆已被清除！`)
      continue
    }
    /* 代表爬虫没记忆或刚出星门  */
    if (!creep_.memory.role)
      continue
    /* 代表爬虫是其他shard的来客 */
    if (creep_.memory.shard != shard)
      continue
    /* 代表爬虫所属房间已经没了 */
    if (!Game.rooms[creep_.memory.belong])
      continue
    if (!global.creepNumData[creep_.memory.belong][creep_.memory.role])
      global.creepNumData[creep_.memory.belong][creep_.memory.role] = 0
    /* 添加统计数目 */
    global.creepNumData[creep_.memory.belong][creep_.memory.role] += 1
  }
}
