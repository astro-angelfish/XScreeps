import { assignPrototype } from '../base'
import PowerCreepMoveExtension from './move/base'
import PowerCreepMissionBase from './mission/base'
import PowerCreepFunctionExtension from './function'
import PowerCreepMissionAction from './mission/action'

// 定义好挂载顺序
const plugins = [
  PowerCreepMoveExtension,
  PowerCreepMissionBase,
  PowerCreepFunctionExtension,
  PowerCreepMissionAction,
]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(PowerCreep, plugin))
