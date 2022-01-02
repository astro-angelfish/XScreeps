/* 爬虫常用类型及定义 */
interface Creep {

}

interface CreepMemory {
    belong: string      // 爬虫所属房间
    shard: string       // 爬虫所属shard
    role: string        // 爬虫角色
}