import PowerCreepMoveExtension from './move'
import PowerCreepMissionCoreExtension from './mission/core'
import PowerCreepUtilsExtension from './utils'
import PowerCreepMissionAction from './mission/action'
import { assignPrototype } from '@/utils'

// 定义好挂载顺序
const plugins = [
  PowerCreepMoveExtension,
  PowerCreepMissionCoreExtension,
  PowerCreepUtilsExtension,
  PowerCreepMissionAction,
]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(PowerCreep, plugin))
