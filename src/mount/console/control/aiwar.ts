import { Colorful, compare, isInArray, unzipPosition, zipPosition } from "@/utils"
/*AI 战争模块*/
export default {
    Aiwar: {
        godestroy(roomName: string, disRoom: string, shard: shardName, boost?: boolean, level: 'T0' | 'T1' | 'T2' | 'T3' = 'T0', shardData?: shardRoomData[]) {
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[Aiwar] 不存在房间${roomName}`
            for (var oi of thisRoom.memory.Misson['Room'])
                if (oi.name == '智能战争') {
                    return `[Aiwar] 房间${roomName}已经存在Ai战争任务!`
                }
            let task = thisRoom.public_Aidestroy(disRoom, shard, boost, level)
            if (task) {
                if (shardData) task.Data.shardData = shardData
            }
            if (thisRoom.AddMission(task))
                return Colorful(`[Aiwar] 房间${roomName}挂载Ai攻击任务 -(${shard})-> ${disRoom}`, 'green')
            return Colorful(`[Aiwar] 房间${roomName}挂载Ai攻击任务失败 -(${shard})-> ${disRoom}`, 'red')
        },
        Call(roomName: string, disRoom: string, shard: shardName) {
            /*清理全部智能战争*/
            this.Cgodestroy(roomName, disRoom, shard);
            this.Caisentry(roomName, disRoom, shard);
        },
        Cgodestroy(roomName: string, disRoom: string, shard: shardName) {
            /*卸载智能战争*/
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[Aiwar] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Room']) {
                if (i.name == "智能战争" && i.Data.disRoom == disRoom && i.Data.shard == shard) {
                    if (thisRoom.DeleteMission(i.id)) return `[Aiwar] 双人小队 ${roomName} -(${shard})-> ${disRoom} 的删除成功！`
                }
            }
            return `[Aiwar] 智能战争 ${roomName} -(${shard})-> ${disRoom} 的任务删除失败！`
        },
        Caisentry(roomName: string, disRoom: string, shard: shardName) {
            /*卸载智能哨兵*/
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[Aiwar] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep']) {
                if (i.name == "智能哨兵" && i.Data.disRoom == disRoom && i.Data.shard == shard) {
                    if (thisRoom.DeleteMission(i.id)) return `[Aiwar] 智能哨兵 ${roomName} -(${shard})-> ${disRoom} 的删除成功！`
                }
            }
            return `[Aiwar] 智能哨兵 ${roomName} -(${shard})-> ${disRoom} 的任务删除失败！`
        }
    }
}