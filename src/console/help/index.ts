import { assign } from 'lodash'
import extension from './alias'

// 挂载全局拓展
export default function () {
  // 挂载有别名的操作
  for (const item of extension)
    Object.defineProperty(global, item.alias, { get: item.exec })

  // 挂载没有别名的操作
  assign(global, extension)
}
