import { assignPrototype } from "../base"
import RoomCoreInitExtension from './core/init'
import RoomCoreSpawnExtension from "./core/spawn"
import RoomFunctionFindExtension from "./function/fun"
import RoomCoreEcosphereExtension from "./core/ecosphere"
import RoomMissonFrameExtension from "./misson/base/base"
import RoomMissonPublish from "./misson/publish/publish"
import RoomMissonBehaviourExtension from "./misson/base/behaviour"
import RoomMissonTransportExtension from "./misson/base/transport"
import RoomMissonVindicateExtension from "./misson/action/vindicate"

// 定义好挂载顺序
const plugins = [
    RoomCoreInitExtension,
    RoomFunctionFindExtension,
    RoomCoreSpawnExtension,
    RoomCoreEcosphereExtension,
    RoomMissonFrameExtension,
    RoomMissonPublish,
    RoomMissonBehaviourExtension,
    RoomMissonTransportExtension,
    RoomMissonVindicateExtension,
    ]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(Room, plugin))