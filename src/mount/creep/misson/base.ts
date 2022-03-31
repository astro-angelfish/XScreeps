/* 爬虫原型拓展   --任务  --任务基础 */

import { isInArray } from "@/utils"

export default class CreepMissonBaseExtension extends Creep {
    public ManageMisson(): void {
        if (this.spawning) return
        if (!this.memory.MissionData) this.memory.MissionData = {}
        /* 中央爬的无缝衔接 */
        if (this.memory.role == 'manage' && this.room.controller.my && this.room.controller.level == 8) {
            if (this.ticksToLive >= 1480) {
                if (Memory.RoomControlData[this.memory.belong]) {
                    let center = Memory.RoomControlData[this.memory.belong].center
                    if (this.pos.x != center[0] && this.pos.y != center[1]) {
                        this.goTo(new RoomPosition(center[0], center[1], this.memory.belong), 0)
                        return;
                    }
                }
            }
            if (this.ticksToLive <= 190) this.room.memory.SpawnConfig.manage.num = 2;
            else this.room.memory.SpawnConfig.manage.num = 1;
        }
        /* 生命低于50就将资源上交 */
        if (this.ticksToLive < 50 && (isInArray(['transport', 'manage'], this.memory.role))) {
            let storage_ = Game.getObjectById(Game.rooms[this.memory.belong].memory.StructureIdData.storageID) as StructureStorage
            if (!storage_) return
            if (this.store.getUsedCapacity() > 0) {
                for (let i in this.store) {
                    if (this.transfer_(storage_, i as ResourceConstant) == OK) {
                        if (this.memory.role == 'manage') this.room.memory.SpawnConfig.manage.num = 1;
                        this.suicide();
                    }
                    return
                }
            }
            else {
                if (this.memory.role == 'manage') this.room.memory.SpawnConfig.manage.num = 1;
                this.suicide();
            }
            return
        }

        if (Object.keys(this.memory.MissionData).length <= 0) {
            if (this.memory.taskRB) {
                let task_ = Game.rooms[this.memory.belong].GainMission(this.memory.taskRB)
                if (task_) {
                    task_.CreepBind[this.memory.role].bind.push(this.name)
                    this.memory.MissionData.id = task_.id           // 任务id
                    this.memory.MissionData.name = task_.name        // 任务名
                    this.memory.MissionData.Data = task_.Data ? task_.Data : {}    // 任务数据传输
                    return
                }
            }
            /* 没任务的情况下考虑领任务 */
            if (!Game.rooms[this.memory.belong].memory.Misson['Creep'])
                Game.rooms[this.memory.belong].memory.Misson['Creep'] = []
            let taskList = Game.rooms[this.memory.belong].memory.Misson['Creep']
            let thisTaskList: MissionModel[] = []
            for (let Stask of taskList) {
                if (Stask.CreepBind && isInArray(Object.keys(Stask.CreepBind), this.memory.role))
                    thisTaskList.push(Stask)
            }
            if (thisTaskList.length <= 0) {
                /* 没任务就处理剩余资源 */
                if (this.room.name != this.memory.belong) return
                let st = this.store
                if (!st) return
                for (let i of Object.keys(st)) {
                    let storage_ = Game.rooms[this.memory.belong].storage ? Game.rooms[this.memory.belong].storage : Game.rooms[this.memory.belong].terminal;
                    if (!storage_) return
                    this.say("🛒")
                    if (this.transfer(storage_, i as ResourceConstant) == ERR_NOT_IN_RANGE) this.goTo(storage_.pos, 1)
                    return
                }
                return
            }
            else {
                /* 还没有绑定的任务，就等待接取任务 */
                LoopBind:
                for (var t of thisTaskList) {
                    if (t.CreepBind && t.CreepBind[this.memory.role] && t.CreepBind[this.memory.role].bind.length < t.CreepBind[this.memory.role].num) {
                        /* 绑定任务了就输入任务数据 */
                        t.processing = true // 领取任务后，任务开始计时
                        t.CreepBind[this.memory.role].bind.push(this.name)
                        this.memory.MissionData.id = t.id           // 任务id
                        this.memory.MissionData.name = t.name        // 任务名
                        this.memory.MissionData.Data = t.Data ? t.Data : {}    // 任务数据传输
                        // this.memory.MissionData.Sata = t.Sata?t.Sata:{}
                        break LoopBind
                    }
                }
                if (Object.keys(this.memory.MissionData).length <= 0) this.say("💤")
                return
            }
        }
        else {
            switch (this.memory.MissionData.name) {
                case '虫卵填充': { this.handle_feed(); break; }
                case '物流运输': { this.handle_carry(); break; }
                case '墙体维护': { this.handle_repair(); break; }
                case 'C计划': { this.handle_planC(); break; }
                case '黄球拆迁': { this.handle_dismantle(); break; }
                case '急速冲级': { this.handle_quickRush(); break; }
                case '扩张援建': { this.handle_expand(); break }
                case '紧急支援': { this.handle_support(); break }
                case '控制攻击': { this.handle_control(); break }
                case '紧急援建': { this.handle_helpBuild(); break }
                case '签名': { this.handle_sig(); break }
                case '掠夺者': { this.handle_loot(); break }
                case '一体机': { this.handle_AIO(); break }
                case '双人攻击': { this.handle_doubleDismantle(); break }
                case 'dp_harvest': { this.handle_dp(); break }
                case 'dp_transfer': { this.handle_dp(); break }
                case 'pb': { this.handle_pb(); break }
                case '红球防御': { this.handle_defend_attack(); break }
                case '蓝球防御': { this.handle_defend_range(); break }
                case '双人防御': { this.handle_defend_double(); break }
                case '外矿开采': { this.handle_outmine(); break }
                case '四人小队': { this.handle_task_squard(); break }
            }
        }
    }

}