import { resourceComDispatch } from "@/constant/ResourceConstant"
import { RecognizeLab } from "@/module/fun/funtion"
import { Colorful, isInArray } from "@/utils"
import { object } from "lodash"

export default {
    frame:
    {
        set(roomName:string,plan:'man'|'hoho'|'dev',x:number,y:number):string
        {
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[frame] 不存在房间${roomName}`
            Memory.RoomControlData[roomName] = {arrange:plan,center:[x,y]}
            return `[frame] 房间${roomName}加入房间控制列表，布局${plan}，中心点[${x},${y}]`
        },
        remove(roomName):string
        {
            delete Memory.RoomControlData[roomName]
            return `[frame] 删除房间${roomName}出房间控制列表`
        },
        del(roomName:string,x:number,y:number,mold:BuildableStructureConstant):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[frame] 未找到房间${roomName},请确认房间!`
            var thisPosition:RoomPosition = new RoomPosition(x,y,roomName)
            if (thisPosition.GetStructure(mold))
                {myRoom.unbindMemory(mold,x,y);return `[frame] 房间${roomName}已经执行delStructure命令!`}
            else
            {
                let cons = thisPosition.lookFor(LOOK_CONSTRUCTION_SITES)
                if (cons.length > 0 && cons[0].structureType == mold)
                {
                    myRoom.unbindMemory(mold,x,y);return `[frame] 房间${roomName}已经执行delStructure命令!`
                }
            }
            return `[frame] 房间${roomName}未找到相应建筑!`
        },
        // 查询任务
        task(roomName:string):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[frame] 未找到房间${roomName},请确认房间!`
            let result = `[frame] 房间${roomName}任务数据如下:\n`
            for (var rangeName in myRoom.memory.Misson)
            {
                if (Object.keys(myRoom.memory.Misson[rangeName]).length <=0)
                {
                    result += `不存在${rangeName}类任务\n`
                }
                else
                {
                    result += `------------[${rangeName}]-------------\n`
                    for (var i of myRoom.memory.Misson[rangeName])
                    {
                        result += `${i.name} | 超时:${i.delayTick}, ID:${i.id}, `
                        if (i.Data)
                        {
                            if (i.Data.disRoom) result += `目标房间:${i.Data.disRoom}, `
                            if (i.Data.rType) result += `rType:${i.Data.rType}, `
                            if (i.Data.num) result += `num:${i.Data.num}, `
                        }
                        result += `\n`
                    }
                }
            }
            return result
        },
        // 经济模式
        economy(roomName:string):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[frame] 未找到房间${roomName},请确认房间!`
            myRoom.memory.economy = !myRoom.memory.economy
            return `[frame] 房间${roomName}的economy选项改为${myRoom.memory.economy}`
        }
    },
    spawn:
    {
        num(roomName:string,role:string,num:number):string{
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[spawn] 不存在房间${roomName}`
            let roleConfig = thisRoom.memory.SpawnConfig[role]
            if (roleConfig)
            {
                roleConfig.num = num
                return `[spawn] 房间${roomName}的${role}数量信息修改为${num}`
            }
            return `[spawn] 房间${roomName}的${role}数量信息修改失败`
        },
        // 修改某任务爬虫绑定数据的num
        Mnum(roomName:string,id:string,role:string,num:number):string{
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[spawn] 不存在房间${roomName}`
            let misson = thisRoom.GainMission(id)
            if (misson && misson.CreepBind[role])
            {
                misson.CreepBind[role].num = num
                return `[spawn] 任务${id}的${role}数量信息修改为${num}`
            }
            return `[spawn] 任务${id}的${role}数量信息修改失败`
        },
    },
    link:{
        comsume(roomName:string,id:string):string{
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[link] 不存在房间${roomName}`
            if (isInArray(thisRoom.memory.StructureIdData.source_links,id)) return `[link] id错误，不能为source_link`
            if (id == thisRoom.memory.StructureIdData.center_link || id == thisRoom.memory.StructureIdData.upgrade_link) return `[link] id错误，不能为center_link/upgrade_link`
            if (!isInArray(thisRoom.memory.StructureIdData.comsume_link,id))thisRoom.memory.StructureIdData.comsume_link.push(id)
            return Colorful(`[link] 房间${roomName} id为${id}的link已加入comsume_link列表中`,'green',true)
        }
    },
    debug:{
        ResourceDispatch(roomName:string,rType:ResourceConstant,num:number,mtype:"deal"|"order",buy:boolean = false):string{
            let dispatchTask:RDData = {
                sourceRoom:roomName,
                rType:rType,
                num:num,
                delayTick:300,
                conditionTick:20,
                buy:buy,
                mtype:mtype
            }
            Memory.ResourceDispatchData.push(dispatchTask)
            return `[debug] 资源调度任务发布,房间${roomName},资源类型${rType},数量${num},支持购买:${buy},默认超时300T`
        },
        ResourceBuy(roomName:string,rType:ResourceConstant,num:number,range:number,max:number = 35):string{
            let thisRoom = Game.rooms[roomName]
            if (!thisRoom) return `[link] 不存在房间${roomName}`
            let task = thisRoom.Public_Buy(rType,num,range,max)
            if (task && thisRoom.AddMission(task))
            return Colorful(`[debug] 资源购买任务发布,房间${roomName},资源类型${rType},数量${num},价格范围${range},最高价格${max}`,'blue')
            return Colorful(`[debug] 房间${roomName}资源购买任务发布失败!`,'yellow')
        }
    },
    lab:{
        /* 寻找房间名/数字的旗帜，初始化一个房间的lab合成配置，没有配置的房间不可以进行合成任务*/
        init(roomName:string):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[lab] 未找到房间${roomName},请确认房间!`
            /* 初始化 原先配置清零 */
            myRoom.memory.StructureIdData.labInspect=  {}
            let result = RecognizeLab(roomName)
            if (result == null) return `[lab] 房间${roomName}初始化合成lab信息失败!`
            myRoom.memory.StructureIdData.labInspect['raw1'] = result.raw1
            myRoom.memory.StructureIdData.labInspect['raw2'] = result.raw2
            myRoom.memory.StructureIdData.labInspect['com'] = result.com
            let str = ''
            str += `[lab] 房间${roomName}初始化lab信息成功!\n`
            str += `底物lab:\n${result.raw1}\n${result.raw2}\n`
            str += "合成lab:\n"
            for (let i of result.com) str += `${i}\n`
            return str
        },
        compound(roomName:string,res:ResourceConstant,num:number):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[lab] 未找到房间${roomName},请确认房间`
            let str = []
            for (var i of myRoom.memory.StructureIdData.labInspect.com)
            {
                if (!myRoom.memory.RoomLabBind[i]) str.push(i)
            }
            var thisTask = myRoom.public_Compound(num,res,str)
            if (thisTask === null) return `[lab] 挂载合成任务失败!`
            if (myRoom.AddMission(thisTask))
            return `[lab] 房间${roomName}合成${res}任务挂载成功! ${thisTask.Data.raw1} + ${thisTask.Data.raw2} = ${res}`
            else
            return `[lab] 房间${roomName}挂载合成任务失败!`
        },
        dispatch(roomName:string,res:ResourceConstant,num:number):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[lab] 未找到房间${roomName},请确认房间!`
            if (!resourceComDispatch[res]) return `不存在资源${res}!`
            if (Object.keys(myRoom.memory.ComDispatchData).length > 0) return `[lab] 房间${roomName} 已经存在资源合成调度数据`
            myRoom.memory.ComDispatchData = {}
            for (var i of resourceComDispatch[res])
            {
                myRoom.memory.ComDispatchData[i] = {res:i,dispatch_num:num}
            }
            return `[lab] 已经修改房间${roomName}的合成规划数据，为${resourceComDispatch[res]}，数量：${num}`
        },
        Cdispatch(roomName:string):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[lab] 未找到房间${roomName},请确认房间!`
            myRoom.memory.ComDispatchData = {}
            return `[lab] 已经修改房间${roomName}的资源调度数据，为{}.本房见现已无资源合成调度`
        },
    },
    dispatch:{
        limit(roomName:string):string{
            var myRoom = Game.rooms[roomName]
            if (!myRoom) return `[dispatch] 未找到房间${roomName},请确认房间!`
            let result = `[dispatch] 房间${roomName}的ResourceLimit信息如下:\n`
            let data = global.ResourceLimit[roomName]
            if (Object.keys(data).length <=0) return `[dispatch] 房间${roomName}没有ResourceLimit信息!`
            for (var i of Object.keys(data))
                result += `[${i}] : ${data[i]}\n`
            return result
        }
    }
}