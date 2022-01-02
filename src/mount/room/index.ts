import { assignPrototype } from "../base"
import RoomCoreInitExtension from './core/init'
import RoomFunctionFindExtension from "./function/find"

// 定义好挂载顺序
const plugins = [
    RoomCoreInitExtension,
    RoomFunctionFindExtension,
    ]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(Room, plugin))