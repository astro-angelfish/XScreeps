import { assignPrototype } from '../base'
import linkExtension from './link'
import terminalExtension from './terminal'
import { factoryExtension,factoryConsole } from './factory'

// 定义好挂载顺序
export default ()=> {
    assignPrototype(StructureLink,linkExtension)
    assignPrototype(StructureTerminal,terminalExtension)
    assignPrototype(factoryExtension,factoryConsole)
    assignPrototype(StructureFactory,factoryExtension)
}