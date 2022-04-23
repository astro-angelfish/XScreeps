import { assignPrototype } from '../../utils'
import CreepMoveExtension from './move'
import CreepUtilsExtension from './utils'
import CreepMissionCoreExtension from './mission/core'
import CreepMissionTransportExtension from './mission/transport'
import CreepMissionActionExtension from './mission/actions'
import CreepMissionMineExtension from './mission/mine'
import CreepMissionWarExtension from './mission/war'

// 定义好挂载顺序
const plugins = [
  CreepMoveExtension,
  CreepUtilsExtension,
  CreepMissionCoreExtension,
  CreepMissionTransportExtension,
  CreepMissionActionExtension,
  CreepMissionMineExtension,
  CreepMissionWarExtension,
]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(Creep, plugin))
