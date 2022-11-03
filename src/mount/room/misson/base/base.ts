import { RoleData } from "@/constant/SpawnConstant"
import { t1, t2, t3 } from "@/constant/ResourceConstant"
import { checkDispatch, checkSend, DispatchNum } from "@/module/fun/funtion"
import { Colorful, compare, generateID, isInArray } from "@/utils"

/* 房间原型拓展   --任务  --任务框架 */
export default class RoomMissonFrameExtension extends Room {
    /* 任务管理器 */
    public MissionManager(): void {
        var cpu_test = false
        if (Memory.Systemswitch.ShowtestroomMisson) {
            cpu_test = true
        }
        let cpu_list = [];
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }
        this.SpeedUpcontroller()
        // 冷却监测
        this.CoolDownCaculator()
        // 超时监测
        this.DelayCaculator()
        // 任务-爬虫 绑定信息更新
        this.UnbindMonitor()
        // 任务-爬虫 孵化
        this.MissonRoleSpawn()
        // 任务相关lab绑定信息更新
        this.Update_Lab()
        /* PC任务管理器 */
        this.PowerCreep_TaskManager()
        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }

        /* [全自动] 任务挂载区域 需要按照任务重要程度进行排序 */
        this.Spawn_Feed()    // 虫卵填充任务 
        this.Task_CenterLink()  // 能量采集  
        this.Task_ComsumeLink() // 消费、冲级link
        this.Constru_Build()   // 建筑任务
        this.Task_Clink()       // 链接送仓任务

        this.Tower_Feed()   // 防御塔填充任务
        this.Lab_Feed()     // 实验室填充\回收任务  
        this.Nuker_Feed()   // 核弹填充任务      
        this.Nuke_Defend()  // 核弹防御
        this.Task_CompoundDispatch()    // 合成规划 （中级）
        this.Task_LabAutomatic()    // Lab 自动合成规划
        this.Task_FactoryAutomatic() // Factory 自动/压缩解压规划
        this.Task_monitorMineral()  // 挖矿
        this.Task_montitorPower()   // 烧power任务监控
        this.Task_Auto_Defend()     // 主动防御任务发布
        this.Auto_Basicmarket() //自动化基础资源保持功能
        this.Resource_Recycle() //资源回收

        if (cpu_test) { cpu_list.push(Game.cpu.getUsed()) }

        /* 基本任务监控区域 */
        for (var index in this.memory.Misson) {
            for (var misson of this.memory.Misson[index]) {
                var a = Game.cpu.getUsed()
                switch (misson.name) {
                    case "物流运输": this.Task_Carry(misson); break;
                    case "位面运输": this.Task_Carryshard(misson); break;
                    case "拾荒者": this.Task_Carrygleaner(misson); break;
                    case "外矿偷取": this.Task_Carrymine(misson); break;
                    case "墙体维护": this.Task_Repair(misson); break;
                    case '黄球拆迁': this.Task_dismantle(misson); break;
                    case '急速冲级': this.Task_Quick_upgrade(misson); break;
                    case '紧急援建': this.Task_HelpBuild(misson); break;
                    case '紧急升级': this.Task_HelpUpgrade(misson); break;
                    case '紧急支援': this.Task_HelpDefend(misson); break;
                    case "紧急墙体": this.Task_HelpRepair(misson); break;
                    case '资源合成': this.Task_Compound(misson); break;
                    case '攻防一体': this.Task_aio(misson); break;
                    case '外矿开采': this.Task_OutMine(misson); break;
                    case "power升级": this.Task_ProcessPower(misson); break;
                    case '过道采集': this.Task_Cross(misson); break;
                    case '资源转移': this.Task_Resource_transfer(misson); break;
                    case 'power采集': this.Task_PowerHarvest(misson); break;
                    case '红球防御': this.Task_Red_Defend(misson); break;
                    case '蓝球防御': this.Task_Blue_Defend(misson); break;
                    case '双人防御': this.Task_Double_Defend(misson); break;
                    case '四人小队': this.Task_squad(misson); break;
                    case '双人小队': this.Task_double(misson); break;
                    case '普通冲级': this.Task_Normal_upgrade(misson); break;
                    case '扩张援建': this.Task_Expand(misson); break;
                    case '智能战争': this.Task_Aiwar(misson); break;
                    case '智能哨兵': this.Task_Aisentry(misson); break;
                    case '踩工地': this.Task_CConstruction(misson); break;
                }
                // return
                if (cpu_test) {
                    var b = Game.cpu.getUsed()
                    if (b - a > 0.005) {
                        console.log(misson.name, b - a, this.name)
                    }
                }
            }
        }
        if (cpu_test) {
            cpu_list.push(Game.cpu.getUsed())
            console.log(
                this.name,
                '基础任务' + (cpu_list[1] - cpu_list[0]).toFixed(3),
                '全自动' + (cpu_list[2] - cpu_list[1]).toFixed(3),
                '任务管理' + (cpu_list[3] - cpu_list[2]).toFixed(3),

                '总计' + (cpu_list[3] - cpu_list[0]).toFixed(3),
            )
        }
    }

    /* 添加任务 */
    public AddMission(mis: MissionModel): boolean {
        if (!mis) return false
        var Index: string
        if (mis.range == 'Creep') Index = 'C-'
        else if (mis.range == 'Room') Index = 'R-'
        else if (mis.range == 'Structure') Index = 'S-'
        else if (mis.range == 'PowerCreep') Index = 'P-'
        else return
        var tempID = Index + generateID()
        /* 最多允许同时有30个任务，超过则不能再挂载 */
        if (this.memory.Misson[mis.range] && this.memory.Misson[mis.range].length >= 30) {
            return false
        }
        /* 超过了任务的最大重复数，也不允许挂载 默认是1*/
        var maxtime = mis.maxTime ? mis.maxTime : 1
        if (mis.CreepBind) {
            /* 爬虫任务 */
            for (var c of Object.keys(mis.CreepBind)) {
                if (this.RoleMissionNum(c, mis.name) >= maxtime)
                    return false
            }
        }
        else {
            /* 房间、建筑类型的任务 */
            let NowNum = this.MissionNum(mis.range, mis.name)
            if (NowNum >= maxtime) {
                return false
            }
        }
        /* 如果该任务冷却时间不为0则不允许挂载 */
        if (this.memory.CoolDownDic[mis.name]) {
            return false
        }
        mis.id = tempID
        /* lab绑定相关，涉及lab的绑定和解绑 */
        // if (mis.LabBind && Object.keys(mis.LabBind).length > 0)
        // {
        //     for (var l in mis.LabBind)
        //     {
        //         if (!this.CheckLabType(l,mis.LabBind[l] as ResourceConstant) || !this.CheckLabOcc(l))
        //         {
        //             console.log(Colorful(`LabID:${l}绑定失败，请检查!`,'red',true))
        //             return false
        //         }
        //     }
        // }
        // if (mis.LabBind === null) return false
        /* 每种相同任务成功挂载一次，将有冷却时间 默认为10 */
        var coolTick = mis.cooldownTick ? mis.cooldownTick : 10
        if (!this.memory.CoolDownDic[mis.name])
            this.memory.CoolDownDic[mis.name] = coolTick
        mis.level = mis.level ? mis.level : 10  // 任务等级默认为10
        // 挂载任务
        this.memory.Misson[mis.range].push(mis)
        this.memory.Misson[mis.range].sort(compare('level'))      // 每次提交任务都根据优先级排列一下
        if (!isInArray(Memory.ignoreMissonName, mis.name))
            console.log(Colorful(`${mis.name} 任务挂载 √√√ ID:${mis.id} Room:${this.name}`, 'green'))
        /* 任务挂载成功才绑定实验室 */
        // if (mis.LabBind && Object.keys(mis.LabBind).length > 0)
        // {
        //     for (var ll in mis.LabBind)
        //     {
        //         this.BindLabData(ll,mis.LabBind[ll] as ResourceConstant,mis.id)
        //     }
        // }
        return true
    }

    /* 删除任务 */
    public DeleteMission(id: string): boolean {
        var range: string
        if (!id) { console.log("存在id异常! 发生在房间", this.name); return false }
        if (id[0] == 'C') range = 'Creep'
        else if (id[0] == 'S') range = 'Structure'
        else if (id[0] == 'R') range = 'Room'
        else if (id[0] == 'P') range = 'PowerCreep'
        else return false
        for (var m of this.memory.Misson[range]) {
            if (m.id == id) {
                /* 解绑lab */
                if (m.LabBind && Object.keys(m.LabBind).length > 0) {
                    for (var l in m.LabBind) {
                        // console.log('LabID: ',m.LabBind[l],'------解绑-------->MissonID: ',m.id)
                        this.UnBindLabData(l, m.id)
                    }
                }
                /* 解绑爬虫的任务 对于没有超时监测的任务，删除任务也要删除任务绑定的爬虫 */
                if (!m.reserve && m.CreepBind) {
                    for (var c in m.CreepBind)
                        for (var cc of m.CreepBind[c].bind) {
                            if (Game.creeps[cc]) {
                                /* 删除任务也意味着初始化任务数据内存 */
                                Game.creeps[cc].memory.MissionData = {}
                            }
                        }
                }
                /* 删除任务*/
                var index = this.memory.Misson[range].indexOf(m)
                this.memory.Misson[range].splice(index, 1)
                if (global.getMission[this.name][id]) delete global.getMission[this.name][id];
                if (!isInArray(Memory.ignoreMissonName, m.name))
                    console.log(Colorful(`${m.name} 任务删除 xxx ID:${m.id} Room:${this.name}`, 'blue'))
                return true
            }
        }
        console.log(Colorful(`任务删除失败 ID:${id} Room:${this.name}`, 'red'))
        return false
    }

    /*新房快速起步模块*/
    public SpeedUpcontroller(): void {
        if ((Game.time - global.Gtime[this.name]) % 19) return
        if (!this.memory.switch.speedstate) return;
        if (this.controller.level > 6) {
            this.memory.switch.speedstate = false;
            this.memory.SpawnConfig['initial_speed'].num = 0
            return;
        }
    }

    /* 冷却计时器 */
    public CoolDownCaculator(): void {
        for (var i in this.memory.CoolDownDic) {
            if (this.memory.CoolDownDic[i] > 0)
                this.memory.CoolDownDic[i] -= 1
            else
                delete this.memory.CoolDownDic[i]
        }
    }
    /* 超时计时器 */
    public DelayCaculator(): void {
        for (var key in this.memory.Misson) {
            for (var i of this.memory.Misson[key]) {
                if (i.processing && i.delayTick < 99995)
                    i.delayTick--
                if (i.delayTick <= 0) {
                    /* 小于0就删除任务 */
                    this.DeleteMission(i.id)
                }
            }
        }
    }

    /* 任务解绑监测 */
    public UnbindMonitor(): void {
        /* 只适用于Creep任务 */
        if ((Game.time - global.Gtime[this.name]) % 5) return
        if (!this.memory.Misson['Creep']) return
        for (var m of this.memory.Misson['Creep']) {
            if (!m.CreepBind) continue
            if (m.CreepBind && Object.keys(m.CreepBind).length > 0) {
                for (var r in m.CreepBind) {
                    for (var c of m.CreepBind[r].bind)
                        if (!Game.creeps[c]) {
                            //console.log(`已经清除爬虫${c}的绑定数据!`)
                            var index = m.CreepBind[r].bind.indexOf(c)
                            m.CreepBind[r].bind.splice(index, 1)
                        }
                }
            }
        }
    }
    /* 任务数量查询 */
    public MissionNum(range: string, name: string): number {
        if (!this.memory.Misson) this.memory.Misson = {}
        if (!this.memory.Misson[range]) this.memory.Misson[range] = []
        let n = 0
        for (var i of this.memory.Misson[range]) {
            if (i.name == name) {
                n += 1
            }
        }
        return n
    }
    /* 与role相关的任务数量查询 */
    public RoleMissionNum(role: string, name: string): number {
        let Rolekey = `${role}|${name}|${this.memory.Misson['Creep'].length}`;
        if (!global.RoleMissionNum[this.name][Rolekey]) {
            let n = 0
            for (var i of this.memory.Misson['Creep']) {
                if (!i.CreepBind) continue
                if (i.name == name && isInArray(Object.keys(i.CreepBind), role)) {
                    n += 1
                }
            }
            global.RoleMissionNum[this.name][Rolekey] = n;
        }
        return global.RoleMissionNum[this.name][Rolekey]
    }

    /* 获取任务 */
    public GainMission(id: string): MissionModel | null {
        if (global.getMission[this.name][id]) return global.getMission[this.name][id];
        for (var i in this.memory.Misson) {
            for (var t of this.memory.Misson[i]) {
                if (t.id == id) {
                    global.getMission[this.name][id] = t;
                    return t
                }
            }
        }
        return null
    }

    /* 通过名称获取唯一任务 */
    public MissionName(range: string, name: string): MissionModel | null {
        for (var i of this.memory.Misson[range]) {
            if (i.name == name) {
                return i
            }
        }
        return null
    }

    /* 判断实验室资源类型是否一致 */
    public CheckLabType(id: string, rType: ResourceConstant): boolean {
        if (!this.memory.RoomLabBind) this.memory.RoomLabBind = {}
        for (var i in this.memory.RoomLabBind) {
            if (i == id) {
                var thisLab = Game.getObjectById(i as Id<StructureLab>) as StructureLab
                if (!thisLab) return false
                if (thisLab.mineralType && thisLab.mineralType != rType) {
                    return false
                }
                if (this.memory.RoomLabBind[i].rType != rType) return false
                return true
            }
        }
        return true
    }

    /* 判断是否允许新增 */
    public CheckLabOcc(id: string): boolean {
        if (!this.memory.RoomLabBind) this.memory.RoomLabBind = {}
        for (var i in this.memory.RoomLabBind) {
            if (i == id) {
                if (this.memory.RoomLabBind[i].occ) return false
                return true
            }
        }
        return true
    }

    /* 设置lab绑定数据 */
    public BindLabData(id: string, rType: ResourceConstant, MissonID: string, occ?: boolean): boolean {
        for (var i in this.memory.RoomLabBind) {
            if (i == id) {
                if (this.memory.RoomLabBind[i].rType != rType) return false
                if (!isInArray(this.memory.RoomLabBind[i].missonID, MissonID)) {
                    this.memory.RoomLabBind[i].missonID.push(MissonID)
                    return true
                }
            }
        }
        // 说明不存在该id
        this.memory.RoomLabBind[id] = { missonID: [MissonID], rType: rType, occ: occ ? occ : false }
        return true
    }

    /* 解绑lab绑定数据 */
    public UnBindLabData(id: string, MissonID: string): boolean {
        for (var i in this.memory.RoomLabBind) {
            if (i == id) {
                if (this.memory.RoomLabBind[i].missonID.length <= 1) {
                    if (!Memory.ignoreLab) {
                        console.log('LabID: ', i, '------解绑-------->MissonID: ', MissonID)
                    }
                    delete this.memory.RoomLabBind[i]
                    return true
                }
                else {
                    for (var j of this.memory.RoomLabBind[i].missonID) {
                        if (j == MissonID) {
                            if (!Memory.ignoreLab) {
                                console.log('LabID: ', i, '------解绑-------->MissonID: ', MissonID)
                            }
                            var index = this.memory.RoomLabBind[i].missonID.indexOf(MissonID)
                            this.memory.RoomLabBind[i].missonID.splice(index, 1)
                            return true
                        }
                    }
                    return false
                }
            }
        }
        return false
    }

    /* 任务所需角色孵化管理 */
    public MissonRoleSpawn(): void {
        if (!this.memory.Misson['Creep']) this.memory.Misson['Creep'] = []
        for (var misson of this.memory.Misson['Creep']) {
            if (misson.CreepBind) {
                for (var role in misson.CreepBind) {
                    let memData = {}
                    if (RoleData[role].mem) memData = RoleData[role].mem
                    /* 间隔型 */
                    if (misson.CreepBind[role].interval) {
                        if (misson.CreepBind[role].num <= 0) continue
                        if (misson.CreepBind[role].interval <= 0) continue
                        /* 如果是间隔孵化型的爬虫角色 */
                        if (!misson.Data) misson.Data = {}
                        if (!misson.Data.intervalTime) misson.Data.intervalTime = Game.time
                        if ((Game.time - misson.Data.intervalTime) % misson.CreepBind[role].interval == 0) {
                            /* 如果孵化队列里太多这种类型的爬虫就不孵化 最高允许10个 */
                            let n = 0
                            for (var ii of this.memory.SpawnList) {
                                if (ii.role == role) n += 1
                            }
                            if (n > 10) continue
                            memData["taskRB"] = misson.id
                            if (misson.CreepBind[role].MSB) {
                                memData["msb"] = true
                            }
                            for (let i = 0; i < misson.CreepBind[role].num; i++) {
                                this.SingleSpawn(role, RoleData[role].level ? RoleData[role].level : 10, memData)
                            }
                        }
                        continue
                    }
                    /* 补全型 */
                    if (this.memory.state == 'war' && !RoleData[role].must) continue    // 战争模式下非必要任务不运行
                    let spawnNum = misson.CreepBind[role].num - misson.CreepBind[role].bind.length
                    if (spawnNum > 0 && !this.memory.SpawnConfig[role] && misson.Data.disShard != Game) {
                        /* 如果任务没招到爬，检查一下是否空闲爬 */
                        let relateSpawnList = this.SpawnListRoleNum(role)
                        let relateCreeps = _.filter(Game.creeps, (creep) => creep.memory.belong == this.name && creep.memory.role == role && (!creep.memory.MissionData || !creep.memory.MissionData.id)).length
                        if (relateSpawnList + relateCreeps < spawnNum) {
                            if (misson.CreepBind[role].MSB) {
                                memData["msb"] = true
                                memData["taskRB"] = misson.id
                            }
                            this.SingleSpawn(role, RoleData[role].level ? RoleData[role].level : 10, memData)
                        }
                    }
                }
            }
        }
    }

    /* 判断lab的boost搬运模块 */
    public Check_Lab(misson: MissionModel, role: string, tankType: 'storage' | 'terminal' | 'complex'): boolean {
        if (!misson.LabBind) return true
        var tank_: StructureStorage | StructureTerminal
        if (tankType == 'storage') {
            if (!this.storage) return false
            tank_ = this.storage
        }
        else if (tankType == 'terminal') {
            if (!this.terminal) return false
            tank_ = this.terminal
        }
        // console.log(this.name, '填充检测', tankType)
        // var tank_ = Game.getObjectById(id as Id<Structure>) as StructureStorage | StructureTerminal
        /* 负责lab的填充 */
        var terminal = this.terminal as StructureTerminal
        var storage = this.storage as StructureStorage
        let return_state = true;
        let _DispatchNum = DispatchNum(this.name);
        for (var i in misson.LabBind) {
            var All_i_Num: number
            if (tankType == 'complex') {
                if (!terminal || !storage) {
                    if (storage) tank_ = storage
                    else if (terminal) tank_ = terminal
                    else return false
                }
                else {
                    var terminalNum = terminal ? terminal.store.getUsedCapacity(misson.LabBind[i] as ResourceConstant) : 0
                    var storageNum = storage ? storage.store.getUsedCapacity(misson.LabBind[i] as ResourceConstant) : 0
                    tank_ = terminalNum > storageNum ? terminal : storage
                }
            }
            if (!tank_) return false
            All_i_Num = tank_.store.getUsedCapacity(misson.LabBind[i] as ResourceConstant)
            if (All_i_Num < 4100) {
                /* 资源调度 */
                if (_DispatchNum <= 0 && this.MissionNum('Structure', '资源购买') <= 0 && !checkSend(this.name, misson.LabBind[i] as ResourceConstant)) {
                    console.log(Colorful(`[资源调度] 房间${this.name}没有足够的资源[${misson.LabBind[i] as ResourceConstant}],将执行资源调度!`, 'yellow'))
                    let dispatchTask: RDData = {
                        sourceRoom: this.name,
                        rType: misson.LabBind[i] as ResourceConstant,
                        num: 3000,
                        delayTick: 200,
                        conditionTick: 20,
                        buy: true,
                        mtype: 'deal'
                    }
                    Memory.ResourceDispatchData.push(dispatchTask)
                }
                return_state = false;
                continue;
            }
            var disLab = Game.getObjectById(i as Id<StructureLab>) as StructureLab
            if (!disLab) // 说明找不到lab了
            {
                let index = this.memory.StructureIdData.labs.indexOf(i)
                this.memory.StructureIdData.labs.splice(index, 1)
                return_state = false;
                continue;
            }
            // 去除无关资源
            if (disLab.mineralType && disLab.mineralType != misson.LabBind[i]) {
                var roleData: BindData = {}
                roleData[role] = { num: 1, bind: [] }
                var carryTask = this.public_Carry(roleData, 45, this.name, disLab.pos.x, disLab.pos.y, this.name, this.storage.pos.x, this.storage.pos.y, disLab.mineralType, disLab.store.getUsedCapacity(disLab.mineralType))
                this.AddMission(carryTask)
                // return_state = false;
                continue;
            }
            if (disLab.store.getUsedCapacity(misson.LabBind[i] as ResourceConstant) < 1800 && this.Check_Carry('transport', tank_.pos, disLab.pos, misson.LabBind[i] as ResourceConstant)) {
                if (All_i_Num < 1000) continue;
                var roleData: BindData = {}
                roleData[role] = { num: 1, bind: [] }
                var carryTask = this.public_Carry(roleData, 45, this.name, tank_.pos.x, tank_.pos.y, this.name, disLab.pos.x, disLab.pos.y, misson.LabBind[i] as ResourceConstant, All_i_Num >= 2000 ? 2000 : All_i_Num)
                this.AddMission(carryTask)
                return_state = false;
                continue;
            }
        }
        return return_state
    }

    /* 判断已经有了该类型的搬运任务 true:代表没有重复， false代表有 */
    public Check_Carry(role: string, source: RoomPosition, pos: RoomPosition, rType?: ResourceConstant): boolean {
        for (let i of this.memory.Misson['Creep']) {
            if (!i.CreepBind) continue
            if (i.name != '物流运输') continue
            if (i.CreepBind[role] && (rType ? i.Data.rType == rType : true)) {
                let sourcePos = new RoomPosition(i.Data.sourcePosX, i.Data.sourcePosY, i.Data.sourceRoom)
                let disPos = new RoomPosition(i.Data.targetPosX, i.Data.targetPosY, i.Data.targetRoom)
                if (sourcePos.isEqualTo(source) && disPos.isEqualTo(pos)) return false
            }
        }
        return true
    }

    /* 判断是否已经有了该类型的link任务 true:代表没有重复 false代表有 */
    public Check_Link(source: RoomPosition, po: RoomPosition): boolean {
        let sourceLink = source.GetStructure('link')
        let posLink = po.GetStructure('link')
        if (!sourceLink || !posLink) { console.log(`${this.name}出现check_link错误!`); return false }
        for (let i of this.memory.Misson['Structure']) {
            if (i.name == "链传送能" && isInArray(i.structure, sourceLink.id) && i.Data.disStructure == posLink.id) {
                return false
            }
        }
        return true
    }

    // 判断房间是否存在资源购买指定资源的任务
    public Check_Buy(resource: ResourceConstant): boolean {
        for (let i of this.memory.Misson['Structure']) {
            if (i.name == '资源购买' && i.Data.rType == resource) return true
        }
        return false
    }

    public Check_ResourceType(rType: ResourceConstant, Num: number): boolean {
        if (Object.keys(global.RoomResource).length < 1) {
            for (let Roomname in Game.rooms) {
                let _RoomData = Game.rooms[Roomname]
                if (!global.RoomResource[_RoomData.name]) { global.RoomResource[_RoomData.name] = {} }
                if (_RoomData.storage) {
                    global.RoomResource[_RoomData.name] = _RoomData.storage.store
                }
            }
        }
        /*开始类型检索操作*/
        for (let Roomname in global.RoomResource) {
            let _RoomData = global.RoomResource[Roomname]
            let rTypeNum = _RoomData[rType];
            if (!rTypeNum) continue;

            /*标记rType 查询保存量*/
            var basic_num = 0;
            if (this.name != Roomname) {
                basic_num = 8000;
                if (isInArray(t3, rType)) { basic_num = 8000 }
                else if (isInArray(['X', 'L', 'Z', 'U', 'K', 'O', 'H', 'ops'], rType)) { basic_num = 15000 }
                else if (isInArray(['composite', 'crystal', 'liquid'
                    , 'switch', 'transistor', 'microchip', 'circuit', 'device'
                    , 'phlegm', 'tissue', 'muscle', 'organoid', 'organism'
                    , 'tube', 'fixtures', 'frame', 'hydraulics', 'machine'
                    , 'concentrate', 'extract', 'spirit', 'emanation', 'essence'], rType)) { basic_num = 0 }

                if (global.ResourceLimit[Roomname]) {
                    if (global.ResourceLimit[Roomname][rType]) {
                        basic_num = global.ResourceLimit[Roomname][rType];
                    }
                }
            }
            if (rTypeNum && rTypeNum - basic_num >= Num) {
                return true
            }
        }
        return false;
    }


    public GetStructData(build: string): Structure {
        if (isInArray(['powerspawn', 'factory', 'Ntower', 'Atower'], build)) {

            switch (build) {
                case 'powerspawn':
                    let powerspawn_data = this.getStructure(STRUCTURE_POWER_SPAWN)
                    if (powerspawn_data) return powerspawn_data[0];
                    break;
                case 'factory':
                    let factory_data = this.getStructure(STRUCTURE_FACTORY)
                    if (factory_data) return factory_data[0];
                    break;
                case 'Ntower':
                    break;
                case 'Atower':
                    break;
            }
        }
        return null;
    }
}