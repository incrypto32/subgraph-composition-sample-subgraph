import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Burn,
  Collect,
  CollectProtocol,
  Flash,
  IncreaseObservationCardinalityNext,
  Initialize,
  Mint,
  SetFeeProtocol,
  Swap
} from "../generated/UniswapV3Pool/UniswapV3Pool"

export function createBurnEvent(
  owner: Address,
  tickLower: i32,
  tickUpper: i32,
  amount: BigInt,
  amount0: BigInt,
  amount1: BigInt
): Burn {
  let burnEvent = changetype<Burn>(newMockEvent())

  burnEvent.parameters = new Array()

  burnEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  burnEvent.parameters.push(
    new ethereum.EventParam("tickLower", ethereum.Value.fromI32(tickLower))
  )
  burnEvent.parameters.push(
    new ethereum.EventParam("tickUpper", ethereum.Value.fromI32(tickUpper))
  )
  burnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  burnEvent.parameters.push(
    new ethereum.EventParam(
      "amount0",
      ethereum.Value.fromUnsignedBigInt(amount0)
    )
  )
  burnEvent.parameters.push(
    new ethereum.EventParam(
      "amount1",
      ethereum.Value.fromUnsignedBigInt(amount1)
    )
  )

  return burnEvent
}

export function createCollectEvent(
  owner: Address,
  recipient: Address,
  tickLower: i32,
  tickUpper: i32,
  amount0: BigInt,
  amount1: BigInt
): Collect {
  let collectEvent = changetype<Collect>(newMockEvent())

  collectEvent.parameters = new Array()

  collectEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  collectEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  collectEvent.parameters.push(
    new ethereum.EventParam("tickLower", ethereum.Value.fromI32(tickLower))
  )
  collectEvent.parameters.push(
    new ethereum.EventParam("tickUpper", ethereum.Value.fromI32(tickUpper))
  )
  collectEvent.parameters.push(
    new ethereum.EventParam(
      "amount0",
      ethereum.Value.fromUnsignedBigInt(amount0)
    )
  )
  collectEvent.parameters.push(
    new ethereum.EventParam(
      "amount1",
      ethereum.Value.fromUnsignedBigInt(amount1)
    )
  )

  return collectEvent
}

export function createCollectProtocolEvent(
  sender: Address,
  recipient: Address,
  amount0: BigInt,
  amount1: BigInt
): CollectProtocol {
  let collectProtocolEvent = changetype<CollectProtocol>(newMockEvent())

  collectProtocolEvent.parameters = new Array()

  collectProtocolEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  collectProtocolEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  collectProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "amount0",
      ethereum.Value.fromUnsignedBigInt(amount0)
    )
  )
  collectProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "amount1",
      ethereum.Value.fromUnsignedBigInt(amount1)
    )
  )

  return collectProtocolEvent
}

export function createFlashEvent(
  sender: Address,
  recipient: Address,
  amount0: BigInt,
  amount1: BigInt,
  paid0: BigInt,
  paid1: BigInt
): Flash {
  let flashEvent = changetype<Flash>(newMockEvent())

  flashEvent.parameters = new Array()

  flashEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  flashEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  flashEvent.parameters.push(
    new ethereum.EventParam(
      "amount0",
      ethereum.Value.fromUnsignedBigInt(amount0)
    )
  )
  flashEvent.parameters.push(
    new ethereum.EventParam(
      "amount1",
      ethereum.Value.fromUnsignedBigInt(amount1)
    )
  )
  flashEvent.parameters.push(
    new ethereum.EventParam("paid0", ethereum.Value.fromUnsignedBigInt(paid0))
  )
  flashEvent.parameters.push(
    new ethereum.EventParam("paid1", ethereum.Value.fromUnsignedBigInt(paid1))
  )

  return flashEvent
}

export function createIncreaseObservationCardinalityNextEvent(
  observationCardinalityNextOld: i32,
  observationCardinalityNextNew: i32
): IncreaseObservationCardinalityNext {
  let increaseObservationCardinalityNextEvent =
    changetype<IncreaseObservationCardinalityNext>(newMockEvent())

  increaseObservationCardinalityNextEvent.parameters = new Array()

  increaseObservationCardinalityNextEvent.parameters.push(
    new ethereum.EventParam(
      "observationCardinalityNextOld",
      ethereum.Value.fromUnsignedBigInt(
        BigInt.fromI32(observationCardinalityNextOld)
      )
    )
  )
  increaseObservationCardinalityNextEvent.parameters.push(
    new ethereum.EventParam(
      "observationCardinalityNextNew",
      ethereum.Value.fromUnsignedBigInt(
        BigInt.fromI32(observationCardinalityNextNew)
      )
    )
  )

  return increaseObservationCardinalityNextEvent
}

export function createInitializeEvent(
  sqrtPriceX96: BigInt,
  tick: i32
): Initialize {
  let initializeEvent = changetype<Initialize>(newMockEvent())

  initializeEvent.parameters = new Array()

  initializeEvent.parameters.push(
    new ethereum.EventParam(
      "sqrtPriceX96",
      ethereum.Value.fromUnsignedBigInt(sqrtPriceX96)
    )
  )
  initializeEvent.parameters.push(
    new ethereum.EventParam("tick", ethereum.Value.fromI32(tick))
  )

  return initializeEvent
}

export function createMintEvent(
  sender: Address,
  owner: Address,
  tickLower: i32,
  tickUpper: i32,
  amount: BigInt,
  amount0: BigInt,
  amount1: BigInt
): Mint {
  let mintEvent = changetype<Mint>(newMockEvent())

  mintEvent.parameters = new Array()

  mintEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam("tickLower", ethereum.Value.fromI32(tickLower))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam("tickUpper", ethereum.Value.fromI32(tickUpper))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  mintEvent.parameters.push(
    new ethereum.EventParam(
      "amount0",
      ethereum.Value.fromUnsignedBigInt(amount0)
    )
  )
  mintEvent.parameters.push(
    new ethereum.EventParam(
      "amount1",
      ethereum.Value.fromUnsignedBigInt(amount1)
    )
  )

  return mintEvent
}

export function createSetFeeProtocolEvent(
  feeProtocol0Old: i32,
  feeProtocol1Old: i32,
  feeProtocol0New: i32,
  feeProtocol1New: i32
): SetFeeProtocol {
  let setFeeProtocolEvent = changetype<SetFeeProtocol>(newMockEvent())

  setFeeProtocolEvent.parameters = new Array()

  setFeeProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "feeProtocol0Old",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeProtocol0Old))
    )
  )
  setFeeProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "feeProtocol1Old",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeProtocol1Old))
    )
  )
  setFeeProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "feeProtocol0New",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeProtocol0New))
    )
  )
  setFeeProtocolEvent.parameters.push(
    new ethereum.EventParam(
      "feeProtocol1New",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeProtocol1New))
    )
  )

  return setFeeProtocolEvent
}

export function createSwapEvent(
  sender: Address,
  recipient: Address,
  amount0: BigInt,
  amount1: BigInt,
  sqrtPriceX96: BigInt,
  liquidity: BigInt,
  tick: i32
): Swap {
  let swapEvent = changetype<Swap>(newMockEvent())

  swapEvent.parameters = new Array()

  swapEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  swapEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  swapEvent.parameters.push(
    new ethereum.EventParam("amount0", ethereum.Value.fromSignedBigInt(amount0))
  )
  swapEvent.parameters.push(
    new ethereum.EventParam("amount1", ethereum.Value.fromSignedBigInt(amount1))
  )
  swapEvent.parameters.push(
    new ethereum.EventParam(
      "sqrtPriceX96",
      ethereum.Value.fromUnsignedBigInt(sqrtPriceX96)
    )
  )
  swapEvent.parameters.push(
    new ethereum.EventParam(
      "liquidity",
      ethereum.Value.fromUnsignedBigInt(liquidity)
    )
  )
  swapEvent.parameters.push(
    new ethereum.EventParam("tick", ethereum.Value.fromI32(tick))
  )

  return swapEvent
}
