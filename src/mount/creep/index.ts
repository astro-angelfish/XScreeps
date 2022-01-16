import { assignPrototype } from "../base"
import CreepMoveExtension from "./move/move"
import CreepFunctionExtension from "./function/fun"
import CreepMissonBaseExtension from "./misson/base"
import CreepMissonTransportExtension from "./misson/transport"
// 定义好挂载顺序
const plugins = [
    CreepMoveExtension,
    CreepFunctionExtension,
    CreepMissonBaseExtension,
    CreepMissonTransportExtension,
    ]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(Creep, plugin))