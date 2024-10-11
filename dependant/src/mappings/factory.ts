import {
  FACTORY_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO,
  WHITELISTED_TOKEN_ADDRESSES,
} from './../constants';
import { Factory } from '../../generated/schema';
import { Pool, Token, Bundle } from '../../generated/schema';
import {
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenTotalSupply,
  fetchTokenDecimals,
} from '../utils/token';
import { log, BigInt, Address } from '@graphprotocol/graph-ts';
import { EntityOp, EntityTrigger } from '../utils/entityTrigger';

export function handlePoolCreated(event: EntityTrigger): void {
  if (event.entityOp === EntityOp.Create) {
    let entity = event.entity;
    let poolParam = entity.getBytes('pool');
    let feeParam = entity.getI32('fee');
    let token0Param = Address.fromBytes(entity.getBytes('token0'));
    let token1Param = Address.fromBytes(entity.getBytes('token1'));
    let blockTimestamp = entity.getBigInt('blockTimestamp');
    let blockNumber = entity.getBigInt('blockNumber');

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

    let pool = new Pool(poolParam.toHexString()) as Pool;
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
    pool.feeTier = BigInt.fromI32(feeParam);
    pool.createdAtTimestamp = blockTimestamp;
    pool.createdAtBlockNumber = blockNumber;
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
