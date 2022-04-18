import { assignPrototype } from '../base'
import RoomCoreInitExtension from './core/init'
import RoomCoreSpawnExtension from './core/spawn'
import RoomFunctionFindExtension from './function/fun'
import RoomCoreEcosphereExtension from './core/ecosphere'
import RoomMissionFrameExtension from './mission/base/base'
import RoomMissionGenerate from './mission/generate/base'
import RoomMissionBehaviourExtension from './mission/base/behaviour'
import RoomMissionTransportExtension from './mission/base/transport'
import RoomMissionVindicateExtension from './mission/action/vindicate'
import RoomFunctionTowerExtension from './function/tower'
import NormalWarExtension from './mission/war/normal'
import RoomMissionManageExtension from './mission/base/manage'
import RoomMissionDefendExtension from './mission/action/defend'
import RoomMissionMineExtension from './mission/action/mine'
import DefendWarExtension from './mission/war/defend'
import PowerCreepMission from './mission/powerCreep/base'

// 定义好挂载顺序
const plugins = [
  RoomCoreInitExtension,
  RoomFunctionFindExtension,
  RoomCoreSpawnExtension,
  RoomCoreEcosphereExtension,
  RoomMissionFrameExtension,
  RoomMissionGenerate,
  RoomFunctionTowerExtension,
  RoomMissionBehaviourExtension,
  RoomMissionTransportExtension,
  RoomMissionVindicateExtension,
  NormalWarExtension,
  RoomMissionManageExtension,
  RoomMissionDefendExtension,
  RoomMissionMineExtension,
  DefendWarExtension,
  PowerCreepMission,
]

/**
 * 依次挂载所有的拓展
 */
export default () => plugins.forEach(plugin => assignPrototype(Room, plugin))
