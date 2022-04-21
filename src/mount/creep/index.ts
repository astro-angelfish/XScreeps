import { assignPrototype } from '../base'
import CreepMoveExtension from './move/base'
import CreepFunctionExtension from './function/fun'
import CreepMissionBaseExtension from './mission/base'
import CreepMissionTransportExtension from './mission/transport'
import CreepMissionActionExtension from './mission/action'
import CreepMissionMineExtension from './mission/mine'
import CreepMissionWarExtension from './mission/war'

// 定义好挂载顺序
const plugins = [
  CreepMoveExtension,
  CreepFunctionExtension,
  CreepMissionBaseExtension,
  CreepMissionTransportExtension,
  CreepMissionActionExtension,
  CreepMissionMineExtension,
  CreepMissionWarExtension,
]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(Creep, plugin))
