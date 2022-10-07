
import { AppLifecycleCallbacks } from "../framework/types"
export function stateScanner(): void {
    // 每 20 tick 运行一次
    if (Game.time % 20) return

    if (!Memory.stats) Memory.stats = {}

    // 统计 GCL / GPL 的升级百分比和等级
    Memory.stats.gclprogress = Game.gcl.progress
    Memory.stats.gclprogressTotal = Game.gcl.progressTotal
    Memory.stats.gclLevel = Game.gcl.level
    Memory.stats.gplprogress = Game.gpl.progress
    Memory.stats.gplprogressTotal = Game.gpl.progressTotal
    Memory.stats.gplLevel = Game.gpl.level
    // CPU 的当前使用量
    Memory.stats.cpu = Game.cpu.getUsed()
    // bucket 当前剩余量
    Memory.stats.bucket = Game.cpu.bucket;
    Memory.stats.cr = Game.market.credits;
    Memory.stats.time = Game.time;
    if (Game.time % 100) return
    // Memory.stats.room = [];
    // for (var room_data in Game.rooms) {
    //     if (!Memory.RoomControlData[room_data]) continue
    // }
}

/* 平均cpu统计相关 */
export function statCPU(): void {
    var mainEndCpu = Game.cpu.getUsed()
    if (!global.CpuData) global.CpuData = []
    global.UsedCpu = mainEndCpu
    let length_i = 100;
    if (global.CpuData.length >= length_i) {
        global.CpuData = global.CpuData.slice(1);
    }
    global.CpuData.push(global.UsedCpu)
    /* 计算平均cpu */
    var AllCpu = 0
    for (var cData of global.CpuData) {
        AllCpu += cData
    }
    global.AveCpu = AllCpu / global.CpuData.length
}

export function stat(): void {
    statCPU()
    stateScanner()
}

export const statMoudle: AppLifecycleCallbacks = {
    tickEnd: stat
}