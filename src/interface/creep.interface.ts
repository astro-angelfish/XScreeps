/* 爬虫常用类型及定义 */
interface Creep {

}

interface CreepMemory {
    dontPullMe: boolean
    belong: string      // 爬虫所属房间
    shard: string       // 爬虫所属shard
    role: string        // 爬虫角色
    working: boolean
    /* 每个爬虫都必须有该记忆，方便boost */
    boostData: BoostData
    /* 目标Id */
    targetID?: string
    enemyID?: string //附近敌人id
    containerID?: string
    adaption?: boolean
    taskRB?: string
    msb?: boolean,
    boostState?: boolean,//boost强化状态
    notifyWhenAttacked?: boolean,
    // 爬说话
    sayHi?: SayHi,
    // 初始身体部件统计
    bodyPartCount?: {
        [bodyType in BodyPartConstant]?: number
    },
    Rerunt?:number/*爬的重启时间*/
}

interface BoostData {
    [body: string]: Boosted
}
interface Boosted {
    boosted?: boolean
    type?: ResourceConstant
    num?: number
}
interface SayHi {
    state: stateType,
    saying: string,
    canSay?: boolean | undefined,
    yuanshenName?: string,
    lastIndex?: number
}