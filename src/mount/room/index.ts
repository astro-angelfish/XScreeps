import { assignPrototype } from "../base"
import RoomCoreInitExtension from './core/init'
import RoomCoreSpawnExtension from "./core/spawn"
import RoomFunctionFindExtension from "./function/find"
import RoomCoreEcosphereExtension from "./core/ecosphere"

// 定义好挂载顺序
const plugins = [
    RoomCoreInitExtension,
    RoomFunctionFindExtension,
    RoomCoreSpawnExtension,
    RoomCoreEcosphereExtension
    ]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(Room, plugin))