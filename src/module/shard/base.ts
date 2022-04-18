/* 跨shard基本操作函数 */

// 基本定义
// 跨 shard 记忆是个对象包含 creep 和 mission 两个大分支
// creep 里存储以爬虫名字为 key 的爬虫记忆，并定时清除
// mission 里包含以任务ID为 Key 的任务

// const shardMemory = {
//   creep: {
//     // ...
//     creep1: { // 爬虫名称
//       MemoryData: {},
//       state: 0, // 状态码：0代表还未传输、1代表已经传输
//       delay: 1500, // 超时倒计时 超过1500tick将自动删除,所有爬虫数据均是如此
//     },
//     //  ...
//   },
//   mission: {
//     //  ...
//     Cskfvde23nf34: { // 任务ID
//       MemoryData: {},
//       state: 0, // 状态码：0代表还未传输、1代表已经传输
//       delay: 5000, // 超过5000tick将自动删除
//     },
//     // ...
//   },
//   shardName: shard3, // 脚本运行shard名,
//   communication: {
//     state: 0, // 状态码: 0代表无请求、1代表请求发送、2代表发送成功、3代表接受成功 同时只能发送一种数据/只能一方发给另外一方
//     sourceShard: shard3, // 源shard
//     relateShard: shard2, // 想要通讯的shard
//     data: {}, // 爬虫或者任务的数据
//     type: 1, // 类型：1代表爬虫数据、2代表任务数据
//     delay: 200, // 超时倒计时
//   },
// }

/**
 * ShardMemory 数据初始化
  */
export function initShardMemory(): void {
  if (Game.time % 10)
    return

  const data = JSON.parse(InterShardMemory.getLocal() || '{}') || {}
  if (Object.keys(data).length < 3 || !data.creep || !data.mission) {
    InterShardMemory.setLocal(JSON.stringify({
      creep: {}, mission: {}, shardName: Game.shard.name,
    }))
    console.log('已经初始化', Game.shard.name, '的 InterShardMemory!')
    return
  }

  // 爬虫 shard 记忆超时计算
  for (const creepName in data.creep) {
    data.creep[creepName].delay -= 10
    if (data.creep[creepName].delay <= 0)
      delete data.creep[creepName]

    // 爬已经接到记忆了
    if (Game.creeps[creepName] && Game.creeps[creepName].memory.role)
      delete data.creep[creepName]
  }

  // 任务 shard 记忆超时计算
  for (const missionId in data.mission) {
    data.mission[missionId].delay -= 10
    if (data.mission[missionId].delay <= 0)
      delete data.mission[missionId]
  }

  // 通信更新
  if (data.communication) {
    data.communication.delay -= 10
    if (data.communication.delay <= 0)
      delete data.communication
  }

  InterShardMemory.setLocal(JSON.stringify(data))
}

/**
 * 获取其他shard的数据
 */
export function getShardCommunication(shardName: string): any {
  if (shardName === Game.shard.name)
    return null

  const Data = JSON.parse(InterShardMemory.getRemote(shardName) || '{}') || {}
  if (Object.keys(Data).length < 3)
    return null // 说明该 shard 不存在 InterShardMemory
  if (!Data.communication)
    return null

  return Data.communication
}

/**
 * 请求传输数据到目标 shard
 */
export function shardCommRequest(req: RequestData): boolean {
  const thisData = JSON.parse(InterShardMemory.getLocal() || '{}')
  if (thisData.communication && thisData.communication.state !== 0)
    return false

  thisData.communication = {
    state: 1,
    relateShard: req.relateShard,
    sourceShard: req.sourceShard,
    type: req.type,
    data: req.data,
    delay: 100,
  }

  InterShardMemory.setLocal(JSON.stringify(thisData))
  return true
}

/**
 * 响应目标 shard 的传输数据 并将其拷贝到自己的记忆里
 */
export function shardCommResponse(shardName: string): boolean {
  const comData = getShardCommunication(shardName)
  if (comData === null)
    return false
  if (comData.state !== 1 || comData.relateShard !== Game.shard.name)
    return false

  const thisData = JSON.parse(InterShardMemory.getLocal() || '{}')
  if (thisData.communication && thisData.communication.relateShard !== Game.shard.name)
    return false // 在忙中，无法响应

  thisData.communication = {
    state: 2,
    relateShard: comData.relateShard,
    sourceShard: comData.sourceShard,
    type: comData.type,
    data: comData.data,
    delay: 100,
  }

  if (comData.type === 1)
    thisData.creep[comData.data.id] = { MemoryData: comData.data.MemoryData, delay: 100, state: 1 }

  else if (comData.type === 2)
    thisData.mission[comData.data.id] = { MemoryData: comData.data.MemoryData, delay: 50, state: 1 }

  InterShardMemory.setLocal(JSON.stringify(thisData))
  // 响应成功
  return true
}

/**
 * 确认目标 shard 已经收到了数据
 */
export function shardCommConfirm(): boolean {
  const thisData = JSON.parse(InterShardMemory.getLocal() || '{}')
  if (!thisData.communication)
    return false

  const comData = getShardCommunication(thisData.communication.relateShard)
  if (comData === null)
    return false
  if (comData.state !== 2 || comData.relateShard !== thisData.communication.relateShard)
    return false

  thisData.communication.state = 3
  delete thisData.communication.data

  InterShardMemory.setLocal(JSON.stringify(thisData))
  // 响应成功
  return true
}

/**
 * 删除 communication
 */
export function shardCommDelete(): boolean {
  const thisData = JSON.parse(InterShardMemory.getLocal() || '{}')
  if (!thisData.communication)
    return false

  if (Game.shard.name === thisData.communication.relateShard) {
    const data = JSON.parse(InterShardMemory.getRemote(thisData.communication.sourceShard) || '{}') || {}

    if (data.communication.state === 3) {
      delete thisData.communication
      InterShardMemory.setLocal(JSON.stringify(thisData))
      return true
    }

    return false
  }
  else if (Game.shard.name === thisData.communication.sourceShard) {
    // 只需要确定对方是否还有 communication
    const data = JSON.parse(InterShardMemory.getRemote(thisData.communication.relateShard) || '{}') || {}

    if (!data.communication)
      return true

    return false
  }
  return false
}

const allShards = ['shard1', 'shard2', 'shard3']
const otherShards = allShards.filter(shard => shard !== Game.shard.name)

/**
 * 跨 shard 运行主函数
 */
export function processShardMemory(): void {
  const data = JSON.parse(InterShardMemory.getLocal() || '{}') || {}
  if (Object.keys(data).length < 3)
    return

  // 没有通话状态，就一直监听
  if (!data.communication) {
    for (const s of otherShards) {
      if (shardCommResponse(s))
        return
    }
  }
  else {
    if (data.communication.state === 1)
      shardCommConfirm()

    else if (data.communication.state === 2)
      shardCommDelete()

    else if (data.communication.state === 3)
      shardCommDelete()
  }
}
