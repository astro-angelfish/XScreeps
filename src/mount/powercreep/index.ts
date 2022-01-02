import { assignPrototype } from "../base"


// 定义好挂载顺序
const plugins = [
    
    ]

/**
* 依次挂载所有的拓展
*/
export default () => plugins.forEach(plugin => assignPrototype(PowerCreep, plugin))