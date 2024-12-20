import {
  Bundle,
  Burn,
  Collect,
  Factory,
  Mint,
  Pool,
  SetProtocolFeeEvent,
  Swap,
  Tick,
  Token,
  DecreaseEvent,
  IncreaseEvent,
  Position,
  PositionSnapshot,
} from '../../generated/schema';
import { Pool as PoolABI } from '../../generated/Factory/Pool';

import {
  log,
  BigInt,
  Address,
  BigDecimal,
  Entity,
  EntityTrigger,
  ethereum,
  EntityOp,
} from '@graphprotocol/graph-ts';

import { convertTokenToDecimal, loadTransaction, safeDiv } from '../utils';

import {
  FACTORY_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO,
  WHITELISTED_TOKEN_ADDRESSES,
  factoryContract,
} from './../constants';

import {
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenTotalSupply,
  fetchTokenDecimals,
} from '../utils/token';

import {
  findEthPerToken,
  getEthPriceInUSD,
  getTrackedAmountUSD,
  sqrtPriceX96ToTokenPrices,
} from '../utils/pricing';
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTickDayData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData,
} from '../utils/intervalUpdates';
import { createTick, feeTierToTickSpacing } from '../utils/tick';
import { NonfungiblePositionManager } from '../../generated/Factory/NonfungiblePositionManager';
import {
  NonfungiblePositionManagerCollect as CollectTrigger,
  PoolCollect,
  DecreaseLiquidity,
  IncreaseLiquidity,
  PoolCreated as PoolCreatedEntity,
  Transfer,
  Initialize,
  SetFeeProtocol,
  CollectProtocol,
  Mint as MintTrigger,
  Burn as BurnTrigger,
  Swap as SwapTrigger,
  Flash as FlashTrigger,
} from '../../generated/subgraph-QmdXu8byAFCGSDWsB5gMQjWr6GUvEVB7S1hemfxNuomerz';

export function handlePoolCreated(
  trigger: EntityTrigger<PoolCreatedEntity>,
): void {
  if (trigger.operation === EntityOp.Create) {
    let entity = trigger.data;
    let token0Param = Address.fromBytes(entity.token0);
    let token1Param = Address.fromBytes(entity.token1);

    // load factory
    let factory = Factory.load(FACTORY_ADDRESS.toHex());
    if (factory === null) {
      factory = new Factory(FACTORY_ADDRESS.toHex());
      factory.poolCount = ZERO_BI;
      factory.totalVolumeETH = ZERO_BD;
      factory.totalVolumeUSD = ZERO_BD;
      factory.untrackedVolumeUSD = ZERO_BD;
      factory.totalFeesUSD = ZERO_BD;
      factory.totalFeesETH = ZERO_BD;
      factory.totalValueLockedETH = ZERO_BD;
      factory.totalValueLockedUSD = ZERO_BD;
      factory.totalValueLockedUSDUntracked = ZERO_BD;
      factory.totalValueLockedETHUntracked = ZERO_BD;
      factory.txCount = ZERO_BI;
      factory.owner = ADDRESS_ZERO;

      // create new bundle for tracking eth price
      let bundle = new Bundle('1');
      bundle.ethPriceUSD = ZERO_BD;
      bundle.save();
    }

    factory.poolCount = factory.poolCount.plus(ONE_BI);

    let pool = new Pool(entity.pool.toHexString()) as Pool;
    let token0 = Token.load(token0Param.toHexString());
    let token1 = Token.load(token1Param.toHexString());

    // fetch info if null
    if (token0 === null) {
      token0 = new Token(token0Param.toHexString());
      token0.symbol = fetchTokenSymbol(token0Param);
      token0.name = fetchTokenName(token0Param);
      token0.totalSupply = fetchTokenTotalSupply(token0Param);
      let decimals = fetchTokenDecimals(token0Param);

      // bail if we couldn't figure out the decimals
      if (decimals === null) {
        log.debug('mybug the decimal on token 0 was null', []);
        return;
      }

      token0.decimals = decimals;
      token0.derivedETH = ZERO_BD;
      token0.volume = ZERO_BD;
      token0.volumeUSD = ZERO_BD;
      token0.feesUSD = ZERO_BD;
      token0.untrackedVolumeUSD = ZERO_BD;
      token0.totalValueLocked = ZERO_BD;
      token0.totalValueLockedUSD = ZERO_BD;
      token0.totalValueLockedUSDUntracked = ZERO_BD;
      token0.txCount = ZERO_BI;
      token0.poolCount = ZERO_BI;
      token0.whitelistPools = [];
    }

    if (token1 === null) {
      token1 = new Token(token1Param.toHexString());
      token1.symbol = fetchTokenSymbol(token1Param);
      token1.name = fetchTokenName(token1Param);
      token1.totalSupply = fetchTokenTotalSupply(token1Param);
      let decimals = fetchTokenDecimals(token1Param);
      // bail if we couldn't figure out the decimals
      if (decimals === null) {
        log.debug('mybug the decimal on token 0 was null', []);
        return;
      }
      token1.decimals = decimals;
      token1.derivedETH = ZERO_BD;
      token1.volume = ZERO_BD;
      token1.volumeUSD = ZERO_BD;
      token1.untrackedVolumeUSD = ZERO_BD;
      token1.feesUSD = ZERO_BD;
      token1.totalValueLocked = ZERO_BD;
      token1.totalValueLockedUSD = ZERO_BD;
      token1.totalValueLockedUSDUntracked = ZERO_BD;
      token1.txCount = ZERO_BI;
      token1.poolCount = ZERO_BI;
      token1.whitelistPools = [];
    }

    // update white listed pools
    if (WHITELISTED_TOKEN_ADDRESSES.includes(token0.id)) {
      let newPools = token1.whitelistPools;
      newPools.push(pool.id);
      token1.whitelistPools = newPools;
    }
    if (WHITELISTED_TOKEN_ADDRESSES.includes(token1.id)) {
      let newPools = token0.whitelistPools;
      newPools.push(pool.id);
      token0.whitelistPools = newPools;
    }

    pool.token0 = token0.id;
    pool.token1 = token1.id;
    pool.feeTier = BigInt.fromI32(entity.fee);
    pool.createdAtTimestamp = entity.blockTimestamp;
    pool.createdAtBlockNumber = entity.blockNumber;
    pool.liquidityProviderCount = ZERO_BI;
    pool.txCount = ZERO_BI;
    pool.liquidity = ZERO_BI;
    pool.sqrtPrice = ZERO_BI;
    pool.feeGrowthGlobal0X128 = ZERO_BI;
    pool.feeGrowthGlobal1X128 = ZERO_BI;
    pool.token0Price = ZERO_BD;
    pool.token1Price = ZERO_BD;
    pool.observationIndex = ZERO_BI;
    pool.totalValueLockedToken0 = ZERO_BD;
    pool.totalValueLockedToken1 = ZERO_BD;
    pool.totalValueLockedUSD = ZERO_BD;
    pool.totalValueLockedETH = ZERO_BD;
    pool.totalValueLockedUSDUntracked = ZERO_BD;
    pool.volumeToken0 = ZERO_BD;
    pool.volumeToken1 = ZERO_BD;
    pool.volumeUSD = ZERO_BD;
    pool.feesUSD = ZERO_BD;
    pool.untrackedVolumeUSD = ZERO_BD;

    pool.collectedFeesToken0 = ZERO_BD;
    pool.collectedFeesToken1 = ZERO_BD;
    pool.collectedFeesUSD = ZERO_BD;
    pool.isProtocolFeeEnabled = false;

    pool.save();
    token0.save();
    token1.save();
    factory.save();
  }
}

// ===================================================================== PositionManager

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

export function handleIncreaseLiquidity(
  trigger: EntityTrigger<IncreaseLiquidity>,
): void {
  if (trigger.operation === EntityOp.Create) {
    let entity = trigger.data;
    let position = getPosition(entity, entity.tokenId);
    // position was not able to be fetched
    if (position == null) {
      return;
    }

    const tx = loadTransaction(entity);
    const increase = new IncreaseEvent(
      entity.transactionHash
        .toHexString()
        .concat(':')
        .concat(entity.logIndex.toString()),
    );
    increase.transaction = tx.id;
    increase.timeStamp = entity.blockTimestamp;
    increase.amount0 = entity.amount0;
    increase.amount1 = entity.amount1;
    increase.pool = position.pool;
    increase.token0 = position.token0;
    increase.token1 = position.token1;
    increase.position = position.id;
    increase.tokenID = entity.tokenId;
    increase.save();

    let bundle = Bundle.load('1');

    if (bundle === null) {
      log.error('Bundle entity does not exist', []);

      log.critical('Bundle entity does not exist', []);
      return;
    }

    let token0 = Token.load(position.token0) as Token;
    let token1 = Token.load(position.token1) as Token;

    let amount0 = convertTokenToDecimal(entity.amount0, token0.decimals);
    let amount1 = convertTokenToDecimal(entity.amount1, token1.decimals);

    position.liquidity = position.liquidity.plus(entity.liquidity);
    position.depositedToken0 = position.depositedToken0.plus(amount0);
    position.depositedToken1 = position.depositedToken1.plus(amount1);

    let newDepositUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)));
    position.amountDepositedUSD =
      position.amountDepositedUSD.plus(newDepositUSD);

    updateFeeVars(position, entity, entity.tokenId);

    position.save();

    savePositionSnapshot(position, entity);
  }
}

export function handleDecreaseLiquidity(
  trigger: EntityTrigger<DecreaseLiquidity>,
): void {
  if (trigger.operation === EntityOp.Create) {
    let entity = trigger.data;
    let position = getPosition(entity, entity.tokenId);

    // Position was not able to be fetched
    if (position == null) {
      return;
    }

    const tx = loadTransaction(entity);
    const decrease = new DecreaseEvent(
      entity.transactionHash
        .toHexString()
        .concat(':')
        .concat(entity.logIndex.toString()),
    );
    decrease.transaction = tx.id;
    decrease.timeStamp = entity.blockTimestamp;
    decrease.amount0 = entity.amount0;
    decrease.amount1 = entity.amount1;
    decrease.pool = position.pool;
    decrease.token0 = position.token0;
    decrease.token1 = position.token1;
    decrease.position = position.id;
    decrease.tokenID = entity.tokenId;
    decrease.save();

    let bundle = Bundle.load('1') as Bundle;

    let token0 = Token.load(position.token0) as Token;
    let token1 = Token.load(position.token1) as Token;
    let amount0 = convertTokenToDecimal(entity.amount0, token0.decimals);
    let amount1 = convertTokenToDecimal(entity.amount1, token1.decimals);

    position.liquidity = position.liquidity.minus(entity.liquidity);
    position.withdrawnToken0 = position.withdrawnToken0.plus(amount0);
    position.withdrawnToken1 = position.withdrawnToken1.plus(amount1);

    let newWithdrawUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)));
    position.amountWithdrawnUSD = position.amountWithdrawnUSD.plus(newWithdrawUSD);

    position = updateFeeVars(position, entity, entity.tokenId);
    position.save();
    savePositionSnapshot(position, entity);
  }
}


export function handleCollect(trigger: EntityTrigger<CollectTrigger>): void {
  if (trigger.operation === EntityOp.Create) {
    let entity = trigger.data;
    let position = getPosition(entity, entity.tokenId);

    // Position was not able to be fetched
    if (position == null) {
      return;
    }

    let bundle = Bundle.load('1') as Bundle;
    let token0 = Token.load(position.token0) as Token;
    let token1 = Token.load(position.token1) as Token;

    let amount0 = convertTokenToDecimal(entity.amount0, token0.decimals);
    let amount1 = convertTokenToDecimal(entity.amount1, token1.decimals);
    position.collectedToken0 = position.collectedToken0.plus(amount0);
    position.collectedToken1 = position.collectedToken1.plus(amount1);

    position.collectedFeesToken0 = position.collectedToken0.minus(position.withdrawnToken0);
    position.collectedFeesToken1 = position.collectedToken1.minus(position.withdrawnToken1);

    let newCollectUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)));
    position.amountCollectedUSD = position.amountCollectedUSD.plus(newCollectUSD);

    position = updateFeeVars(position, entity, entity.tokenId);
    position.save();
    savePositionSnapshot(position, entity);
  }
}


export function handleTransfer(trigger: EntityTrigger<Transfer>): void {
  if (trigger.operation === EntityOp.Create) {
    let entity = trigger.data;
    let position = getPosition(entity, entity.tokenId);

    // Position was not able to be fetched
    if (position == null) {
      return;
    }

    position.owner = entity.to;
    position.save();

    savePositionSnapshot(position, entity);
  }
}


// ===================================================================== Pool

export function handleInitialize(trigger: EntityTrigger<Initialize>): void {
  if (trigger.operation === EntityOp.Create) {
    let entity = trigger.data;
    let poolAddressParam = Address.fromBytes(entity.poolAddress);

    // update pool sqrt price and tick
    let pool = Pool.load(poolAddressParam.toHexString()) as Pool;
    pool.sqrtPrice = entity.sqrtPriceX96;
    pool.tick = BigInt.fromI32(entity.tick);
    pool.save();

    // update token prices
    let token0 = Token.load(pool.token0) as Token;
    let token1 = Token.load(pool.token1) as Token;

    // update ETH price now that prices could have changed
    let bundle = Bundle.load('1') as Bundle;
    bundle.ethPriceUSD = getEthPriceInUSD();
    bundle.save();

    updatePoolDayData(entity);
    updatePoolHourData(entity);

    // update token prices
    token0.derivedETH = findEthPerToken(token0);
    token1.derivedETH = findEthPerToken(token1);
    token0.save();
    token1.save();
  }
}

export function handleMint(trigger: EntityTrigger<MintTrigger>): void {
  if (trigger.operation === EntityOp.Create) {
    let bundle = Bundle.load('1') as Bundle;
    let entity = trigger.data;
    let poolAddress = trigger.data.getBytes('poolAddress').toHexString();

    let pool = Pool.load(poolAddress) as Pool;
    let factory = Factory.load(FACTORY_ADDRESS.toHex()) as Factory;

    let token0 = Token.load(pool.token0) as Token;
    let token1 = Token.load(pool.token1) as Token;
    let amount0 = convertTokenToDecimal(entity.amount0, token0.decimals);
    let amount1 = convertTokenToDecimal(entity.amount1, token1.decimals);

    let amountUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)));

    // reset tvl aggregates until new amounts calculated
    factory.totalValueLockedETH = factory.totalValueLockedETH.minus(
      pool.totalValueLockedETH,
    );

    // update globals
    factory.txCount = factory.txCount.plus(ONE_BI);

    // update token0 data
    token0.txCount = token0.txCount.plus(ONE_BI);
    token0.totalValueLocked = token0.totalValueLocked.plus(amount0);
    token0.totalValueLockedUSD = token0.totalValueLocked.times(
      token0.derivedETH.times(bundle.ethPriceUSD),
    );

    // update token1 data
    token1.txCount = token1.txCount.plus(ONE_BI);
    token1.totalValueLocked = token1.totalValueLocked.plus(amount1);
    token1.totalValueLockedUSD = token1.totalValueLocked.times(
      token1.derivedETH.times(bundle.ethPriceUSD),
    );

    // pool data
    pool.txCount = pool.txCount.plus(ONE_BI);

    // Pools liquidity tracks the currently active liquidity given pools current tick.
    // We only want to update it on mint if the new position includes the current tick.
    if (
      pool.tick !== null &&
      BigInt.fromI32(entity.tickLower).le(pool.tick as BigInt) &&
      BigInt.fromI32(entity.tickUpper).gt(pool.tick as BigInt)
    ) {
      pool.liquidity = pool.liquidity.plus(entity.amount);
    }

    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0);
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1);
    pool.totalValueLockedETH = pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH));
    pool.totalValueLockedUSD = pool.totalValueLockedETH.times(
      bundle.ethPriceUSD,
    );

    // reset aggregates with new amounts
    factory.totalValueLockedETH = factory.totalValueLockedETH.plus(
      pool.totalValueLockedETH,
    );
    factory.totalValueLockedUSD = factory.totalValueLockedETH.times(
      bundle.ethPriceUSD,
    );

    let transaction = loadTransaction(trigger.data);
    let mint = new Mint(
      transaction.id.toString() + '#' + pool.txCount.toString(),
    );
    mint.transaction = transaction.id;
    mint.timestamp = transaction.timestamp;
    mint.pool = pool.id;
    mint.token0 = pool.token0;
    mint.token1 = pool.token1;
    mint.owner = entity.owner;
    mint.sender = entity.sender;
    mint.origin = entity.transactionFrom;
    mint.amount = entity.amount;
    mint.amount0 = amount0;
    mint.amount1 = amount1;
    mint.amountUSD = amountUSD;
    mint.tickLower = BigInt.fromI32(entity.tickLower);
    mint.tickUpper = BigInt.fromI32(entity.tickUpper);
    mint.logIndex = entity.logIndex;

    // tick entities
    let lowerTickIdx = entity.tickLower;
    let upperTickIdx = entity.tickUpper;

    let lowerTickId =
      poolAddress + '#' + BigInt.fromI32(entity.tickLower).toString();
    let upperTickId =
      poolAddress + '#' + BigInt.fromI32(entity.tickUpper).toString();

    let lowerTick = Tick.load(lowerTickId);
    let upperTick = Tick.load(upperTickId);

    if (lowerTick === null) {
      lowerTick = createTick(
        lowerTickId,
        lowerTickIdx,
        pool.id,
        entity.blockNumber,
        entity.blockTimestamp,
      );
    }

    if (upperTick === null) {
      upperTick = createTick(
        upperTickId,
        upperTickIdx,
        pool.id,
        entity.blockNumber,
        entity.blockTimestamp,
      );
    }

    let amount = entity.amount;
    lowerTick.liquidityGross = lowerTick.liquidityGross.plus(amount);
    lowerTick.liquidityNet = lowerTick.liquidityNet.plus(amount);
    upperTick.liquidityGross = upperTick.liquidityGross.plus(amount);
    upperTick.liquidityNet = upperTick.liquidityNet.minus(amount);

    // TODO: Update Tick's volume, fees, and liquidity provider count. Computing these on the tick
    // level requires reimplementing some of the swapping code from v3-core.

    updateUniswapDayData(entity);
    updatePoolDayData(entity);
    updatePoolHourData(entity);
    updateTokenDayData(token0, entity);
    updateTokenDayData(token1, entity);
    updateTokenHourData(token0, entity);
    updateTokenHourData(token1, entity);

    token0.save();
    token1.save();
    pool.save();
    factory.save();
    mint.save();

    // Update inner tick vars and save the ticks
    updateTickFeeVarsAndSave(lowerTick, entity);
    updateTickFeeVarsAndSave(upperTick, entity);
  }
}

export function handleBurn(trigger: EntityTrigger<BurnTrigger>): void {
  if (trigger.operation === EntityOp.Create) {
    let entity = trigger.data;
    let bundle = Bundle.load('1') as Bundle;
    let poolAddress = Address.fromBytes(entity.poolAddress).toHexString();
    let pool = Pool.load(poolAddress) as Pool;
    let factory = Factory.load(FACTORY_ADDRESS.toHex()) as Factory;

    let token0 = Token.load(pool.token0) as Token;
    let token1 = Token.load(pool.token1) as Token;
    let amount0 = convertTokenToDecimal(entity.amount0, token0.decimals);
    let amount1 = convertTokenToDecimal(entity.amount1, token1.decimals);

    let amountUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)));

    // update globals
    factory.txCount = factory.txCount.plus(ONE_BI);

    // update token0 data
    token0.txCount = token0.txCount.plus(ONE_BI);

    // update token1 data
    token1.txCount = token1.txCount.plus(ONE_BI);

    // pool data
    pool.txCount = pool.txCount.plus(ONE_BI);
    // Pools liquidity tracks the currently active liquidity given pools current tick.
    // We only want to update it on burn if the position being burnt includes the current tick.
    if (
      pool.tick !== null &&
      BigInt.fromI32(entity.tickLower).le(pool.tick as BigInt) &&
      BigInt.fromI32(entity.tickUpper).gt(pool.tick as BigInt)
    ) {
      pool.liquidity = pool.liquidity.minus(entity.amount);
    }

    // burn entity
    let transaction = loadTransaction(entity);
    let burn = new Burn(transaction.id + '-' + entity.logIndex.toString());
    burn.transaction = transaction.id;
    burn.timestamp = transaction.timestamp;
    burn.pool = pool.id;
    burn.token0 = pool.token0;
    burn.token1 = pool.token1;
    burn.owner = entity.owner;
    burn.origin = entity.transactionFrom;
    burn.amount = entity.amount;
    burn.amount0 = amount0;
    burn.amount1 = amount1;
    burn.amountUSD = amountUSD;
    burn.tickLower = BigInt.fromI32(entity.tickLower);
    burn.tickUpper = BigInt.fromI32(entity.tickUpper);
    burn.logIndex = entity.logIndex;

    // tick entities
    let lowerTickId =
      poolAddress + '#' + BigInt.fromI32(entity.tickLower).toString();
    let upperTickId =
      poolAddress + '#' + BigInt.fromI32(entity.tickUpper).toString();
    let lowerTick = Tick.load(lowerTickId) as Tick;
    let upperTick = Tick.load(upperTickId) as Tick;

    lowerTick.liquidityGross = lowerTick.liquidityGross.minus(entity.amount);
    lowerTick.liquidityNet = lowerTick.liquidityNet.minus(entity.amount);
    upperTick.liquidityGross = upperTick.liquidityGross.minus(entity.amount);
    upperTick.liquidityNet = upperTick.liquidityNet.plus(entity.amount);

    updateUniswapDayData(entity);
    updatePoolDayData(entity);
    updatePoolHourData(entity);
    updateTokenDayData(token0 as Token, entity);
    updateTokenDayData(token1 as Token, entity);
    updateTokenHourData(token0 as Token, entity);
    updateTokenHourData(token1 as Token, entity);
    updateTickFeeVarsAndSave(lowerTick, entity);
    updateTickFeeVarsAndSave(upperTick, entity);

    token0.save();
    token1.save();
    pool.save();
    factory.save();
    burn.save();
  }
}

export function handleSwap(trigger: EntityTrigger<SwapTrigger>): void {
  if (trigger.operation == EntityOp.Create) {
    let entity = trigger.data;

    let bundle = Bundle.load('1') as Bundle;
    let factory = Factory.load(FACTORY_ADDRESS.toHex()) as Factory;
    let pool = Pool.load(entity.poolAddress.toHexString()) as Pool;

    let token0 = Token.load(pool.token0) as Token;
    let token1 = Token.load(pool.token1) as Token;

    let oldTick = pool.tick!;

    // amounts - 0/1 are token deltas: can be positive or negative
    let amount0 = convertTokenToDecimal(entity.amount0, token0.decimals);
    let amount1 = convertTokenToDecimal(entity.amount1, token1.decimals);

    // need absolute amounts for volume
    let amount0Abs = amount0;
    if (amount0.lt(ZERO_BD)) {
      amount0Abs = amount0.times(BigDecimal.fromString('-1'));
    }
    let amount1Abs = amount1;
    if (amount1.lt(ZERO_BD)) {
      amount1Abs = amount1.times(BigDecimal.fromString('-1'));
    }

    let amount0ETH = amount0Abs.times(token0.derivedETH);
    let amount1ETH = amount1Abs.times(token1.derivedETH);
    let amount0USD = amount0ETH.times(bundle.ethPriceUSD);
    let amount1USD = amount1ETH.times(bundle.ethPriceUSD);
    // get amount that should be tracked only - div 2 because cant count both input and output as volume
    let amountTotalUSDTracked = safeDiv(
      getTrackedAmountUSD(amount0Abs, token0, amount1Abs, token1),
      BigDecimal.fromString('2'),
    );
    let amountTotalETHTracked = safeDiv(
      amountTotalUSDTracked,
      bundle.ethPriceUSD,
    );
    let amountTotalUSDUntracked = safeDiv(
      amount0USD.plus(amount1USD),
      BigDecimal.fromString('2'),
    );

    let feesETH = amountTotalETHTracked
      .times(pool.feeTier.toBigDecimal())
      .div(BigDecimal.fromString('1000000'));
    let feesUSD = amountTotalUSDTracked
      .times(pool.feeTier.toBigDecimal())
      .div(BigDecimal.fromString('1000000'));

    // global updates
    factory.txCount = factory.txCount.plus(ONE_BI);
    factory.totalVolumeETH = factory.totalVolumeETH.plus(amountTotalETHTracked);
    factory.totalVolumeUSD = factory.totalVolumeUSD.plus(amountTotalUSDTracked);
    factory.untrackedVolumeUSD = factory.untrackedVolumeUSD.plus(
      amountTotalUSDUntracked,
    );
    factory.totalFeesETH = factory.totalFeesETH.plus(feesETH);
    factory.totalFeesUSD = factory.totalFeesUSD.plus(feesUSD);

    // reset aggregate tvl before individual pool tvl updates
    let currentPoolTvlETH = pool.totalValueLockedETH;
    factory.totalValueLockedETH =
      factory.totalValueLockedETH.minus(currentPoolTvlETH);

    // pool volume
    pool.volumeToken0 = pool.volumeToken0.plus(amount0Abs);
    pool.volumeToken1 = pool.volumeToken1.plus(amount1Abs);
    pool.volumeUSD = pool.volumeUSD.plus(amountTotalUSDTracked);
    pool.untrackedVolumeUSD = pool.untrackedVolumeUSD.plus(
      amountTotalUSDUntracked,
    );
    pool.feesUSD = pool.feesUSD.plus(feesUSD);
    pool.txCount = pool.txCount.plus(ONE_BI);

    // Update the pool with the new active liquidity, price, and tick.
    pool.liquidity = entity.liquidity;
    pool.tick = BigInt.fromI32(entity.tick as i32);
    pool.sqrtPrice = entity.sqrtPriceX96;
    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0);
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1);

    // update token0 data
    token0.volume = token0.volume.plus(amount0Abs);
    token0.totalValueLocked = token0.totalValueLocked.plus(amount0);
    token0.volumeUSD = token0.volumeUSD.plus(amountTotalUSDTracked);
    token0.untrackedVolumeUSD = token0.untrackedVolumeUSD.plus(
      amountTotalUSDUntracked,
    );
    token0.feesUSD = token0.feesUSD.plus(feesUSD);
    token0.txCount = token0.txCount.plus(ONE_BI);

    // update token1 data
    token1.volume = token1.volume.plus(amount1Abs);
    token1.totalValueLocked = token1.totalValueLocked.plus(amount1);
    token1.volumeUSD = token1.volumeUSD.plus(amountTotalUSDTracked);
    token1.untrackedVolumeUSD = token1.untrackedVolumeUSD.plus(
      amountTotalUSDUntracked,
    );
    token1.feesUSD = token1.feesUSD.plus(feesUSD);
    token1.txCount = token1.txCount.plus(ONE_BI);

    // updated pool ratess

    let prices = sqrtPriceX96ToTokenPrices(
      pool.sqrtPrice,
      token0 as Token,
      token1 as Token,
    );
    pool.token0Price = prices[0];
    pool.token1Price = prices[1];
    pool.save();

    // update USD pricing
    bundle.ethPriceUSD = getEthPriceInUSD();
    bundle.save();
    token0.derivedETH = findEthPerToken(token0 as Token);
    token1.derivedETH = findEthPerToken(token1 as Token);

    /**
     * Things afffected by new USD rates
     */
    pool.totalValueLockedETH = pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH));
    pool.totalValueLockedUSD = pool.totalValueLockedETH.times(
      bundle.ethPriceUSD,
    );

    factory.totalValueLockedETH = factory.totalValueLockedETH.plus(
      pool.totalValueLockedETH,
    );
    factory.totalValueLockedUSD = factory.totalValueLockedETH.times(
      bundle.ethPriceUSD,
    );

    token0.totalValueLockedUSD = token0.totalValueLocked
      .times(token0.derivedETH)
      .times(bundle.ethPriceUSD);
    token1.totalValueLockedUSD = token1.totalValueLocked
      .times(token1.derivedETH)
      .times(bundle.ethPriceUSD);

    // create Swap event
    let transaction = loadTransaction(entity);
    let swap = new Swap(transaction.id + '#' + pool.txCount.toString());
    swap.transaction = transaction.id;
    swap.timestamp = transaction.timestamp;
    swap.pool = pool.id;
    swap.token0 = pool.token0;
    swap.token1 = pool.token1;
    swap.sender = entity.sender;
    swap.origin = entity.transactionFrom;
    swap.recipient = entity.recipient;
    swap.amount0 = amount0;
    swap.amount1 = amount1;
    swap.amountUSD = amountTotalUSDTracked;
    swap.tick = BigInt.fromI32(entity.tick as i32);
    swap.sqrtPriceX96 = entity.sqrtPriceX96;
    swap.logIndex = entity.logIndex;

    // update fee growth
    let poolContract = PoolABI.bind(Address.fromBytes(entity.poolAddress));
    let feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128();
    let feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal1X128();
    pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128 as BigInt;
    pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128 as BigInt;

    // interval data
    let uniswapDayData = updateUniswapDayData(entity);
    let poolDayData = updatePoolDayData(entity);
    let poolHourData = updatePoolHourData(entity);
    let token0DayData = updateTokenDayData(token0 as Token, entity);
    let token1DayData = updateTokenDayData(token1 as Token, entity);
    let token0HourData = updateTokenHourData(token0 as Token, entity);
    let token1HourData = updateTokenHourData(token1 as Token, entity);

    // update volume metrics
    uniswapDayData.volumeETH = uniswapDayData.volumeETH.plus(
      amountTotalETHTracked,
    );
    uniswapDayData.volumeUSD = uniswapDayData.volumeUSD.plus(
      amountTotalUSDTracked,
    );
    uniswapDayData.feesUSD = uniswapDayData.feesUSD.plus(feesUSD);

    poolDayData.volumeUSD = poolDayData.volumeUSD.plus(amountTotalUSDTracked);
    poolDayData.volumeToken0 = poolDayData.volumeToken0.plus(amount0Abs);
    poolDayData.volumeToken1 = poolDayData.volumeToken1.plus(amount1Abs);
    poolDayData.feesUSD = poolDayData.feesUSD.plus(feesUSD);

    poolHourData.volumeUSD = poolHourData.volumeUSD.plus(amountTotalUSDTracked);
    poolHourData.volumeToken0 = poolHourData.volumeToken0.plus(amount0Abs);
    poolHourData.volumeToken1 = poolHourData.volumeToken1.plus(amount1Abs);
    poolHourData.feesUSD = poolHourData.feesUSD.plus(feesUSD);

    token0DayData.volume = token0DayData.volume.plus(amount0Abs);
    token0DayData.volumeUSD = token0DayData.volumeUSD.plus(
      amountTotalUSDTracked,
    );
    token0DayData.untrackedVolumeUSD = token0DayData.untrackedVolumeUSD.plus(
      amountTotalUSDTracked,
    );
    token0DayData.feesUSD = token0DayData.feesUSD.plus(feesUSD);

    token0HourData.volume = token0HourData.volume.plus(amount0Abs);
    token0HourData.volumeUSD = token0HourData.volumeUSD.plus(
      amountTotalUSDTracked,
    );
    token0HourData.untrackedVolumeUSD = token0HourData.untrackedVolumeUSD.plus(
      amountTotalUSDTracked,
    );
    token0HourData.feesUSD = token0HourData.feesUSD.plus(feesUSD);

    token1DayData.volume = token1DayData.volume.plus(amount1Abs);
    token1DayData.volumeUSD = token1DayData.volumeUSD.plus(
      amountTotalUSDTracked,
    );
    token1DayData.untrackedVolumeUSD = token1DayData.untrackedVolumeUSD.plus(
      amountTotalUSDTracked,
    );
    token1DayData.feesUSD = token1DayData.feesUSD.plus(feesUSD);

    token1HourData.volume = token1HourData.volume.plus(amount1Abs);
    token1HourData.volumeUSD = token1HourData.volumeUSD.plus(
      amountTotalUSDTracked,
    );
    token1HourData.untrackedVolumeUSD = token1HourData.untrackedVolumeUSD.plus(
      amountTotalUSDTracked,
    );
    token1HourData.feesUSD = token1HourData.feesUSD.plus(feesUSD);

    swap.save();
    token0DayData.save();
    token1DayData.save();
    uniswapDayData.save();
    poolDayData.save();
    token0HourData.save();
    token1HourData.save();
    poolHourData.save();
    factory.save();
    pool.save();
    token0.save();
    token1.save();

    // Update inner vars of current or crossed ticks
    let newTick = pool.tick!;
    let tickSpacing = feeTierToTickSpacing(pool.feeTier);
    let modulo = newTick.mod(tickSpacing);
    if (modulo.equals(ZERO_BI)) {
      // Current tick is initialized and needs to be updated
      loadTickUpdateFeeVarsAndSave(newTick.toI32(), entity);
    }

    let numIters = oldTick.minus(newTick).abs().div(tickSpacing);

    if (numIters.gt(BigInt.fromI32(100))) {
      // In case more than 100 ticks need to be updated ignore the update in
      // order to avoid timeouts. From testing this behavior occurs only upon
      // pool initialization. This should not be a big issue as the ticks get
      // updated later. For early users this error also disappears when calling
      // collect
    } else if (newTick.gt(oldTick)) {
      let firstInitialized = oldTick.plus(tickSpacing.minus(modulo));
      for (let i = firstInitialized; i.le(newTick); i = i.plus(tickSpacing)) {
        loadTickUpdateFeeVarsAndSave(i.toI32(), entity);
      }
    } else if (newTick.lt(oldTick)) {
      let firstInitialized = oldTick.minus(modulo);
      for (let i = firstInitialized; i.ge(newTick); i = i.minus(tickSpacing)) {
        loadTickUpdateFeeVarsAndSave(i.toI32(), entity);
      }
    }
  }
}

export function handleFlash(trigger: EntityTrigger<FlashTrigger>): void {
  if (trigger.operation === EntityOp.Create) {
    let entity = trigger.data;
    let poolAddressParam = Address.fromBytes(entity.poolAddress);

    // update fee growth
    let pool = Pool.load(poolAddressParam.toHexString()) as Pool;
    let poolContract = PoolABI.bind(poolAddressParam);
    let feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128();
    let feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal1X128();
    pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128 as BigInt;
    pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128 as BigInt;
    pool.save();
  }
}

export function handlePoolCollect(trigger: EntityTrigger<PoolCollect>): void {
  if (trigger.operation == EntityOp.Create) {
    let entity = trigger.data;
    const bundle = Bundle.load('1')!;

    const pool = Pool.load(entity.poolAddress.toHexString());
    if (pool == null) {
      return;
    }
    const transaction = loadTransaction(entity);
    const factory = Factory.load(FACTORY_ADDRESS.toHex())!;

    const token0 = Token.load(pool.token0);
    const token1 = Token.load(pool.token1);
    if (token0 == null || token1 == null) {
      return;
    }

    // Get formatted amounts collected.
    const collectedAmountToken0 = convertTokenToDecimal(
      entity.amount0,
      token0.decimals,
    );
    const collectedAmountToken1 = convertTokenToDecimal(
      entity.amount1,
      token1.decimals,
    );
    const trackedCollectedAmountUSD = getTrackedAmountUSD(
      collectedAmountToken0,
      token0 as Token,
      collectedAmountToken1,
      token1 as Token,
    );

    // Reset tvl aggregates until new amounts calculated
    factory.totalValueLockedETH = factory.totalValueLockedETH.minus(
      pool.totalValueLockedETH,
    );

    // Update globals
    factory.txCount = factory.txCount.plus(ONE_BI);

    // update token data
    token0.txCount = token0.txCount.plus(ONE_BI);
    token0.totalValueLocked = token0.totalValueLocked.minus(
      collectedAmountToken0,
    );
    token0.totalValueLockedUSD = token0.totalValueLocked.times(
      token0.derivedETH.times(bundle.ethPriceUSD),
    );

    token1.txCount = token1.txCount.plus(ONE_BI);
    token1.totalValueLocked = token1.totalValueLocked.minus(
      collectedAmountToken1,
    );
    token1.totalValueLockedUSD = token1.totalValueLocked.times(
      token1.derivedETH.times(bundle.ethPriceUSD),
    );

    // Adjust pool TVL based on amount collected.
    pool.txCount = pool.txCount.plus(ONE_BI);
    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(
      collectedAmountToken0,
    );
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(
      collectedAmountToken1,
    );
    pool.totalValueLockedETH = pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH));
    pool.totalValueLockedUSD = pool.totalValueLockedETH.times(
      bundle.ethPriceUSD,
    );

    // Update aggregate fee collection values.
    pool.collectedFeesToken0 = pool.collectedFeesToken0.plus(
      collectedAmountToken0,
    );
    pool.collectedFeesToken1 = pool.collectedFeesToken1.plus(
      collectedAmountToken1,
    );
    pool.collectedFeesUSD = pool.collectedFeesUSD.plus(
      trackedCollectedAmountUSD,
    );

    // reset aggregates with new amounts
    factory.totalValueLockedETH = factory.totalValueLockedETH.plus(
      pool.totalValueLockedETH,
    );
    factory.totalValueLockedUSD = factory.totalValueLockedETH.times(
      bundle.ethPriceUSD,
    );

    const collect = new Collect(
      transaction.id + '-' + entity.logIndex.toString(),
    );
    collect.transaction = transaction.id;
    collect.timestamp = entity.blockTimestamp;
    collect.pool = pool.id;
    collect.owner = entity.owner;
    collect.amount0 = collectedAmountToken0;
    collect.amount1 = collectedAmountToken1;
    collect.amountUSD = trackedCollectedAmountUSD;
    collect.tickLower = BigInt.fromI32(entity.tickLower);
    collect.tickUpper = BigInt.fromI32(entity.tickUpper);
    collect.logIndex = entity.logIndex;

    updateUniswapDayData(entity);
    updatePoolDayData(entity);
    updatePoolHourData(entity);
    updateTokenDayData(token0 as Token, entity);
    updateTokenDayData(token1 as Token, entity);
    updateTokenHourData(token0 as Token, entity);
    updateTokenHourData(token1 as Token, entity);

    token0.save();
    token1.save();
    factory.save();
    pool.save();
    collect.save();

    return;
  }
}

export function handleProtocolCollect(
  trigger: EntityTrigger<CollectProtocol>,
): void {
  if (trigger.operation == EntityOp.Create) {
    let entity = trigger.data;
    const bundle = Bundle.load('1')!;

    const pool = Pool.load(entity.poolAddress.toHexString());
    if (pool == null) {
      return;
    }
    const transaction = loadTransaction(entity);
    const factory = Factory.load(FACTORY_ADDRESS.toHex())!;

    const token0 = Token.load(pool.token0);
    const token1 = Token.load(pool.token1);
    if (token0 == null || token1 == null) {
      return;
    }

    // Get formatted amounts collected.
    const collectedAmountToken0 = convertTokenToDecimal(
      entity.amount0,
      token0.decimals,
    );
    const collectedAmountToken1 = convertTokenToDecimal(
      entity.amount1,
      token1.decimals,
    );
    const trackedCollectedAmountUSD = getTrackedAmountUSD(
      collectedAmountToken0,
      token0 as Token,
      collectedAmountToken1,
      token1 as Token,
    );

    // Reset tvl aggregates until new amounts calculated
    factory.totalValueLockedETH = factory.totalValueLockedETH.minus(
      pool.totalValueLockedETH,
    );

    // Update globals
    factory.txCount = factory.txCount.plus(ONE_BI);

    // update token data
    token0.txCount = token0.txCount.plus(ONE_BI);
    token0.totalValueLocked = token0.totalValueLocked.minus(
      collectedAmountToken0,
    );
    token0.totalValueLockedUSD = token0.totalValueLocked.times(
      token0.derivedETH.times(bundle.ethPriceUSD),
    );

    token1.txCount = token1.txCount.plus(ONE_BI);
    token1.totalValueLocked = token1.totalValueLocked.minus(
      collectedAmountToken1,
    );
    token1.totalValueLockedUSD = token1.totalValueLocked.times(
      token1.derivedETH.times(bundle.ethPriceUSD),
    );

    // Adjust pool TVL based on amount collected.
    pool.txCount = pool.txCount.plus(ONE_BI);
    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(
      collectedAmountToken0,
    );
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(
      collectedAmountToken1,
    );
    pool.totalValueLockedETH = pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH));
    pool.totalValueLockedUSD = pool.totalValueLockedETH.times(
      bundle.ethPriceUSD,
    );

    // Update aggregate fee collection values.
    pool.collectedFeesToken0 = pool.collectedFeesToken0.plus(
      collectedAmountToken0,
    );
    pool.collectedFeesToken1 = pool.collectedFeesToken1.plus(
      collectedAmountToken1,
    );
    pool.collectedFeesUSD = pool.collectedFeesUSD.plus(
      trackedCollectedAmountUSD,
    );

    // reset aggregates with new amounts
    factory.totalValueLockedETH = factory.totalValueLockedETH.plus(
      pool.totalValueLockedETH,
    );
    factory.totalValueLockedUSD = factory.totalValueLockedETH.times(
      bundle.ethPriceUSD,
    );

    const collect = new Collect(
      transaction.id + '-' + entity.logIndex.toString(),
    );
    collect.transaction = transaction.id;
    collect.timestamp = entity.blockTimestamp;
    collect.pool = pool.id;
    collect.owner = entity.recipient;
    collect.amount0 = collectedAmountToken0;
    collect.amount1 = collectedAmountToken1;
    collect.amountUSD = trackedCollectedAmountUSD;
    collect.tickLower = ZERO_BI;
    collect.tickUpper = ZERO_BI;
    collect.logIndex = entity.logIndex;

    updateUniswapDayData(entity);
    updatePoolDayData(entity);
    updatePoolHourData(entity);
    updateTokenDayData(token0 as Token, entity);
    updateTokenDayData(token1 as Token, entity);
    updateTokenHourData(token0 as Token, entity);
    updateTokenHourData(token1 as Token, entity);

    token0.save();
    token1.save();
    factory.save();
    pool.save();
    collect.save();

    return;
  }
}

export function handleSetProtocolFee(
  trigger: EntityTrigger<SetFeeProtocol>,
): void {
  if (trigger.operation == EntityOp.Create) {
    let entity = trigger.data;
    const pool = Pool.load(entity.poolAddress.toHexString());
    if (pool == null) {
      return;
    }

    pool.isProtocolFeeEnabled =
      entity.feeProtocol0New > 0 || entity.feeProtocol1New > 0;
    pool.save();

    const protocolFeeEvent = new SetProtocolFeeEvent(
      entity.transactionHash.toHexString() + '-' + entity.logIndex.toString(),
    );
    protocolFeeEvent.pool = pool.id;
    protocolFeeEvent.logIndex = entity.logIndex;
    protocolFeeEvent.timestamp = entity.blockTimestamp;
    protocolFeeEvent.pool = pool.id;
    protocolFeeEvent.new0 = BigInt.fromI32(entity.feeProtocol0New);
    protocolFeeEvent.new1 = BigInt.fromI32(entity.feeProtocol1New);
    protocolFeeEvent.old0 = BigInt.fromI32(entity.feeProtocol0Old);
    protocolFeeEvent.old1 = BigInt.fromI32(entity.feeProtocol1Old);
    protocolFeeEvent.save();
  }
}

function updateTickFeeVarsAndSave(tick: Tick, entity: Entity): void {
  let poolAddress = Address.fromBytes(entity.getBytes('poolAddress'));
  let poolContract = PoolABI.bind(Address.fromBytes(poolAddress));
  let tickResult = poolContract.ticks(tick.tickIdx.toI32());
  tick.feeGrowthOutside0X128 = tickResult.value2;
  tick.feeGrowthOutside1X128 = tickResult.value3;
  tick.save();

  updateTickDayData(tick, entity);
}

function loadTickUpdateFeeVarsAndSave(tickId: i32, event: Entity): void {
  let poolAddress = event.getBytes('poolAddress');
  let tick = Tick.load(
    poolAddress.toHexString().concat('#').concat(tickId.toString()),
  );
  if (tick !== null) {
    updateTickFeeVarsAndSave(tick, event);
  }
}
