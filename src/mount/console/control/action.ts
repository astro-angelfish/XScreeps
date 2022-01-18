import { Colorful } from "@/utils"

export default {
    repair:{
        set(roomName:string,rtype:'global'|'special'|'nuker',num:number,boost:null|ResourceConstant,vindicate:boolean):string{
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[repair] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == '墙体维护' && i.Data.RepairType == rtype)
            {
                return `[repair] 房间${roomName}已经存在类型为${rtype}的刷墙任务了`
            }
            var thisTask = thisRoom.public_repair(rtype,num,boost,vindicate)
            if (thisRoom.AddMission(thisTask))
            return `[repair] 房间${roomName}挂载类型为${rtype}刷墙任务成功`
            return `[repair] 房间${roomName}挂载类型为${rtype}刷墙任务失败`
        },
        remove(roomName:string,Rtype:'global'|'special'|'nuker'):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[repair] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == '墙体维护' && i.Data.RepairType == Rtype)
            {
                if (thisRoom.DeleteMission(i.id))
                return `[repair] 房间${roomName}删除类型为${Rtype}刷墙任务成功`
            }
            return `[repair] 房间${roomName}删除类型为${Rtype}刷墙任务失败!`
        },
    },
    plan:{
        C(roomName:string,disRoom:string):string{
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[plan] 不存在房间${roomName}`
            let task = thisRoom.public_planC(disRoom)
            if (thisRoom.AddMission(task))
            return Colorful(`[plan] 房间${roomName}挂载C计划成功 -> ${disRoom}`,'green')
            return Colorful(`[plan] 房间${roomName}挂载C计划失败 -> ${disRoom}`,'red')
        },
        CC(roomName:string):string
        {
            var thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[plan] 不存在房间${roomName}`
            for (var i of thisRoom.memory.Misson['Creep'])
            if (i.name == 'C计划' )
            {
                if (thisRoom.DeleteMission(i.id))
                return Colorful(`[plan] 房间${roomName}挂载C计划成功`,'green')
            }
            return Colorful(`[plan] 房间${roomName}删除C计划失败`,'red')
        }
    }
}