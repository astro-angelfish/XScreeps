// part 生成优先级，越往前越优先
const bodyPartOrder = [TOUGH, WORK, ATTACK, RANGED_ATTACK, CARRY, CLAIM, MOVE, HEAL]
export type BodyParam = Partial<Record<BodyPartConstant, number>>
/**
 * 生成爬虫指定体型
 */
export function generateBody(bodyParam: BodyParam): BodyPartConstant[] {
  const body: BodyPartConstant[] = []
  for (const part of bodyPartOrder) {
    if (part in bodyParam) {
      for (let i = 0; i < bodyParam[part]!; i++)
        body.push(part)
    }
  }
  return body
}

/**
 * 计算孵化所需能量\
 * 数据来自 `BODYPART_COST`
 */
export function getBodyEnergyCost(body: BodyPartConstant[]): number {
  return body.reduce((sum, part) => sum + BODYPART_COST[part], 0)
}

/**
 * 用于对 BodyParam 进行自适应化，使得爬虫房间能生产该爬虫\
 * 具体逻辑为寻找该 bodypart 中数量最多的，对其进行减法运算，直到达到目的，但数量到1时将不再减少\
 */
export function reduceBodyUntilFit(body: BodyParam, targetEN: number): {
  param: BodyParam
  parts: BodyPartConstant[]
  cost: number
  modified: boolean
} {
  const body_ = { ...body }
  const parts = Object.keys(body_) as BodyPartConstant[]

  const arr = generateBody(body_)
  let currentEN = getBodyEnergyCost(arr)
  if (currentEN <= targetEN)
    return { param: body_, parts: arr, cost: currentEN, modified: false }

  while (currentEN > targetEN) {
    if (targetEN <= 100)
      break

    // 获取个数最多的部件名
    const maxPart = parts.reduce((most, part) => body_[part]! > body_[most]! ? part : most, parts[0])

    body_[maxPart]!--
    currentEN -= BODYPART_COST[maxPart]
  }

  return { param: body_, parts: generateBody(body_), cost: currentEN, modified: true }
}
