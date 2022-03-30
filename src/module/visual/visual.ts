/* 可视化模块 */
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
        if (!posData) continue LoopV
        let tx = posXY[0]
        let ty = posXY[1]
        var Data = global.warData.tower[roomName].data[posData]
        new RoomVisual(roomName).text(`${Data.attack}`,tx,ty,{color:'red',font:0.4})
    }
}

/* 没有房间名的字符串解压 例如 14/23 */
export function unzipXandY(str:string):number[] | undefined{
    var info = str.split('/')
    return info.length == 2? [Number(info[0]),Number(info[1])]:undefined
}