import {
  FeeAmountEnabled as FeeAmountEnabledEvent,
  OwnerChanged as OwnerChangedEvent,
  PoolCreated as PoolCreatedEvent
} from "../generated/UniswapV3Factory/UniswapV3Factory"
import {
  FeeAmountEnabled,
  OwnerChanged,
  PoolCreated
} from "../generated/schema"

export function handleFeeAmountEnabled(event: FeeAmountEnabledEvent): void {
  let entity = new FeeAmountEnabled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.fee = event.params.fee
  entity.tickSpacing = event.params.tickSpacing

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnerChanged(event: OwnerChangedEvent): void {
  let entity = new OwnerChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldOwner = event.params.oldOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePoolCreated(event: PoolCreatedEvent): void {
  let entity = new PoolCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token0 = event.params.token0
  entity.token1 = event.params.token1
  entity.fee = event.params.fee
  entity.tickSpacing = event.params.tickSpacing
  entity.pool = event.params.pool

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
