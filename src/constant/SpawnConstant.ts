interface SpawnConstantData  {
    [role:string]:{
        num:number,         // 默认数量
        ability:number[],   // 默认body个数 [work,carry,move,attack,ranged_attack,heal,claim,tough] 总数别超过50
        adaption?:boolean,  // 是否自适应
        must?:boolean,      // 是否无论战争还是和平都得孵化
        level?:number,      // 孵化优先级
        mark:string         // 每种爬虫的代号，必须有代号
    }
}

export const RoleData:SpawnConstantData = {
    'harvest':{num:3,ability:[1,1,2,0,0,0,0,0],adaption:true,level:5,mark:"工"},
}