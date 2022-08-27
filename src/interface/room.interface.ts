/* 房间常用类型及定义 */

interface RoomMemory {
    economy?:boolean    // 经济模式 此模式下 非必要不会升级以节约能量的消耗
    banVisual?:boolean
    refuge?:string      // 避难所 用于核弹避难
}