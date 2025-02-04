import {
  FeeAmountEnabled as FeeAmountEnabledEvent,
  OwnerChanged as OwnerChangedEvent,
  PoolCreated as PoolCreatedEvent,
} from '../generated/UniswapV3Factory/UniswapV3Factory';
import { UniswapV3Pool } from '../generated/UniswapV3Factory/UniswapV3Pool';
import { ERC20 } from '../generated/UniswapV3Factory/ERC20';
import { ERC20NameBytes } from '../generated/UniswapV3Factory/ERC20NameBytes';
import { ERC20SymbolBytes } from '../generated/UniswapV3Factory/ERC20SymbolBytes';
import { NonfungiblePositionManager } from '../generated/UniswapV3Factory/NonfungiblePositionManager';
import { UniswapV3Factory } from '../generated/UniswapV3Factory/UniswapV3Factory';

import { UniswapV3Pool as PoolTemplate } from '../generated/templates';
import {
  FeeAmountEnabled,
  OwnerChanged,
  PoolCreated,
} from '../generated/schema';

export function handleFeeAmountEnabled(event: FeeAmountEnabledEvent): void {
  let entity = new FeeAmountEnabled(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.fee = event.params.fee;
  entity.tickSpacing = event.params.tickSpacing;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOwnerChanged(event: OwnerChangedEvent): void {
  let entity = new OwnerChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.oldOwner = event.params.oldOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePoolCreated(event: PoolCreatedEvent): void {
  let entity = new PoolCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.token0 = event.params.token0;
  entity.token1 = event.params.token1;
  entity.fee = event.params.fee;
  entity.tickSpacing = event.params.tickSpacing;
  entity.pool = event.params.pool;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.transactionFrom = event.transaction.from;
  entity.logIndex = event.logIndex;
  entity.transactionGasPrice = event.transaction.gasPrice;

  PoolTemplate.create(event.params.pool);

  entity.save();
}
