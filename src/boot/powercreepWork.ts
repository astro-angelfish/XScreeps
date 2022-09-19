export const powerCreepRunner = function (pc: PowerCreep): void {
    var cpu_test = false
    if (Memory.Systemswitch.Showtestpowercreep) {
        cpu_test = true
    }
    let cpu_list = [];
    if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
    if (pc && pc.ticksToLive) pc.ManageMisson()
    if (cpu_test) {
        cpu_list.push(Game.cpu.getUsed())
        console.log(
            pc.name,
            '总计' + (cpu_list[1] - cpu_list[0]).toFixed(3),
        )
    }
}