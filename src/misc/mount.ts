import mountCreep from '../creep/mount'
import mountRoom from '../room/mount'
import mountPosition from '../position/mount'
import mountStructure from '../structure/mount'
import mountConsole from '../console'
import mountPowerCreep from '../powercreep/mount'
import mountHelp from '../console/help'

let mounted = false

export function mountPrototype() {
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
