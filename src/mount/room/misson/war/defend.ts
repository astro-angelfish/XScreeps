import { deserveDefend } from "@/module/fun/funtion";
import { isInArray, unzipPosition, zipPosition } from "@/utils"
import { CheckCreepTeam } from "@/module/war/war"


/* 房间原型拓展   --任务  --防御战争 */
export default class DefendWarExtension extends Room {
    // 核弹防御
    public Nuke_Defend(): void {
        if (this.memory.nukeData && this.memory.nukeData.damage && Object.keys(this.memory.nukeData.damage).length > 0)
            for (var i in this.memory.nukeData.damage) {
                var thisPos = unzipPosition(i)
                new RoomVisual(this.name).text(`${this.memory.nukeData.damage[i] / 1000000}M`, thisPos.x, thisPos.y, { color: this.memory.nukeData.damage[i] == 0 ? 'green' : 'red', font: 0.5 });

            }
        if (Game.time % 41) return
        if (this.memory.switch.Stopnukeprotect) return
        var nuke_ = this.find(FIND_NUKES)
        if (this.controller.level < 6) return
        // var nuke_ = this.find(FIND_FLAGS,{filter:(flag_)=>{return flag_.color == COLOR_ORANGE}})
        if (!this.memory.nukeID) this.memory.nukeID = []
        if (!this.memory.nukeData) this.memory.nukeData = { damage: {}, rampart: {} }
        if (nuke_.length > 0) {
            /* 发现核弹，激活核防御任务 */
            var data = this.memory.nukeData.damage
            var rampart = this.memory.nukeData.rampart
            for (var n of nuke_) {
                if (isInArray(this.memory.nukeID, n.id)) continue
                var strPos = zipPosition(n.pos)
                if (n.pos.GetStructureList(['spawn', 'rampart', 'terminal', 'powerSpawn', 'factory', 'nuker', 'lab', 'tower', 'storage']).length > 0) {
                    if (!data[strPos]) data[strPos] = 10000000
                    else data[strPos] += 10000000
                    if (!rampart[strPos]) {
                        var rampart_ = n.pos.GetStructure('rampart')
                        if (rampart_) rampart[strPos] = rampart_.hits
                        else rampart[strPos] = 0
                    }
                }
                LoopA:
                for (var nX = n.pos.x - 2; nX < n.pos.x + 3; nX++)
                    LoopB:
                    for (var nY = n.pos.y - 2; nY < n.pos.y + 3; nY++) {
                        var thisPos = new RoomPosition(nX, nY, this.name)
                        if (nX == n.pos.x && nY == n.pos.y) continue LoopB
                        if (thisPos.GetStructureList(['spawn', 'rampart', 'terminal', 'powerSpawn', 'factory', 'nuker', 'lab', 'tower']).length <= 0) continue LoopB
                        if (nX > 0 && nY > 0 && nX < 49 && nY < 49) {
                            var strThisPos = zipPosition(thisPos)
                            if (!data[strThisPos]) data[strThisPos] = 5000000
                            else data[strThisPos] += 5000000
                            if (!rampart[strThisPos]) {
                                var rampart_ = n.pos.GetStructure('rampart')
                                if (rampart_) rampart[strThisPos] = rampart_.hits
                                else rampart[strThisPos] = 0
                            }
                        }
                    }
                this.memory.nukeID.push(n.id)
            }
            let allDamageNum = 0
            for (var i in data) {
                /*  */
                var thisPos = unzipPosition(i)
                if (data[i] == 0) {
                    var rampart__ = thisPos.GetStructure('rampart')
                    if (rampart__) {
                        rampart[i] = rampart__.hits
                    }

                }
                allDamageNum += data[i]
            }
            /* 计算总核弹需要维修的伤害确定 */
            var boostType: ResourceConstant = null
            if (allDamageNum >= 50000000) boostType = 'XLH2O'
            var num: number = 1
            if (allDamageNum >= 10000000 && allDamageNum < 20000000) num = 2
            else if (allDamageNum >= 20000000 && allDamageNum < 40000000) num = 3
            else if (allDamageNum >= 40000000) num = 3
            var task: MissionModel
            for (var t of this.memory.Misson['Creep']) {
                if (t.name == '墙体维护' && t.Data.RepairType == 'nuker')
                    task = t
            }
            if (task) {
                task.Data.num = num
                if (task.CreepBind['repair'].num != num)
                    task.CreepBind['repair'].num = num
                if (task.Data.boostType == undefined && boostType == 'XLH2O') {
                    /* 删除现有任务，重新挂载有boost的任务 */
                    this.DeleteMission(task.id)
                }

            }
            /* 激活维修防核任务 */
            else {
                var thisTask: MissionModel = this.public_repair('nuker', num, boostType, 'T0')
                if (thisTask && allDamageNum > 0)
                    this.AddMission(thisTask)
            }

            /* 去除废除的维护坐标 例如核弹已经砸过了，但是还没有修完 */
            if (Game.time % 9 == 0)
                LoopP:
                for (var po in this.memory.nukeData.damage) {
                    var thisPos = unzipPosition(po)
                    for (var nuk of nuke_) {
                        if (thisPos.inRangeTo(nuk, 2))
                            continue LoopP
                    }
                    if (this.memory.nukeData.rampart[po]) delete this.memory.nukeData.rampart[po]
                    delete this.memory.nukeData.damage[po]
                }
        }
        else {
            for (var m of this.memory.Misson['Creep']) {
                if (m.name == '墙体维护' && m.Data.RepairType == 'nuker') {
                    this.DeleteMission(m.id)
                }
            }
            if (this.memory.nukeID.length > 0) this.memory.nukeID = []
            this.memory.nukeData = { damage: {}, rampart: {} }
        }
    }


    /* 主动防御任务发布 */
    public Task_Auto_Defend(): void {
        if (this.memory.state == 'war') {
            this.Task_Defend_init();
        }
        if (Game.time % 5) return
        // if (!Game.rooms[this.name].terminal) return
        if (this.controller.level < 6) return
        if (!this.memory.state) return
        if (this.memory.state != 'war') { this.memory.switch.AutoDefend = false; this.memory.enemy = {}; return }
        /* 激活主动防御 */
        var enemys = this.find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => {
                return !isInArray(Memory.whitesheet, creep.owner.username) && (creep.owner.username != 'Invader') && deserveDefend(creep)
            }
        })
        if (enemys.length <= 0) { this.memory.switch.AutoDefend = false; this.memory.enemy = {}; return }
        /* 如果有合成任务，删除合成任务 */
        // let compoundTask = this.MissionName('Room', '资源合成')
        // if (compoundTask) {
        //     this.DeleteMission(compoundTask.id)
        //     return
        // }
        if (!this.memory.switch.AutoDefend) {
            this.memory.switch.AutoDefend = true        // 表示房间存在主动防御任务
            /* 寻找攻击方 */
            let users = []
            for (let c of enemys) if (!isInArray(users, c.owner.username)) users.push(c.owner.username)
            let str = ''; for (let s of users) str += ` ${s}`

            Game.notify(`房间${this.name}激活主动防御! 目前检测到的攻击方为:${str},爬虫数为:${enemys.length},我们将抗战到底!`)
            console.log(`房间${this.name}激活主动防御! 目前检测到的攻击方为:${str},爬虫数为:${enemys.length},我们将抗战到底!`)
            // if (str == ' Bulletproof' && enemys.length <= 1) {
            //     this.memory.switch.AutoDefend = false        // 表示房间存在主动防御任务
            //     return;
            // } else {

            // }
        }
        // console.log(JSON.stringify(enemys))
        /* 分析敌对爬虫的数量,应用不同的主防任务应对 */
        let hostileCreep = this.hostileCreep_atk(enemys)
        let defend_plan = {}

        if (enemys.length < 2 || hostileCreep < 600)      // 1
        {
            defend_plan = { 'attack': 1, 'double': 0, 'range': 0 }
        } else if (enemys.length <= 2)      // 2
        {
            defend_plan = { 'attack': 1, 'double': 0, 'range': 0 }
        }
        else if (enemys.length > 2 && enemys.length < 5)       // 3-4
        {
            defend_plan = { 'attack': 2, 'double': 0, 'range': 0 }
        }
        else if (enemys.length >= 5 && enemys.length < 8)   // 5-7
        {
            defend_plan = { 'attack': 3, 'double': 0, 'range': 0 }
        }
        else if (enemys.length >= 8)        // >8     一般这种情况下各个类型的防御任务爬虫的数量都要调高
        {
            let attack_number = 2
            if (global.HostileGroup[this.name].length > 4) {
                attack_number = global.HostileGroup[this.name].length;
                attack_number = attack_number > 6 ? 6 : attack_number;
            }
            defend_plan = { 'attack': attack_number, 'double': 1, 'range': 0 }
        }
        for (var plan in defend_plan) {

            switch (plan) {
                case 'attack':
                    var num = this.MissionNum('Creep', '红球防御')
                    if (num <= 0) {
                        let thisTask = this.public_red_defend(defend_plan[plan])
                        if (thisTask) {

                            this.AddMission(thisTask)
                            console.log(`房间${this.name}红球防御任务激活!`, enemys.length)
                        }
                    }
                    else {
                        /* 已经存在的话查看数量是否正确 */
                        let task = this.MissionName('Creep', '红球防御')
                        if (task) {
                            task.CreepBind['defend-attack'].num = defend_plan[plan]
                            // console.log(Colorful(`房间${this.name}红球防御任务数量调整为${defend_plan[plan]}!`,'red'))
                        }
                    }
                    break;
                case 'range':
                    var num = this.MissionNum('Creep', '蓝球防御')
                    if (num <= 0) {
                        let thisTask = this.public_blue_defend(defend_plan[plan])
                        if (thisTask) {
                            this.AddMission(thisTask)
                            console.log(`房间${this.name}蓝球防御任务激活!`, enemys.length)
                        }
                    }
                    else {
                        /* 已经存在的话查看数量是否正确 */
                        let task = this.MissionName('Creep', '蓝球防御')
                        if (task) {
                            task.CreepBind['defend-range'].num = defend_plan[plan]
                            // console.log(Colorful(`房间${this.name}蓝球防御任务数量调整为${defend_plan[plan]}!`,'blue'))
                        }
                    }
                    break;
                case 'double':
                    if (this.controller.level < 8) { break; }
                    var num = this.MissionNum('Creep', '双人防御')
                    if (num <= 0) {
                        let thisTask = this.public_double_defend(defend_plan[plan])
                        if (thisTask) {
                            this.AddMission(thisTask)
                            console.log(`房间${this.name}双人防御任务激活!`, enemys.length)
                        }
                    }
                    else {
                        /* 已经存在的话查看数量是否正确 */
                        let task = this.MissionName('Creep', '双人防御')
                        if (task) {
                            task.CreepBind['defend-douAttack'].num = defend_plan[plan]
                            task.CreepBind['defend-douHeal'].num = defend_plan[plan]
                            // console.log(Colorful(`房间${this.name}双人防御任务数量调整为${defend_plan[plan]}!`,'green'))
                        }
                    }
                    break;
            }
        }
        /* 主动防御分配系统更新 删除过期敌对爬虫数据 */
        for (let myCreepName in this.memory.enemy) {
            if (!Game.creeps[myCreepName]) delete this.memory.enemy[myCreepName]
            else {
                /* 查找项目里的爬虫是否已经死亡 */
                for (let enemyID of this.memory.enemy[myCreepName]) {
                    if (!Game.getObjectById(enemyID)) {
                        let index = this.memory.enemy[myCreepName].indexOf(enemyID)
                        this.memory.enemy[myCreepName].splice(index, 1)
                    }
                }
            }
        }
    }
    public hostileCreep_atk(nearCreep): number {
        let all_atk = 0;
        for (let i in nearCreep) {
            var creeps_hostile = nearCreep[i];
            for (let boost_i in creeps_hostile.body) {
                let body_data = creeps_hostile.body[boost_i]
                switch (body_data.type) {
                    case 'attack':
                    case 'ranged_attack':
                        all_atk += this.attack_number(body_data.type, body_data.boost)
                        break;
                }
            }
        }
        return all_atk;
    }


    public Get_HOSTILE_CREEPS(): Creep[] {
        if (global.HostileCreeps[this.name].length < 1) {
            var enemys = this.find(FIND_HOSTILE_CREEPS, {
                filter: (creep) => {
                    return !isInArray(Memory.whitesheet, creep.owner.username) && (creep.owner.username != 'Invader')
                }
            })
            global.HostileCreeps[this.name] = enemys;
            for (let creeps of enemys) {
                global.HostileCreepsData[creeps.name] = creeps;
            }
        }


        return global.HostileCreeps[this.name] as Creep[];
    }
    public Task_Defend_init() {
        let duplicate_list = [];
        for (let creeps in this.memory.Enemydistribution) {
            if (!Memory.creeps[creeps]) {
                delete this.memory.Enemydistribution[creeps];
            }
            if (isInArray(duplicate_list, this.memory.Enemydistribution[creeps])) {
                delete this.memory.Enemydistribution[creeps];
            }
            duplicate_list.push(this.memory.Enemydistribution[creeps])
        }
        /*开始进行矩阵计算*/
        let creep_team_list = {};
        var enemys = this.Get_HOSTILE_CREEPS()
        for (let HostileCeeps of enemys) {
            /*开始进行匹配操作*/
            let pos_ = HostileCeeps.pos
            creep_team_list[HostileCeeps.name] = CheckCreepTeam(HostileCeeps, enemys)
        }
        /*二次数据加工检测四人队伍信息*/
        let _creep_list = [];
        let creep_team_result = []
        for (let creep_name in creep_team_list) {
            if (isInArray(_creep_list, creep_name)) { continue }
            /*检查KEY里面的爬是否均包含对应的爬信息*/
            switch (creep_team_list[creep_name].length) {
                case 4:
                case 2:
                case 1:
                    let _c_data = [];
                    for (let c_data of creep_team_list[creep_name]) {
                        _creep_list.push(c_data.name)
                        _c_data.push(c_data.name)
                    }
                    creep_team_result.push(_c_data)
                    break;
            }
        }
        for (let group of creep_team_result) {
            if (global.HostileCreepsData[group[0]]) {
                global.HostileGroup[this.name].push(global.HostileCreepsData[group[0]].id)
            }
        }
        // console.log('分组', creep_team_result.length, JSON.stringify(global.HostileGroup[this.name]))
        if (!global.HostileData[this.name]) global.HostileData[this.name] = { time: Game.time, data: this.Task_Defend_Operation() }
        if (Game.time == global.HostileData[this.name].time) return // 跳过
        else    // 说明数据过时了，更新数据
        {
            global.HostileData[this.name].time = Game.time
            global.HostileData[this.name].data = this.Task_Defend_Operation()
        }
    }

    /*敌人强度计算*/
    public Task_Defend_Operation() {
        let _boost_attack = {
            'UH': 1,
            'KO': 1,
            'LO': 1,
            'UH2O': 2,
            'KHO2': 2,
            'LHO2': 2,
            'XUH2O': 3,
            'XKHO2': 3,
            'XLHO2': 3,
        }
        /*搜索所有的敌对爬的信息*/
        // var enemys = this.find(FIND_HOSTILE_CREEPS, {
        //     filter: (creep) => {
        //         return !isInArray(Memory.whitesheet, creep.owner.username) && (creep.owner.username != 'Invader')
        //     }
        // })
        var enemys = this.Get_HOSTILE_CREEPS()
        let Defend_Data = {};
        for (let HostileCeeps of enemys) {
            /*检查爬的攻防信息 包括奶量*/
            let attcak_body = 0
            let ranged_attcak_body = 0
            let heal_body = 0
            for (let body of HostileCeeps.body) {
                let boost_num = 1;
                if (body.boost) {
                    boost_num += _boost_attack[body.boost]
                }
                switch (body.type) {
                    case 'attack':
                        attcak_body += boost_num
                        break;
                    case 'ranged_attack':
                        ranged_attcak_body += boost_num
                        break;
                    case 'heal':
                        heal_body += boost_num;
                        break;
                }
            }

            /*完成部位统计进行具体伤害的结算*/
            if (attcak_body > 0) {
                // console.log('搜索到attcak')
                /*获取有效范围同时进行伤害标记*/
                let get_Updatehurt = this.Updatehurt_atk(HostileCeeps.pos, 1, attcak_body * 30)
                for (let key in get_Updatehurt) {
                    Defend_Data = this.UpdateposData(key, get_Updatehurt[key], 0, 0, Defend_Data)
                }
            }
            if (ranged_attcak_body > 0) {
                // console.log('搜索到ranged_attcak')
                let get_Updatehurt = this.Updatehurt_atk(HostileCeeps.pos, 3, ranged_attcak_body * 10)
                for (let key in get_Updatehurt) {
                    Defend_Data = this.UpdateposData(key, 0, get_Updatehurt[key], 0, Defend_Data)
                }
            }
            if (heal_body > 0) {
                let get_Updatehurt = this.Updatehurt_heal(HostileCeeps.pos, 3, heal_body * 12)
                for (let key in get_Updatehurt) {
                    Defend_Data = this.UpdateposData(key, 0, 0, get_Updatehurt[key], Defend_Data)
                }
            }
        }
        // 
        // console.log(JSON.stringify(Defend_Data))
        return Defend_Data;
    }

    public UpdateposData(key, attcak_number, ranged_attcak_number, heal_number, globaldata) {
        if (!globaldata[key]) globaldata[key] = { attack: 0, rattack: 0, heal: 0, repair: 0 }
        if (attcak_number > 0) {
            globaldata[key].attack += attcak_number;
        }
        if (ranged_attcak_number > 0) {
            globaldata[key].rattack += ranged_attcak_number;
        }
        if (heal_number > 0) {
            globaldata[key].heal += heal_number;
        }
        return globaldata;
    }

    public Updatehurt_heal(pos, range, hurt) {
        var a = -range;
        let _roomlist = {};
        for (var i = a; i <= range; i++) {
            for (var ii = a; ii <= range; ii++) {
                // console.log(i, ii)
                /*检查具体的距离*/
                let m_range = Math.max(Math.abs(i), Math.abs(ii))
                /*出坐标信息*/
                let x = pos.x + i;
                let y = pos.y + ii;
                let pos_ = `${x}/${y}`
                // if (!global.warData.tower[pos.roomName].data[pos_]) { continue; }
                // console.log(pos_, '更新伤害', JSON.stringify(this[pos_]))
                switch (m_range) {
                    case 1:
                    case 0:
                        _roomlist[pos_] = hurt;
                        break;
                    case 2:
                    case 3:
                        _roomlist[pos_] = hurt / 3;
                        break;
                }
            }
        }
        return _roomlist;
    }

    public Updatehurt_atk(pos, range, hurt) {
        var a = -range;
        let _roomlist = {};
        for (var i = a; i <= range; i++) {
            for (var ii = a; ii <= range; ii++) {
                // console.log(i, ii)
                /*检查具体的距离*/
                let m_range = Math.max(Math.abs(i), Math.abs(ii))
                /*出坐标信息*/
                let x = pos.x + i;
                let y = pos.y + ii;
                let pos_ = `${x}/${y}`
                // if (!global.warData.tower[pos.roomName].data[pos_]) { continue; }
                // console.log(pos_, '更新伤害', JSON.stringify(this[pos_]))
                switch (m_range) {
                    case 1:
                        _roomlist[pos_] = hurt;
                        break;
                    case 2:
                        _roomlist[pos_] = hurt * 0.4;
                        break;
                    case 3:
                        _roomlist[pos_] = hurt * 0.1;
                        break;
                }
            }
        }
        return _roomlist;
    }

    public attack_number(type, boost) {
        let _boost_attack = {
            'UH': 1,
            'KO': 1,
            'LO': 1,
            'UH2O': 2,
            'KHO2': 2,
            'LHO2': 2,
            'XUH2O': 3,
            'XKHO2': 3,
            'XLHO2': 3,
        }
        let _x = 1;
        if (_boost_attack[boost]) {
            _x += _boost_attack[boost]
        }
        let _number = 0;
        switch (type) {
            case 'attack':
                _number = _x * 30;
                break;
            case 'ranged_attack':
                _number = _x * 10;
                break;
            case 'heal':
                _number = _x * 12;
                break;
        }
        return _number;
    }

    /* 红球防御 */
    public Task_Red_Defend(mission: MissionModel): void {
        if ((Game.time - global.Gtime[this.name]) % 10) return
        if (!this.Check_Lab(mission, 'transport', 'complex')) return
        if ((Game.time - global.Gtime[this.name]) % 20) return
        var enemys = this.find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => {
                return !isInArray(Memory.whitesheet, creep.owner.username) && (creep.owner.username != 'Invader' && deserveDefend(creep))
            }
        })
        if (enemys.length <= 0) {
            this.DeleteMission(mission.id)
        }
    }

    /* 蓝球防御 */
    public Task_Blue_Defend(mission: MissionModel): void {
        if ((Game.time - global.Gtime[this.name]) % 10) return
        if (!this.Check_Lab(mission, 'transport', 'complex')) return
        if ((Game.time - global.Gtime[this.name]) % 20) return
        var enemys = this.find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => {
                return !isInArray(Memory.whitesheet, creep.owner.username) && (creep.owner.username != 'Invader' && deserveDefend(creep))
            }
        })
        if (enemys.length <= 0) {
            this.DeleteMission(mission.id)
        }
    }

    /* 双人防御 */
    public Task_Double_Defend(mission: MissionModel): void {
        if ((Game.time - global.Gtime[this.name]) % 10) return
        if (!this.Check_Lab(mission, 'transport', 'complex')) return
        if ((Game.time - global.Gtime[this.name]) % 20) return
        var enemys = this.find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => {
                return !isInArray(Memory.whitesheet, creep.owner.username) && (creep.owner.username != '1Invader' && deserveDefend(creep))
            }
        })
        if (enemys.length <= 0) {
            this.DeleteMission(mission.id)
        }
    }

}