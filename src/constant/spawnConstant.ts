import { build_, carry_, harvest_, upgrade_ } from '@/module/fun/role'
import type { BodyParam } from '@/utils'

interface SpawnConstantDataBase {
  // 每种爬虫的代号
  label: string

  // 孵化优先级，越低越优先
  priority?: number
  // 是否无论战争还是和平都得孵化
  ignoreWar?: boolean
  // 是否根据已有 energyAvailable 来自动调整 body，false 时通过 energyCapacity 调整
  reduceToEA?: boolean

  // 是否加入 memory 初始化
  init?: boolean
  // 是否有固定函数 (即不接任务)
  func?: (creep: Creep) => void
  // 额外的 memory 配置
  mem?: SpawnMemory
}

export interface SpawnConstantDataSimple extends SpawnConstantDataBase {
  // 身体部件配置，总数别超过50
  body: BodyParam

  // 自适应数据
  adaption?: undefined
}
export interface SpawnConstantDataAdapative extends SpawnConstantDataBase {
  // 默认身体部件配置，总数别超过50
  body?: BodyParam

  // 自适应数据
  adaption: Record<number, Partial<{
    // 保持数量
    num: number
    // 身体部件配置，总数别超过50
    body: BodyParam
  }>>
}

export type SpawnConstantData = SpawnConstantDataSimple | SpawnConstantDataAdapative

// 爬虫信息列表
export const roleData: Record<string, SpawnConstantData> = {
  // 矿点采集工
  'harvest': {
    label: '⛏️',
    priority: 5, ignoreWar: true, reduceToEA: true,
    body: { work: 1, carry: 1, move: 2 },
    adaption: {
      1: { body: { work: 2, carry: 1, move: 1 }, num: 2 },
      2: { body: { work: 3, carry: 1, move: 2 }, num: 2 },
      3: { body: { work: 5, carry: 1, move: 3 }, num: 2 },
      4: { body: { work: 5, carry: 1, move: 3 }, num: 2 },
      5: { body: { work: 7, carry: 2, move: 4 }, num: 2 },
      6: { body: { work: 7, carry: 2, move: 4 }, num: 2 },
      7: { body: { work: 10, carry: 2, move: 5 }, num: 2 },
      8: { body: { work: 10, carry: 2, move: 5 }, num: 2 },
    },
    init: true, func: harvest_,
  },
  // 矿点搬运工
  'carry': {
    label: '🚜',
    priority: 5, ignoreWar: true, reduceToEA: true,
    body: { carry: 3, move: 3 },
    adaption: {
      1: { body: { carry: 2, move: 2 }, num: 2 },
      2: { body: { carry: 3, move: 3 }, num: 2 },
      3: { body: { carry: 4, move: 4 }, num: 2 },
      4: { body: { carry: 6, move: 6 }, num: 2 },
      5: { body: { carry: 6, move: 6 }, num: 2 },
      6: { body: { carry: 6, move: 6 }, num: 1 },
      7: { body: { carry: 2, move: 2 } },
      8: { body: { carry: 2, move: 2 } },
    },
    init: true, func: carry_,
  },
  // 升级工
  'upgrade': {
    label: '🚬',
    priority: 10,
    body: { work: 1, carry: 1, move: 2 },
    adaption: {
      1: { body: { work: 1, carry: 1, move: 2 }, num: 4 },
      2: { body: { work: 2, carry: 2, move: 4 }, num: 3 },
      3: { body: { work: 3, carry: 3, move: 6 }, num: 3 },
      4: { body: { work: 4, carry: 4, move: 8 }, num: 2 },
      5: { body: { work: 4, carry: 4, move: 8 }, num: 2 },
      6: { body: { work: 5, carry: 2, move: 5 }, num: 2 },
      7: { body: { work: 10, carry: 2, move: 10 }, num: 2 },
      8: { body: { work: 15, carry: 3, move: 15 }, num: 1 },
    },
    init: true, func: upgrade_,
  },
  // 建筑工
  'build': {
    label: '🔨',
    priority: 10, ignoreWar: true,
    body: { work: 1, carry: 1, move: 2 },
    adaption: {
      1: { body: { work: 1, carry: 1, move: 2 }, num: 1 },
      2: { body: { work: 2, carry: 2, move: 4 }, num: 1 },
      3: { body: { work: 3, carry: 3, move: 6 }, num: 1 },
      4: { body: { work: 4, carry: 4, move: 8 }, num: 1 },
      5: { body: { work: 4, carry: 4, move: 8 } },
      6: { body: { work: 5, carry: 5, move: 10 } },
      7: { body: { work: 10, carry: 10, move: 10 } },
      8: { body: { work: 15, carry: 15, move: 15 } },
    },
    init: true, func: build_,
  },
  // 中央搬运工
  'manage': {
    label: '🗃️',
    priority: 2, ignoreWar: true, reduceToEA: true,
    body: { carry: 1, move: 1 },
    adaption: {
      1: { body: { carry: 1, move: 1 } },
      2: { body: { carry: 1, move: 1 } },
      3: { body: { carry: 2, move: 2 } },
      4: { body: { carry: 2, move: 2 }, num: 1 },
      5: { body: { carry: 10, move: 5 }, num: 1 },
      6: { body: { carry: 15, move: 5 }, num: 1 },
      7: { body: { carry: 20, move: 10 }, num: 1 },
      8: { body: { carry: 32, move: 16 }, num: 1 },
    },
    init: true,
  },
  // 房间物流搬运工
  'transport': {
    label: '📦',
    priority: 1, ignoreWar: true, reduceToEA: true,
    body: { carry: 2, move: 2 },
    adaption: {
      1: { body: { carry: 1, move: 1 } },
      2: { body: { carry: 1, move: 1 } },
      3: { body: { carry: 2, move: 2 } },
      4: { body: { carry: 2, move: 2 }, num: 1 },
      5: { body: { carry: 4, move: 4 }, num: 1 },
      6: { body: { carry: 10, move: 10 }, num: 1 },
      7: { body: { carry: 24, move: 24 }, num: 1 },
      8: { body: { carry: 24, move: 24 }, num: 1 },
    },
    init: true,
  },
  // 刷墙
  'repair': {
    label: '🧱',
    priority: 8, ignoreWar: true,
    body: { work: 1, carry: 1, move: 1 },
    adaption: {
      1: { body: { work: 1, carry: 1, move: 2 } },
      2: { body: { work: 1, carry: 1, move: 2 } },
      3: { body: { work: 2, carry: 2, move: 4 } },
      4: { body: { work: 2, carry: 2, move: 4 } },
      5: { body: { work: 3, carry: 3, move: 3 } },
      6: { body: { work: 6, carry: 6, move: 6 } },
      7: { body: { work: 10, carry: 10, move: 10 } },
      8: { body: { work: 15, carry: 10, move: 15 } },
    },
  },

  // 开房 sf
  'cclaim': {
    label: '🐱',
    priority: 10,
    body: { move: 1, claim: 1 },
  },
  'cupgrade': {
    label: '🐱',
    priority: 11,
    body: { work: 2, carry: 5, move: 7 },
  },

  'dismantle': {
    label: '⚡',
    priority: 11,
    body: { work: 25, move: 25 },
    adaption: {
      1: { body: { work: 1, move: 1 } },
      2: { body: { work: 2, move: 2 } },
      3: { body: { work: 3, move: 3 } },
      4: { body: { work: 3, move: 3 } },
      5: { body: { work: 6, move: 6 } },
      6: { body: { work: 10, move: 10 } },
      7: { body: { work: 20, move: 20 } },
      8: { body: { work: 25, move: 25 } },
    },
  },
  'rush': {
    label: '🚬',
    priority: 11,
    body: { work: 10, carry: 2, move: 5 },
    adaption: {
      6: { body: { work: 17, carry: 1, move: 9 } },
      7: { body: { work: 39, carry: 1, move: 10 } },
    },
  },
  'truck': {
    label: '✈️',
    priority: 9,
    body: { carry: 10, move: 10 },
    adaption: {
      1: { body: { carry: 1, move: 1 } },
      2: { body: { carry: 1, move: 1 } },
      3: { body: { carry: 4, move: 4 } },
      4: { body: { carry: 4, move: 4 } },
      5: { body: { carry: 8, move: 8 } },
      6: { body: { carry: 10, move: 10 } },
      7: { body: { carry: 20, move: 20 } },
      8: { body: { carry: 25, move: 25 } },
    },
  },
  'claim': {
    label: '🟣',
    priority: 10,
    body: { move: 1, claim: 1 },
  },

  'Ebuild': {
    label: '🛠️',
    priority: 13,
    body: { work: 1, carry: 1, move: 2 },
    adaption: {
      1: { body: { work: 1, carry: 1, move: 2 } },
      2: { body: { work: 1, carry: 1, move: 2 } },
      3: { body: { work: 2, carry: 2, move: 4 } },
      4: { body: { work: 2, carry: 2, move: 4 } },
      5: { body: { work: 4, carry: 4, move: 8 } },
      6: { body: { work: 5, carry: 5, move: 10 } },
      7: { body: { work: 10, carry: 10, move: 20 } },
      8: { body: { work: 10, carry: 10, move: 20 } },
    },
  },
  'Eupgrade': {
    label: '🚬',
    priority: 13,
    body: { work: 1, carry: 1, move: 2 },
    adaption: {
      1: { body: { work: 1, carry: 1, move: 2 } },
      2: { body: { work: 1, carry: 1, move: 2 } },
      3: { body: { work: 2, carry: 2, move: 4 } },
      4: { body: { work: 2, carry: 2, move: 4 } },
      5: { body: { work: 4, carry: 4, move: 8 } },
      6: { body: { work: 5, carry: 5, move: 10 } },
      7: { body: { work: 10, carry: 10, move: 20 } },
      8: { body: { work: 10, carry: 10, move: 20 } },
    },
  },

  /* 二人小队 */
  'double-attack': {
    label: '⚔️',
    priority: 10, ignoreWar: true,
    body: { move: 10, attack: 28, tough: 12 },
  },
  'double-heal': {
    label: '🩹',
    priority: 10, ignoreWar: true,
    body: { move: 10, ranged_attack: 2, heal: 27, tough: 11 },
  },
  'double-dismantle': {
    label: '⚒️',
    priority: 10, ignoreWar: true,
    body: { work: 28, move: 10, tough: 12 },
  },

  // 掉级
  'claim-attack': {
    label: '🟣',
    priority: 10,
    body: { move: 15, claim: 15 },
  },
  'architect': {
    label: '🚒',
    priority: 10,
    body: { work: 15, carry: 10, move: 10, heal: 10, tough: 5 },
  },
  'scout': {
    label: '✏️',
    priority: 15,
    body: { move: 1 },
  },
  'aio': {
    label: '⚡',
    priority: 10,
    body: { move: 25, ranged_attack: 10, heal: 15 },
  },
  // 支援一体机
  'saio': {
    label: '⚡',
    priority: 10,
    body: { move: 25, ranged_attack: 10, heal: 15 },
  },
  'mineral': {
    label: '🪓',
    priority: 11,
    body: { work: 15, carry: 15, move: 15 },
  },

  /* 外矿 */
  'out-claim': {
    label: '🟣',
    priority: 11,
    body: { move: 2, claim: 2 },
  },
  'out-harvest': {
    label: '⛏️',
    priority: 12,
    body: { work: 4, carry: 2, move: 4 },
    adaption: {
      1: { body: { work: 1, carry: 1, move: 1 } },
      2: { body: { work: 1, carry: 1, move: 1 } },
      3: { body: { work: 1, carry: 1, move: 1 } },
      4: { body: { work: 2, carry: 1, move: 1 } },
      5: { body: { work: 4, carry: 1, move: 2 } },
      6: { body: { work: 6, carry: 1, move: 3 } },
      7: { body: { work: 7, carry: 2, move: 7 } },
      8: { body: { work: 8, carry: 2, move: 7 } },
    },
  },
  'out-car': {
    label: '🚜',
    priority: 12,
    body: { work: 1, move: 5, carry: 6 },
    adaption: {
      1: { body: { work: 1, carry: 1, move: 2 } },
      2: { body: { work: 1, carry: 2, move: 2 } },
      3: { body: { work: 1, carry: 2, move: 3 } },
      4: { body: { work: 1, carry: 5, move: 3 } },
      5: { body: { work: 1, carry: 7, move: 4 } },
      6: { body: { work: 1, carry: 11, move: 6 } },
      7: { body: { work: 2, carry: 26, move: 14 } },
      8: { body: { work: 2, carry: 30, move: 16 } },
    },
  },
  'out-defend': {
    label: '🧹',
    priority: 10,
    body: { move: 5, attack: 5, tough: 5 },
    adaption: {
      1: { body: { move: 1, heal: 1 } },
      2: { body: { move: 1, heal: 1 } },
      3: { body: { move: 1, heal: 1 } },
      4: { body: { move: 3, ranged_attack: 2, heal: 2 } },
      5: { body: { move: 6, ranged_attack: 3, heal: 3 } },
      6: { body: { move: 8, ranged_attack: 4, heal: 4 } },
      7: { body: { move: 16, ranged_attack: 8, heal: 8 } },
      8: { body: { move: 20, ranged_attack: 10, heal: 10 } },
    },
  },

  /* 帕瓦 */
  'power-attack': {
    label: '🍎',
    priority: 10,
    body: { move: 20, attack: 20 },
  },
  'power-heal': {
    label: '🍏',
    priority: 10,
    body: { move: 25, heal: 25 },
  },
  'power-carry': {
    label: '📦',
    priority: 10,
    body: { carry: 32, move: 16 },
  },

  /* 过道矿 */
  'deposit': {
    label: '⚙️',
    priority: 11,
    body: { work: 15, carry: 10, move: 25 },
  },

  /* 主动防御 */
  'defend-attack': {
    label: '🔴',
    priority: 8, ignoreWar: true,
    body: { move: 10, attack: 40 },
  },
  'defend-range': {
    label: '🔵',
    priority: 8, ignoreWar: true,
    body: { move: 10, ranged_attack: 40 },
  },
  'defend-douAttack': {
    label: '🔴',
    priority: 7, ignoreWar: true,
    body: { move: 10, attack: 30, tough: 10 },
  },
  'defend-douHeal': {
    label: '🟢',
    priority: 7, ignoreWar: true,
    body: { move: 10, heal: 30, tough: 10 },
  },

  /* 四人小队 */
  'x-dismantle': {
    label: '🟨',
    priority: 9, ignoreWar: true,
    body: { work: 28, move: 10, tough: 12 },
    mem: { creepType: 'attack' },
  },
  'x-heal': {
    label: '🟩',
    priority: 9, ignoreWar: true,
    body: { move: 10, ranged_attack: 2, heal: 26, tough: 12 },
    mem: { creepType: 'heal' },
  },
  'x-attack': {
    label: '🟥',
    priority: 9, ignoreWar: true,
    body: { move: 10, attack: 28, tough: 12 },
    mem: { creepType: 'attack' },
  },
  'x-range': {
    label: '🟦',
    priority: 9, ignoreWar: true,
    body: { move: 10, ranged_attack: 24, heal: 4, tough: 12 },
    mem: { creepType: 'attack' },
  },
  'x-aio': {
    label: '🌈',
    priority: 9, ignoreWar: true,
    body: { move: 10, ranged_attack: 10, heal: 20, tough: 10 },
    mem: { creepType: 'heal' },
  },
}
