/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Entity } from '@graphprotocol/graph-ts';
import { Transaction } from '../../generated/schema';
import { ONE_BI, ZERO_BI, ZERO_BD, ONE_BD } from '../constants';

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1');
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'));
  }

  return bd;
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD;
  } else {
    return amount0.div(amount1);
  }
}

export function bigDecimalExponated(
  value: BigDecimal,
  power: BigInt,
): BigDecimal {
  if (power.equals(ZERO_BI)) {
    return ONE_BD;
  }
  let negativePower = power.lt(ZERO_BI);
  let result = ZERO_BD.plus(value);
  let powerAbs = power.abs();
  for (let i = ONE_BI; i.lt(powerAbs); i = i.plus(ONE_BI)) {
    result = result.times(value);
  }

  if (negativePower) {
    result = safeDiv(ONE_BD, result);
  }

  return result;
}

export function tokenAmountToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: BigInt,
): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function priceToDecimal(
  amount: BigDecimal,
  exchangeDecimals: BigInt,
): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return amount;
  }
  return safeDiv(amount, exponentToBigDecimal(exchangeDecimals));
}

export function equalToZero(value: BigDecimal): boolean {
  const formattedVal = parseFloat(value.toString());
  const zero = parseFloat(ZERO_BD.toString());
  if (zero == formattedVal) {
    return true;
  }
  return false;
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    '0x0000000000000000000000000000000000000000000000000000000000000001'
  );
}

export function bigDecimalExp18(): BigDecimal {
  return BigDecimal.fromString('1000000000000000000');
}

export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: BigInt,
): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function convertEthToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(BigInt.fromI32(18)));
}

export function loadTransaction(entity: Entity): Transaction {
  let transactionHash = entity.getBytes('transactionHash');
  let transactionGasPrice = entity.getBigInt('transactionGasPrice');
  let blockNumber = entity.getBigInt('blockNumber');
  let blockTimestamp = entity.getBigInt('blockTimestamp');

  let transaction = Transaction.load(transactionHash.toHexString());
  if (transaction === null) {
    transaction = new Transaction(transactionHash.toHexString());
  }
  transaction.blockNumber = blockNumber;
  transaction.timestamp = blockTimestamp;
  transaction.gasUsed = ZERO_BI; // event.transaction.gasUsed // This requires 'receipt: true' for the events, ignore this to speed up sync time?
  transaction.gasPrice = transactionGasPrice;
  transaction.save();
  return transaction as Transaction;
}
