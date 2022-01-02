import { assignPrototype } from "../base"
import PositionFunctionFindExtension from "./function/find"

// 定义好挂载顺序
const plugins = [
    PositionFunctionFindExtension,
    ]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(RoomPosition, plugin))