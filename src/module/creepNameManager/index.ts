import { nameData } from "./nameData";

interface Room {
    memory: {
        creepNameManager: {
            names: string[],
            index: number
        }
    }
}

/**
 * 命名管理器，负责生产不一样的原神角色名字，实在没有则在角色名后加数字，要求每个房间爬的数目最好小于40
 */
export default class CreepNameManager {
    /**
     * 初始化CreepNameTable名称注册表
     * 
     * @param room Room对象
     */
    static init(room: Room) {
        if (!room.memory.creepNameManager) {
            room.memory.creepNameManager = {
                // 所有的名字
                names: Object.keys(nameData),
                // 当前可使用的名字
                index: 0
            }
        }
    }

    /**
     * 注册一个名字，用房间名包装好返回，比如 胡桃 -> E13S14 胡桃
     * 
     * @param room Room对象
     */
    static registerName(room) {
        CreepNameManager.init(room);

        const nameManeger = room.memory.creepNameManager;
        const firstIndex = nameManeger.index;   // 记下刚开始的序号
        let isNamesEmpty = false;               // 标记，判断原神角色名可用是否为空
        let creepName;

        while (Game.creeps[room.name + ' ' + nameManeger.names[nameManeger.index]]) {
            nameManeger.index = (nameManeger.index + 1) % nameManeger.names.length;
            // 转回来了说明原神角色名用完了
            if (firstIndex == nameManeger.index) {
                isNamesEmpty = true;
                break;
            }
        }
        if (!isNamesEmpty) {
            creepName = nameManeger.names[nameManeger.index];
            nameManeger.index = (nameManeger.index + 1) % nameManeger.names.length;
        }
        else {
            // 拼一个随机的名字
            while (true) {
                creepName = nameManeger.names[Math.floor(Math.random() * 100) % nameManeger.names.length] + Math.floor(Math.random() * 10);
                if (!Game.creeps[room.name + ' ' + creepName]) break;
            }
        }
        // 注意返回值已经包装好了房间名
        return room.name + ' ' + creepName;
    }

    /**
     * 判断一个名字是否符合原神角色名
     * 
     * @param creepName 爬名
     */
    static isYuanshenName(creepName) {
        return creepName in nameData;
    }

    /**
     * 获取台词数组
     * 
     * @param creepName 爬名
     * @param type 台词类型：daily or war
     */
    static getLexicon(creepName, type) {
        return nameData[creepName][type];
    }
}