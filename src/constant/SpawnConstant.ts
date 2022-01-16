import { build_, carry_, harvest_, upgrade_ } from "@/module/fun/role"

interface SpawnConstantData  {
    [role:string]:{
        num:number,         // 默认数量
        ability:number[],   // 默认body个数 [work,carry,move,attack,ranged_attack,heal,claim,tough] 总数别超过50
        adaption?:boolean,  // 是否自适应
        must?:boolean,      // 是否无论战争还是和平都得孵化
        level?:number,      // 孵化优先级
        mark?:string         // 每种爬虫的代号，必须有代号
        init?:boolean        // 是否加入memory初始化
        fun?:(creep:Creep)=>void        // 是否有固定函数 【即不接任务】
        mem?:SpawnMemory            // 是否有额外记忆
    }
}


/* 爬虫信息列表 */
export const RoleData:SpawnConstantData = {
    'harvest':{num:0,ability:[1,1,2,0,0,0,0,0],adaption:true,level:5,mark:"矿",init:true,fun:harvest_},  // 矿点采集工
    'carry':{num:0,ability:[0,3,3,0,0,0,0,0],level:6,mark:"矿",init:true,adaption:true,fun:carry_},  // 矿点搬运工
    'upgrade':{num:0,ability:[1,1,2,0,0,0,0,0],level:10,mark:"升",init:true,fun:upgrade_},   // 升级工
    'build':{num:0,ability:[1,1,2,0,0,0,0,0],level:10,mark:"建",init:true,fun:build_},   // 建筑工
    'manage':{num:0,ability:[0,1,1,0,0,0,0,0],level:2,mark:"中",init:true,must:true,adaption:true},   // 中央搬运工
    'transport':{num:0,ability:[0,2,2,0,0,0,0,0],level:1,mark:"运",init:true,must:true,adaption:true},  // 房间物流搬运工
    'repair':{num:0,ability:[1,1,1,0,0,0,0,0],level:2,mark:"维",must:true}
}

/* 爬虫部件随房间等级变化的动态列表 */
export const RoleLevelData = {
    'harvest':{
        1:{bodypart:[2,1,1,0,0,0,0,0],num:2},
        2:{bodypart:[3,1,2,0,0,0,0,0],num:2},
        3:{bodypart:[4,2,2,0,0,0,0,0],num:2},
        4:{bodypart:[5,2,5,0,0,0,0,0],num:2},
        5:{bodypart:[5,2,5,0,0,0,0,0],num:2},
        6:{bodypart:[5,2,5,0,0,0,0,0],num:2},
        7:{bodypart:[6,2,6,0,0,0,0,0],num:2},
        8:{bodypart:[8,2,8,0,0,0,0,0],num:2},
    },
    'carry':{
        1:{bodypart:[0,2,2,0,0,0,0,0],num:2},
        2:{bodypart:[0,3,3,0,0,0,0,0],num:2},
        3:{bodypart:[0,4,4,0,0,0,0,0],num:2},
        4:{bodypart:[0,6,6,0,0,0,0,0],num:2},
        5:{bodypart:[0,2,2,0,0,0,0,0],num:2},
        6:{bodypart:[0,2,2,0,0,0,0,0],num:0},
        7:{bodypart:[0,2,2,0,0,0,0,0],num:0},
        8:{bodypart:[0,2,2,0,0,0,0,0],num:0},
    },
    'upgrade':{
        1:{bodypart:[1,1,2,0,0,0,0,0],num:4},
        2:{bodypart:[2,2,4,0,0,0,0,0],num:3},
        3:{bodypart:[3,3,6,0,0,0,0,0],num:3},
        4:{bodypart:[4,4,8,0,0,0,0,0],num:2},
        5:{bodypart:[4,4,8,0,0,0,0,0],num:2},
        6:{bodypart:[5,2,5,0,0,0,0,0],num:2},
        7:{bodypart:[10,2,10,0,0,0,0,0],num:2},
        8:{bodypart:[15,3,15,0,0,0,0,0],num:1},
    },    
    'build':{
        1:{bodypart:[1,1,2,0,0,0,0,0],num:1},
        2:{bodypart:[2,2,4,0,0,0,0,0],num:1},
        3:{bodypart:[3,3,6,0,0,0,0,0],num:1},
        4:{bodypart:[4,4,8,0,0,0,0,0],num:1},
        5:{bodypart:[4,4,8,0,0,0,0,0],num:0},
        6:{bodypart:[5,5,10,0,0,0,0,0],num:0},
        7:{bodypart:[6,6,12,0,0,0,0,0],num:0},
        8:{bodypart:[8,8,16,0,0,0,0,0],num:0},
    },
    'transport':{
        1:{bodypart:[0,1,1,0,0,0,0,0],num:0},
        2:{bodypart:[0,1,1,0,0,0,0,0],num:0},
        3:{bodypart:[0,2,2,0,0,0,0,0],num:0},
        4:{bodypart:[0,2,2,0,0,0,0,0],num:1},
        5:{bodypart:[0,4,4,0,0,0,0,0],num:1},
        6:{bodypart:[0,10,10,0,0,0,0,0],num:1},
        7:{bodypart:[0,20,20,0,0,0,0,0],num:1},
        8:{bodypart:[0,24,24,0,0,0,0,0],num:1},
    },
    'manage':{
        1:{bodypart:[0,1,1,0,0,0,0,0],num:0},
        2:{bodypart:[0,1,1,0,0,0,0,0],num:0},
        3:{bodypart:[0,2,2,0,0,0,0,0],num:0},
        4:{bodypart:[0,2,2,0,0,0,0,0],num:1},
        5:{bodypart:[0,10,5,0,0,0,0,0],num:1},
        6:{bodypart:[0,15,5,0,0,0,0,0],num:1},
        7:{bodypart:[0,20,10,0,0,0,0,0],num:1},
        8:{bodypart:[0,32,16,0,0,0,0,0],num:1},
    },
    'repair':{
        1:{bodypart:[1,1,2,0,0,0,0,0],num:0},
        2:{bodypart:[1,1,2,0,0,0,0,0],num:0},
        3:{bodypart:[2,2,4,0,0,0,0,0],num:0},
        4:{bodypart:[2,2,4,0,0,0,0,0],num:0},
        5:{bodypart:[3,3,3,0,0,0,0,0],num:0},
        6:{bodypart:[6,6,6,0,0,0,0,0],num:0},
        7:{bodypart:[10,10,10,0,0,0,0,0],num:0},
        8:{bodypart:[15,20,15,0,0,0,0,0],num:0},
    },

}