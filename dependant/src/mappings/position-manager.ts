/* eslint-disable prefer-const */
import {
  Collect,
  DecreaseLiquidity,
  IncreaseLiquidity,
  NonfungiblePositionManager,
  Transfer,
} from '../../generated/NonfungiblePositionManager/NonfungiblePositionManager';
import {
  Bundle,
  DecreaseEvent,
  IncreaseEvent,
  Position,
  PositionSnapshot,
  Token,
} from '../../generated/schema';
import { ADDRESS_ZERO, factoryContract, ZERO_BD, ZERO_BI } from '../constants';
import {
  Address,
  BigInt,
  Bytes,
  Entity,
  ethereum,
} from '@graphprotocol/graph-ts';
import { convertTokenToDecimal, loadTransaction } from '../utils';
import { EntityOp, EntityTrigger } from '../utils/entityTrigger';

function getPosition(entity: Entity, tokenId: BigInt): Position | null {
  let addressParam = Address.fromBytes(entity.getBytes('address'));
  let position = Position.load(tokenId.toString());
  if (position === null) {
    let contract = NonfungiblePositionManager.bind(addressParam);
    let positionCall = contract.try_positions(tokenId);

    // the following call reverts in situations where the position is minted
    // and deleted in the same block - from my investigation this happens
    // in calls from  BancorSwap
    // (e.g. 0xf7867fa19aa65298fadb8d4f72d0daed5e836f3ba01f0b9b9631cdc6c36bed40)
    if (!positionCall.reverted) {
      let positionResult = positionCall.value;
      let poolAddress = factoryContract.getPool(
        positionResult.value2,
        positionResult.value3,
        positionResult.value4,
      );

      position = new Position(tokenId.toString());
      // The owner gets correctly updated in the Transfer handler
      position.owner = Address.fromString(ADDRESS_ZERO);
      position.pool = poolAddress.toHexString();
      position.token0 = positionResult.value2.toHexString();
      position.token1 = positionResult.value3.toHexString();
      position.tickLower = position.pool
        .concat('#')
        .concat(positionResult.value5.toString());
      position.tickUpper = position.pool
        .concat('#')
        .concat(positionResult.value6.toString());
      position.liquidity = ZERO_BI;
      position.depositedToken0 = ZERO_BD;
      position.depositedToken1 = ZERO_BD;
      position.withdrawnToken0 = ZERO_BD;
      position.withdrawnToken1 = ZERO_BD;
      position.collectedToken0 = ZERO_BD;
      position.collectedToken1 = ZERO_BD;
      position.collectedFeesToken0 = ZERO_BD;
      position.collectedFeesToken1 = ZERO_BD;
      position.transaction = loadTransaction(entity).id;
      position.feeGrowthInside0LastX128 = positionResult.value8;
      position.feeGrowthInside1LastX128 = positionResult.value9;

      position.amountDepositedUSD = ZERO_BD;
      position.amountWithdrawnUSD = ZERO_BD;
      position.amountCollectedUSD = ZERO_BD;
    }
  }

  return position;
}

function updateFeeVars(
  position: Position,
  entity: Entity,
  tokenId: BigInt,
): Position {
  let address = Address.fromBytes(entity.getBytes('address'));
  let positionManagerContract = NonfungiblePositionManager.bind(address);
  let positionResult = positionManagerContract.try_positions(tokenId);
  if (!positionResult.reverted) {
    position.feeGrowthInside0LastX128 = positionResult.value.value8;
    position.feeGrowthInside1LastX128 = positionResult.value.value9;
  }
  return position;
}

function savePositionSnapshot(position: Position, entity: Entity): void {
  let blockNumberParam = entity.getBigInt('blockNumber');
  let blockTimestampParam = entity.getBigInt('blockTimestamp');

  let positionSnapshot = new PositionSnapshot(
    position.id.concat('#').concat(blockNumberParam.toString()),
  );
  positionSnapshot.owner = position.owner;
  positionSnapshot.pool = position.pool;
  positionSnapshot.position = position.id;
  positionSnapshot.blockNumber = blockNumberParam;
  positionSnapshot.timestamp = blockTimestampParam;
  positionSnapshot.liquidity = position.liquidity;
  positionSnapshot.depositedToken0 = position.depositedToken0;
  positionSnapshot.depositedToken1 = position.depositedToken1;
  positionSnapshot.withdrawnToken0 = position.withdrawnToken0;
  positionSnapshot.withdrawnToken1 = position.withdrawnToken1;
  positionSnapshot.collectedFeesToken0 = position.collectedFeesToken0;
  positionSnapshot.collectedFeesToken1 = position.collectedFeesToken1;
  positionSnapshot.transaction = loadTransaction(entity).id;
  positionSnapshot.feeGrowthInside0LastX128 = position.feeGrowthInside0LastX128;
  positionSnapshot.feeGrowthInside1LastX128 = position.feeGrowthInside1LastX128;
  positionSnapshot.save();
}

export function handleIncreaseLiquidity(event: EntityTrigger): void {
  if (event.entityOp === EntityOp.Create) {
    let entity = event.entity;
    let blockNumberParam = entity.getBigInt('blockNumber');
    let blockTimestampParam = entity.getBigInt('blockTimestamp');
    let tokenIdParam = entity.getBigInt('tokenId');
    let transactionHashParam = entity.getBytes('transactionHash');
    let logIndexParam = entity.getBigInt('logIndex');
    let amount0Param = entity.getBigInt('amount0');
    let amount1Param = entity.getBigInt('amount1');
    let liquidityParam = entity.getBigInt('liquidity');
    let ownerParam = entity.getBytes('owner');
    let position = getPosition(entity, tokenIdParam);
    // position was not able to be fetched
    if (position == null) {
      return;
    }

    const tx = loadTransaction(entity);
    const increase = new IncreaseEvent(
      transactionHashParam
        .toHexString()
        .concat(':')
        .concat(logIndexParam.toString()),
    );
    increase.transaction = tx.id;
    increase.timeStamp = blockTimestampParam;
    increase.amount0 = amount0Param;
    increase.amount1 = amount1Param;
    increase.pool = position.pool;
    increase.token0 = position.token0;
    increase.token1 = position.token1;
    increase.position = position.id;
    increase.tokenID = tokenIdParam;
    increase.save();

    let bundle = Bundle.load('1') as Bundle;

    let token0 = Token.load(position.token0) as Token;
    let token1 = Token.load(position.token1) as Token;

    let amount0 = convertTokenToDecimal(amount0Param, token0.decimals);
    let amount1 = convertTokenToDecimal(amount1Param, token1.decimals);

    position.liquidity = position.liquidity.plus(liquidityParam);
    position.depositedToken0 = position.depositedToken0.plus(amount0);
    position.depositedToken1 = position.depositedToken1.plus(amount1);

    let newDepositUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)));
    position.amountDepositedUSD = position.amountDepositedUSD.plus(
      newDepositUSD,
    );

    updateFeeVars(position, entity, tokenIdParam);

    position.save();

    savePositionSnapshot(position, entity);
  }
}

export function handleDecreaseLiquidity(event: EntityTrigger): void {
  if (event.entityOp === EntityOp.Create) {
    let entity = event.entity;
    let tokenIdParam = entity.getBigInt('tokenId');
    let transactionHashParam = entity.getBytes('transactionHash');
    let logIndexParam = entity.getBigInt('logIndex');
    let amount0Param = entity.getBigInt('amount0');
    let amount1Param = entity.getBigInt('amount1');
    let blockTimestampParam = entity.getBigInt('blockTimestamp');
    let liquidityParam = entity.getBigInt('liquidity');

    let position = getPosition(entity, tokenIdParam);

    // position was not able to be fetched
    if (position == null) {
      return;
    }

    const tx = loadTransaction(entity);
    const decrease = new DecreaseEvent(
      transactionHashParam
        .toHexString()
        .concat(':')
        .concat(logIndexParam.toString()),
    );
    decrease.transaction = tx.id;
    decrease.timeStamp = blockTimestampParam;
    decrease.amount0 = amount0Param;
    decrease.amount1 = amount1Param;
    decrease.pool = position.pool;
    decrease.token0 = position.token0;
    decrease.token1 = position.token1;
    decrease.position = position.id;
    decrease.tokenID = tokenIdParam;
    decrease.save();

    let bundle = Bundle.load('1') as Bundle;

    let token0 = Token.load(position.token0) as Token;
    let token1 = Token.load(position.token1) as Token;
    let amount0 = convertTokenToDecimal(amount0Param, token0.decimals);
    let amount1 = convertTokenToDecimal(amount1Param, token1.decimals);

    position.liquidity = position.liquidity.minus(liquidityParam);
    position.withdrawnToken0 = position.withdrawnToken0.plus(amount0);
    position.withdrawnToken1 = position.withdrawnToken1.plus(amount1);

    let newWithdrawUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)));
    position.amountWithdrawnUSD = position.amountWithdrawnUSD.plus(
      newWithdrawUSD,
    );

    position = updateFeeVars(position, entity, tokenIdParam);
    position.save();
    savePositionSnapshot(position, entity);
  }
}

export function handleCollect(event: EntityTrigger): void {
  if (event.entityOp === EntityOp.Create) {
    let entity = event.entity;
    let tokenIdParam = entity.getBigInt('tokenId');
    let transactionHashParam = entity.getBytes('transactionHash');
    let logIndexParam = entity.getBigInt('logIndex');
    let amount0Param = entity.getBigInt('amount0');
    let amount1Param = entity.getBigInt('amount1');
    let blockTimestampParam = entity.getBigInt('blockTimestamp');
    let liquidityParam = entity.getBigInt('liquidity');

    let position = getPosition(entity, tokenIdParam);
    // position was not able to be fetched
    if (position == null) {
      return;
    }

    let bundle = Bundle.load('1') as Bundle;
    let token0 = Token.load(position.token0) as Token;
    let token1 = Token.load(position.token1) as Token;
    let amount0 = convertTokenToDecimal(amount0Param, token0.decimals);
    let amount1 = convertTokenToDecimal(amount1Param, token1.decimals);
    position.collectedToken0 = position.collectedToken0.plus(amount0);
    position.collectedToken1 = position.collectedToken1.plus(amount1);

    position.collectedFeesToken0 = position.collectedToken0.minus(
      position.withdrawnToken0,
    );
    position.collectedFeesToken1 = position.collectedToken1.minus(
      position.withdrawnToken1,
    );

    let newCollectUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)));
    position.amountCollectedUSD = position.amountCollectedUSD.plus(
      newCollectUSD,
    );

    position = updateFeeVars(position, entity, tokenIdParam);
    position.save();
    savePositionSnapshot(position, entity);
  }
}

export function handleTransfer(event: EntityTrigger): void {
  if (event.entityOp === EntityOp.Create) {
    let entity = event.entity;
    let tokenIdParam = entity.getBigInt('tokenId');
    let toParam = entity.getBytes('to');
    let position = getPosition(entity, tokenIdParam);

    // position was not able to be fetched
    if (position == null) {
      return;
    }

    position.owner = toParam;
    position.save();

    savePositionSnapshot(position, entity);
  }
}
