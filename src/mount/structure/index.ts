import { assignPrototype } from '../base'
import linkExtension from './link'

// 定义好挂载顺序
export default ()=> {
    assignPrototype(StructureLink,linkExtension)
}