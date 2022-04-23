// 重构跨shard模块
// {
//   // 存储跨shard爬虫memory
//   creep: {
//     // ...
//     // 爬虫名称
//     creep1:
//          {
//            MemoryData: {},
//            state: 0 / 1, // 状态码：0代表还未传输、1代表已经传输
//            delay: 200, // 超时倒计时,超过200tick将自动删除,所有爬虫数据均是如此
//          },
//     // ...
//   },
//   // 存储跨shard任务memory
//   misson: {
//     // ...
//     // 任务ID
//     Cskfvde23nf34: {
//       MemoryData: {},
//       state: 0 / 1, // 状态码：0代表还未传输、1代表已经传输
//       delay: 10000, // 超过10000tick将自动删除
//     },
//     // ...
//   },
//   command: [
//     // ...
//     {
//       name: '指令名称',
//       data: '指令参数',
//     },
//     // ...
//   ],
//   // 所在shard
//   shardName: 'shard3',
//   // 沟通大厅
//   hall: {
//     shard2: {
//       // ...
//     },
//     // ...
//     shard1: {
//       state: 0, // 状态码: 0代表无请求、1代表请求发送、2代表发送成功、3代表接受成功
//       data: {}, // 爬虫/任务/指令的数据
//       type: 1, // 类型：1代表爬虫数据、2代表任务数据、3代表指令
//       delay: 200, // 超时倒计时
//       memorydelay: 99999, // 记忆超时 (可选)
//     },
//   },
// }

const allShards = ['shard0', 'shard1', 'shard2', 'shard3']
const otherShards = allShards.filter(shard => shard !== Game.shard.name)

/**
 * ShardMemory 数据初始化
 */
export function initShardMemory(): void {
  if (Game.time % 10)
    return

  const data = JSON.parse(InterShardMemory.getLocal() || '{}') || {}
  global.intershardData = data
  if (Object.keys(data).length < 3 || !data.creep || !data.mission || !data.command || !data.hall) {
    const initdata: any = { creep: {}, mission: {}, command: [], shardName: Game.shard.name, hall: {} }
    for (const littleshard of otherShards)
      initdata.hall[littleshard] = {}
    console.log(`已经初始化 ${Game.shard.name} 的 InterShardMemory!`)
    global.intershardData = initdata
  }
}

/**
 * 跨 shard 记忆缓存清理
 */
export function cleanShardMemory(): void {
  const data = global.intershardData

  // 爬虫记忆缓存清理
  for (const cData in data.creep) {
    data.creep[cData].delay -= 1
    // 超时则删除
    if (data.creep[cData].delay <= 0) {
      delete data.creep[cData]
      continue
    }
    // 已传输则删除
    if (data.creep[cData].state === 1) {
      delete data.creep[cData]
      continue
    }
  }

  // 任务缓存清理
  for (const mData in data.mission) {
    if (data.mission[mData].delay < 99999)
      data.mission[mData].delay -= 1
      // 超时则删除
    if (data.mission[mData].delay <= 0) {
      delete data.mission[mData]
      continue
    }
    // 已传输则删除
    if (data.mission[mData].state === 1) {
      delete data.mission[mData]
      continue
    }
  }

  // 指令缓存清理
  if (data.command) {
    for (const com of data.command) {
      // done 代表指令完成
      if (com.done) {
        const index = data.command.indexOf(com)
        data.command.splice(index, 1)
      }
    }
  }
}

/**
 * 发起跨 shard 请求
 */
export function requestShard(req: RequestData): boolean {
  // 跨同 shard 的星门
  if (Game.shard.name === req.relateShard)
    return true

  const data = global.intershardData

  // 超时或者有其他事务
  if (data.hall[req.relateShard]
   && [1, 2, 3].includes(data.hall[req.relateShard].state)
   && Game.time < data.hall[req.relateShard].time + 50)
    return false

  data.hall[req.relateShard] = {
    state: 1,
    relateShard: req.relateShard,
    sourceShard: req.sourceShard,
    type: req.type,
    data: req.data,
    delay: 100,
  }

  return true
}

/**
 * 获取其他 shard 的 InterShardMemory 中对应本 shard 的信息
 * @param shardName shard名
 * @returns 其他shard的数据
 */
export function getOtherShardHallData(shardName: string): any {
  if (shardName === Game.shard.name)
    return null

  const data = JSON.parse(InterShardMemory.getRemote(shardName) || '{}') || {}

  // 说明该 shard 不存在 InterShardMemory
  if (Object.keys(data).length !== 5 || !data.creep || !data.mission || !data.command || !data.hall)
    return null

  if (!data.hall[Game.shard.name])
    return null

  return data.hall[Game.shard.name]
}

/**
 * 响应其他 shard 请求，并将请求拷贝到自己记忆里
 */
export function responseShard(): void {
  const data = global.intershardData
  for (const oShard of otherShards) {
    const comData = getOtherShardHallData(oShard)
    if (comData === null)
      continue

    if (comData.state !== 1)
      continue

    data.hall[oShard] = {
      state: 2,
      relateShard: comData.relateShard,
      sourceShard: comData.sourceShard,
      type: comData.type,
      data: comData.data,
      delay: 100,
    }

    if (comData.type === 1) {
      data.creep[comData.data.id] = {
        MemoryData: comData.data.MemoryData,
        delay: comData.memorydelay || 100,
        state: 0,
      }
    }
    else if (comData.type === 2) {
      data.mission[comData.data.id] = {
        MemoryData: comData.data.MemoryData,
        delay: comData.memorydelay || 5000,
        state: 0,
      }
    }
    else if (comData.type === 3) {
      if (!comData.data.name)
        continue

      // 如果没有相同指令，则添加
      const name = comData.data.name
      for (const lcom of data.command) {
        if (lcom.name === name)
          continue
      }

      // 命令类型 comData.data 的数据格式
      // comData: {
      //   // ...
      //   data: {
      //     name: 'xxxx',
      //     data: {
      //       // ...
      //     },
      //   },
      // }
      data.command.push({
        name: comData.data.name,
        data: comData.data.data,
        done: false,
      })
    }
  }
}

/**
 * 确认已经收到信息
 */
export function confirmShard(): void {
  const data = global.intershardData
  for (const oShard of otherShards) {
    if (!data.hall[oShard] || !Object.keys(data.hall[oShard]).length)
      continue

    const comData = getOtherShardHallData(oShard)
    if (comData === null)
      continue

    if (comData.state !== 2) {
      continue
    }
    else if (comData.state === 2) {
      data.hall[oShard].state = 3
      delete data.hall[oShard].data
    }
  }
}

/**
 * 删除 shard 无关信息
 */
export function deleteShard(): void {
  const data = global.intershardData
  for (const oShard of otherShards) {
    if (!data.hall[oShard] || !Object.keys(data.hall[oShard]).length || data.hall[oShard].state === 1)
      continue

    const remoteData = JSON.parse(InterShardMemory.getRemote(oShard) || '{}') || {}
    if (remoteData.hall[Game.shard.name].state === 3) {
      if (Game.shard.name === 'shard3')
        console.log(1)
      data.hall[oShard] = {}
    }
    if (Object.keys(remoteData.hall[Game.shard.name]).length === 0) {
      if (Game.shard.name === 'shard3')
        console.log(1)
      data.hall[oShard] = {}
    }
  }
}

/**
 * 跨shard管理器
 */
export function processShard(): void {
  initShardMemory()
  cleanShardMemory()
  responseShard()
  confirmShard()
  deleteShard()
  InterShardMemory.setLocal(JSON.stringify(global.intershardData))
}
