import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  Collect as CollectEvent,
  DecreaseLiquidity as DecreaseLiquidityEvent,
  IncreaseLiquidity as IncreaseLiquidityEvent,
  Transfer as TransferEvent,
} from '../generated/NonfungiblePositionManager/NonfungiblePositionManager';
import {
  Approval,
  ApprovalForAll,
  NonfungiblePositionManagerCollect as Collect,
  DecreaseLiquidity,
  IncreaseLiquidity,
  Transfer,
} from '../generated/schema';

import { UniswapV3Pool } from '../generated/UniswapV3Factory/UniswapV3Pool';
import { ERC20 } from '../generated/UniswapV3Factory/ERC20';
import { ERC20NameBytes } from '../generated/UniswapV3Factory/ERC20NameBytes';
import { ERC20SymbolBytes } from '../generated/UniswapV3Factory/ERC20SymbolBytes';
import { NonfungiblePositionManager } from '../generated/UniswapV3Factory/NonfungiblePositionManager';
import { UniswapV3Factory } from '../generated/UniswapV3Factory/UniswapV3Factory';


export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.owner = event.params.owner;
  entity.approved = event.params.approved;
  entity.tokenId = event.params.tokenId;

  entity.address = event.address;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.transactionFrom = event.transaction.from;
  entity.logIndex = event.logIndex;
  entity.transactionGasPrice = event.transaction.gasPrice;

  entity.save();
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.owner = event.params.owner;
  entity.operator = event.params.operator;
  entity.approved = event.params.approved;

  entity.address = event.address;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.transactionFrom = event.transaction.from;
  entity.logIndex = event.logIndex;
  entity.transactionGasPrice = event.transaction.gasPrice;

  entity.save();
}

export function handleCollect(event: CollectEvent): void {
  let entity = new Collect(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.tokenId = event.params.tokenId;
  entity.recipient = event.params.recipient;
  entity.amount0 = event.params.amount0;
  entity.amount1 = event.params.amount1;

  entity.address = event.address;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.transactionFrom = event.transaction.from;
  entity.logIndex = event.logIndex;
  entity.transactionGasPrice = event.transaction.gasPrice;

  entity.save();
}

export function handleDecreaseLiquidity(event: DecreaseLiquidityEvent): void {
  let entity = new DecreaseLiquidity(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.tokenId = event.params.tokenId;
  entity.liquidity = event.params.liquidity;
  entity.amount0 = event.params.amount0;
  entity.amount1 = event.params.amount1;

  entity.address = event.address;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.transactionFrom = event.transaction.from;
  entity.logIndex = event.logIndex;
  entity.transactionGasPrice = event.transaction.gasPrice;

  entity.save();
}

export function handleIncreaseLiquidity(event: IncreaseLiquidityEvent): void {
  let entity = new IncreaseLiquidity(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.tokenId = event.params.tokenId;
  entity.liquidity = event.params.liquidity;
  entity.amount0 = event.params.amount0;
  entity.amount1 = event.params.amount1;

  entity.address = event.address;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.transactionFrom = event.transaction.from;
  entity.logIndex = event.logIndex;
  entity.transactionGasPrice = event.transaction.gasPrice;

  entity.save();
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.tokenId = event.params.tokenId;

  entity.address = event.address;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.transactionFrom = event.transaction.from;
  entity.logIndex = event.logIndex;
  entity.transactionGasPrice = event.transaction.gasPrice;

  entity.save();
}
