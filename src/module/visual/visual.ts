import { unzipXandY } from "../fun/funtion"

/* 可视化模块 */
/**
 * 防御塔数据可视化
 * @returns 
 */
export function showTowerData():void{
    if (!Game.flags['TowerVisual']) return
    let roomName = Game.flags['TowerVisual'].pos.roomName
    if (!Game.rooms[roomName]) return
    if (!global.warData || !global.warData.tower || !global.warData.tower[roomName]) return
    if (!global.warData.tower[roomName].data) return
    // 展示可视化数据
    /* 有数据就进行可视化 */
    LoopV:
    for (var posData in global.warData.tower[roomName].data)
    {
        /* 数据 */
        let posXY = unzipXandY(posData)
        let tx = posXY[0]
        let ty = posXY[1]
        var Data = global.warData.tower[roomName].data[posData]
        Game.rooms[roomName].visual.text(`${Data.attack}`,tx,ty,{color: 'red', font:0.4,align:'center'})
    }
}


/**
 * 房间日常数据可视化
 */
export function RoomDataVisual(room:Room):void{
    room.visual.rect(0,0,7,10,{opacity:0.1,stroke: '#696969',strokeWidth:0.2})
    let row = 0
    room.visual.text(`全局实时CPU:${(global.UsedCpu?global.UsedCpu:0).toFixed(2)}`,0,row+=1,{color: 'black', font:0.7,align:'left'})
    room.visual.text(`全局平均CPU:${(global.AveCpu?global.AveCpu:0).toFixed(2)}`,0,row+=1,{color: 'black', font:0.7,align:'left'})
    room.visual.text(`房间状态:${(room.memory.state=="peace"?"和平":"战争")}`,0,row+=1,{color: room.memory.state == 'peace'?'#006400':'red', font:0.7,align:'left'})
    room.visual.text(`cpu池:${Game.cpu.bucket}`,0,row+=1,{color: Game.cpu.bucket < 2000?'red':'black', font:0.7,align:'left'})
    /* 控制器进度 */
    let processController = room.controller.level >= 8?100:((room.controller.progress/room.controller.progressTotal)*100).toFixed(4)
    room.visual.text(`控制器进度:${processController}%`,0,row+=1,{color: 'black', font:0.7,align:'left'})
    /* 目前存在任务数 */
    var MissonNum = 0
    for (var range in room.memory.Misson)
        MissonNum += Object.keys(room.memory.Misson[range]).length
    room.visual.text(`房间任务数:${MissonNum}`,0,row+=1,{color: MissonNum>0?'#008B8B':'black', font:0.7,align:'left'})
    /* 仓库剩余容量 */
    let storage_ = global.Stru[room.name]['storage'] as StructureStorage
    if (storage_)
    {
        let num = Math.ceil(storage_.store.getFreeCapacity()/1000)
        let color:string
        if (num <= 50) color = '#B22222'
        else if (num > 50 && num <= 200) color = '#FF8C00'
        else if (num > 200 && num <= 400) color = '#006400'
        else color = '#4682B4'
        room.visual.text(`仓库剩余容量:${num}K`,0,row+=1,{color: color , font:0.7,align:'left'})
    }
    if (room.controller.level >= 8)
    {
        if (room.memory.productData.producing)
        room.visual.text(`工厂生产:${room.memory.productData.producing.com}`,0,row+=1,{color: 'black' , font:0.7,align:'left'})
        if (Object.keys(room.memory.ComDispatchData).length > 0)
        {
            room.visual.text(`合成规划:${Object.keys(room.memory.ComDispatchData)[Object.keys(room.memory.ComDispatchData).length-1]}`,0,row+=1,{color: 'black' , font:0.7,align:'left'})
        }
    }
}