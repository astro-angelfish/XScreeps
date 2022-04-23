import { CompoundColor } from "@/constant/ResourceConstant"
import { unzipXandY } from "../fun/funtion"
import { getTowerData } from "../war/war"

/* 可视化模块 */
/**
 * 防御塔数据可视化
 * TowerVisualAttack 防御塔攻击数据
 * TowerVisualHeal   防御塔治疗数据
 * TowerVisualRepair 防御塔维修数据
 * 较消耗cpu，仅做短暂统计用，请及时截图及销毁旗帜
 * @returns void
 */
export function showTowerData(): void {
    if (Game.flags['TowerVisualAttack']) {
        let roomName = Game.flags['TowerVisualAttack'].pos.roomName
        if (!global.warData) global.warData = {}
        if (!global.warData.tower) global.warData.tower = {}
        if (!global.warData.tower[roomName]) global.warData.tower[roomName] = { count: 0 }
        if (global.warData.tower[roomName].data) {
            for (var posData in global.warData.tower[roomName].data) {
                /* 数据 */
                let posXY = unzipXandY(posData)
                let tx = posXY[0]
                let ty = posXY[1]
                var Data = global.warData.tower[roomName].data[posData]
                new RoomVisual(roomName).text(`${Data.attack}`, tx, ty, { color: 'red', font: 0.4, align: 'center' })
            }
            return
        }
        if (!Game.rooms[roomName]) {
            /* 如果没有房间视野，采用observe观察 */
            for (let i in Memory.RoomControlData) {
                if (Game.rooms[i] && Game.rooms[i].controller.level >= 8) {
                    let observer_ = Game.getObjectById(Game.rooms[i].memory.StructureIdData.ObserverID) as StructureObserver
                    if (observer_ && observer_.observeRoom(roomName) == OK)
                        break
                }
            }
            return
        }
        if (!global.warData.tower[roomName].data)
            global.warData.tower[roomName].data = getTowerData(Game.rooms[roomName])
    }
    if (Game.flags['TowerVisualHeal']) {
        let roomName = Game.flags['TowerVisualHeal'].pos.roomName
        if (!global.warData) global.warData = {}
        if (!global.warData.tower) global.warData.tower = {}
        if (!global.warData.tower[roomName]) global.warData.tower[roomName] = { count: 0 }
        if (global.warData.tower[roomName].data) {
            for (var posData in global.warData.tower[roomName].data) {
                /* 数据 */
                let posXY = unzipXandY(posData)
                let tx = posXY[0]
                let ty = posXY[1]
                var Data = global.warData.tower[roomName].data[posData]
                new RoomVisual(roomName).text(`${Data.heal}`, tx, ty, { color: 'green', font: 0.4, align: 'center' })
            }
            return
        }
        if (!Game.rooms[roomName]) {
            /* 如果没有房间视野，采用observe观察 */
            for (let i in Memory.RoomControlData) {
                if (Game.rooms[i] && Game.rooms[i].controller.level >= 8) {
                    let observer_ = Game.getObjectById(Game.rooms[i].memory.StructureIdData.ObserverID) as StructureObserver
                    if (observer_ && observer_.observeRoom(roomName) == OK)
                        break
                }
            }
            return
        }
        if (!global.warData.tower[roomName].data)
            global.warData.tower[roomName].data = getTowerData(Game.rooms[roomName])
    }
    if (Game.flags['TowerVisualRepair']) {
        let roomName = Game.flags['TowerVisualRepair'].pos.roomName
        if (!global.warData) global.warData = {}
        if (!global.warData.tower) global.warData.tower = {}
        if (!global.warData.tower[roomName]) global.warData.tower[roomName] = { count: 0 }
        if (global.warData.tower[roomName].data) {
            for (var posData in global.warData.tower[roomName].data) {
                /* 数据 */
                let posXY = unzipXandY(posData)
                let tx = posXY[0]
                let ty = posXY[1]
                var Data = global.warData.tower[roomName].data[posData]
                new RoomVisual(roomName).text(`${Data.repair}`, tx, ty, { color: 'yellow', font: 0.4, align: 'center' })
            }
            return
        }
        if (!Game.rooms[roomName]) {
            /* 如果没有房间视野，采用observe观察 */
            for (let i in Memory.RoomControlData) {
                if (Game.rooms[i] && Game.rooms[i].controller.level >= 8) {
                    let observer_ = Game.getObjectById(Game.rooms[i].memory.StructureIdData.ObserverID) as StructureObserver
                    if (observer_ && observer_.observeRoom(roomName) == OK)
                        break
                }
            }
            return
        }
        if (!global.warData.tower[roomName].data)
            global.warData.tower[roomName].data = getTowerData(Game.rooms[roomName])
    }
}


/**
 * 房间日常数据可视化
 * 瞬时cpu 平均cpu 房间状态 任务数 bucket等
 */
export function RoomDataVisual(room: Room): void {
    room.visual.rect(0, 0, 7, 10, { opacity: 0.1, stroke: '#696969', strokeWidth: 0.2 })
    let row = 0
    room.visual.text(`全局实时CPU:${(global.UsedCpu ? global.UsedCpu : 0).toFixed(2)}`, 0, row += 1, { color: 'black', font: 0.7, align: 'left' })
    room.visual.text(`全局平均CPU:${(global.AveCpu ? global.AveCpu : 0).toFixed(2)}`, 0, row += 1, { color: 'black', font: 0.7, align: 'left' })
    room.visual.text(`测量基数:${(global.CpuData ? global.CpuData.length : 0)}`, 0, row += 1, { color: 'black', font: 0.7, align: 'left' })
    room.visual.text(`房间状态:${(room.memory.state == "peace" ? "和平" : "战争")}`, 0, row += 1, { color: room.memory.state == 'peace' ? '#006400' : 'red', font: 0.7, align: 'left' })
    room.visual.text(`cpu池:${Game.cpu.bucket}`, 0, row += 1, { color: Game.cpu.bucket < 2000 ? 'red' : 'black', font: 0.7, align: 'left' })
    /* 控制器进度 */
    if (!global.controllerData) { global.controllerData = {} }
    if (!global.controllerData[room.name]) { global.controllerData[room.name] = [] }
    if (room.controller.level < 8) {
        if (global.controllerData[room.name].length > 300) {
            global.controllerData[room.name].slice(1);
        }
        global.controllerData[room.name].push(room.controller.progress)
    }
    let processController = room.controller.level >= 8 ? 100 : ((room.controller.progress / room.controller.progressTotal) * 100).toFixed(2)
    room.visual.text(`控制器进度:${processController}%`, 0, row += 1, { color: 'black', font: 0.7, align: 'left' })
    if (global.controllerData[room.name].length > 10 && room.controller.level < 8) {
        let tick_number = (global.controllerData[room.name][global.controllerData[room.name].length - 1] - global.controllerData[room.name][0]) / global.controllerData[room.name].length;
        let up_number = Math.ceil((room.controller.progressTotal - room.controller.progress) / tick_number)
        room.visual.text(`进度预计:${up_number}tick`, 0, row += 1, { color: 'black', font: 0.7, align: 'left' })
    }
    /* 目前存在任务数 */
    var MissonNum = 0
    for (var range in room.memory.Misson)
        MissonNum += Object.keys(room.memory.Misson[range]).length
    room.visual.text(`房间任务数:${MissonNum}`, 0, row += 1, { color: MissonNum > 0 ? '#008B8B' : 'black', font: 0.7, align: 'left' })
    /* 仓库剩余容量 */
    let storage_ = global.Stru[room.name]['storage'] as StructureStorage
    if (storage_) {
        let num = Math.ceil(storage_.store.getFreeCapacity() / 1000)
        let color: string
        if (num <= 50) color = '#B22222'
        else if (num > 50 && num <= 200) color = '#FF8C00'
        else if (num > 200 && num <= 400) color = '#006400'
        else color = '#4682B4'
        room.visual.text(`仓库剩余容量:${num}K`, 0, row += 1, { color: color, font: 0.7, align: 'left' })
    }
    if (room.controller.level >= 8) {
        if (room.memory.productData.producing)
            room.visual.text(`工厂生产:${room.memory.productData.producing.com}`, 0, row += 1, { color: 'black', font: 0.7, align: 'left' })
        if (Object.keys(room.memory.ComDispatchData).length > 0) {
            room.visual.text(`合成规划:${Object.keys(room.memory.ComDispatchData)[Object.keys(room.memory.ComDispatchData).length - 1]}`, 0, row += 1, { color: 'black', font: 0.7, align: 'left' })
        }
    }
    /* lab资源可视化 */
    if (Object.keys(room.memory.RoomLabBind).length > 0) {
        for (let i in room.memory.RoomLabBind) {
            let lab_ = Game.getObjectById(i) as StructureLab
            if (!lab_) {
                delete room.memory.RoomLabBind[i]
                let index = room.memory.StructureIdData.labs.indexOf(i)
                room.memory.StructureIdData.labs.splice(index, 1)
                continue
            }
            room.visual.text(`${room.memory.RoomLabBind[i].rType}`, lab_.pos.x, lab_.pos.y, { color: CompoundColor[room.memory.RoomLabBind[i].rType], font: 0.3, align: 'center', strokeWidth: 0.2 })
        }
    }
}