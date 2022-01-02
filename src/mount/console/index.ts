import { assignPrototype } from "../base"
import frameExtension from './control/frame'

// 定义好挂载顺序
const plugins = [
    frameExtension,
    ]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => _.assign(global, plugin))
