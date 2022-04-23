import RoomInitExtension from './init'
import RoomSpawnExtension from './spawn'
import RoomFindExtension from './find'
import RoomEcosphereExtension from './ecosphere'
import RoomMissionCoreExtension from './mission/core'
import RoomMissionGenerate from './mission/generateTask'
import RoomMissionBehaviourExtension from './mission/check'
import RoomMissionTransportExtension from './mission/checkTransport'
import RoomMissionVindicateExtension from './mission/verify'
import RoomTowerExtension from './tower'
import RoomMissionNormalWarExtension from './mission/verifyWarNormal'
import RoomMissionManageExtension from './mission/checkManage'
import RoomMissionMineExtension from './mission/checkMine'
import RoomMissionDefendWarExtension from './mission/checkWarDefend'
import RoomMissionPowerCreepMission from './mission/checkPowercreep'
import { assignPrototype } from '@/utils'

// 定义好挂载顺序
const plugins = [
  RoomInitExtension,
  RoomFindExtension,
  RoomSpawnExtension,
  RoomEcosphereExtension,
  RoomTowerExtension,
  RoomMissionCoreExtension,
  RoomMissionGenerate,
  RoomMissionBehaviourExtension,
  RoomMissionTransportExtension,
  RoomMissionVindicateExtension,
  RoomMissionNormalWarExtension,
  RoomMissionManageExtension,
  RoomMissionMineExtension,
  RoomMissionDefendWarExtension,
  RoomMissionPowerCreepMission,
]

/**
 * 依次挂载所有的拓展
 */
export default () => plugins.forEach(plugin => assignPrototype(Room, plugin))
