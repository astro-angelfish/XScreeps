interface SpawnConstantData  {
    [role:string]:{
        num:number,         // 默认数量
        ability:number[],   // 默认body个数 [work,carry,move,attack,ranged_attack,heal,claim,tough] 总数别超过50
        adaption?:boolean,  // 是否自适应
        must?:boolean,      // 是否无论战争还是和平都得孵化
        level?:number,      // 孵化优先级
        mark?:string         // 每种爬虫的代号，必须有代号
        init?:boolean        // 是否加入memory初始化
        fun?:()=>void        // 是否有固定函数 【即不接任务】
        mem?:SpawnMemory            // 是否有额外记忆
    }
}


/* 爬虫信息列表 */
export const RoleData:SpawnConstantData = {
    'harvest':{num:0,ability:[1,1,2,0,0,0,0,0],adaption:true,level:5,mark:"矿",init:true},  // 矿点采集工
    'carry':{num:0,ability:[0,3,3,0,0,0,0,0],level:6,mark:"运",init:true},  // 矿点搬运工
    'upgrade':{num:0,ability:[1,1,2,0,0,0,0,0],level:10,mark:"升",init:true},   // 升级工
}

/* 爬虫部件随房间等级变化的动态列表 */
export const RoleLevelData = {
    'harvest':{
        1:{bodypart:[1,1,1,0,0,0,0,0],num:2},
        2:{bodypart:[2,1,2,0,0,0,0,0],num:2},
        3:{bodypart:[3,2,3,0,0,0,0,0],num:2},
        4:{bodypart:[4,2,4,0,0,0,0,0],num:2},
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
        6:{bodypart:[0,2,2,0,0,0,0,0],num:2},
        7:{bodypart:[0,2,2,0,0,0,0,0],num:2},
        8:{bodypart:[0,2,2,0,0,0,0,0],num:2},
    },
    'upgrade':{
        1:{bodypart:[1,1,2,0,0,0,0,0],num:4},
        2:{bodypart:[2,1,3,0,0,0,0,0],num:3},
        3:{bodypart:[3,2,5,0,0,0,0,0],num:2},
        4:{bodypart:[4,4,4,0,0,0,0,0],num:2},
        5:{bodypart:[4,4,4,0,0,0,0,0],num:2},
        6:{bodypart:[5,2,5,0,0,0,0,0],num:2},
        7:{bodypart:[10,2,10,0,0,0,0,0],num:2},
        8:{bodypart:[15,3,15,0,0,0,0,0],num:1},
    },
}