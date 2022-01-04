import { assignPrototype } from "../base"
import CreepMoveExtension from "./move/move"

// 定义好挂载顺序
const plugins = [
    CreepMoveExtension,
    ]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(Creep, plugin))