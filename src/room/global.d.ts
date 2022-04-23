/* 房间常用类型及定义 */

interface RoomMemory {
  economy?: boolean // 经济模式 此模式下 非必要不会升级以节约能量的消耗
}

interface Memory {
  roomControlData: RoomControlData
}

/**
 * 房间控制 Memory 数据格式
 */
type RoomControlData = Record<string, {
  // 房间布局 手动布局 | dev布局 | om布局 | 自动布局
  arrange: 'man' | 'dev'
  // 中心点
  center: [number, number]
}>
