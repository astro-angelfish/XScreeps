/* 跨shard传输数据的JSON格式规范 */
interface InterShardMemory {

}

// 跨shard的request请求数据类型
interface RequestData {
  relateShard: string
  sourceShard: string
  data: any
  type: number
}

/* 存放全局声明 */
declare namespace NodeJS {
  interface Global {
    intershardData: any
  }
}
