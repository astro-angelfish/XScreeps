/* [通用]房间运行主程序 */
export default ()=>{

    if (!Memory.RoomControlData) Memory.RoomControlData = {}
    for (var roomName in Memory.RoomControlData)
    {
        let thisRoom = Game.rooms[roomName]
        if (!thisRoom) continue
        /* 具体房间逻辑 */
        // 初始化
        thisRoom.RoomInit()
    }
}