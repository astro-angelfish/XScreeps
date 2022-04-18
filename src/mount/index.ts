import mountCreep from './creep'
import mountPosition from './position'
import mountRoom from './room'
import mountConsole from './console'
import mountStructure from './structure'
import mountPowerCreep from './powercreep'
import mountHelp from './help'

let mounted = false

export default function() {
  if (mounted)
    return

  mountConsole()
  mountPosition()
  mountRoom()
  mountStructure()
  mountCreep()
  mountPowerCreep()
  mountHelp()

  mounted = true
}
