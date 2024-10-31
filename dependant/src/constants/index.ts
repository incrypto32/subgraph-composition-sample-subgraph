import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { Factory as FactoryContract } from '../../generated/Factory/Factory'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const FACTORY_ADDRESS = Address.fromString('0x46B3fDF7b5CDe91Ac049936bF0bDb12c5d22202e')
export const NETWORK = 'scroll'

export const ZERO_BI = BigInt.fromI32(0)
export const ONE_BI = BigInt.fromI32(1)
export const ZERO_BD = BigDecimal.fromString('0')
export const ONE_BD = BigDecimal.fromString('1')
export const BI_18 = BigInt.fromI32(18)

export const WHITELISTED_TOKEN_ADDRESSES: string[] = '0x5300000000000000000000000000000000000004,0x3c1bca5a656e69edcd0d4e36bebb3fcdaca60cf1,0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4,0xca77eb3fefe3725dc33bccb54edefc3d9f764f97,0xf55bec9cafdbe8730f096aa55dad6d22d44099df,0xeb466342c4d449bc9f53a865d5cb90586f405215,0x406cde76a3fd20e48bc1e0f60651e60ae204b040,0xecc68d0451e20292406967fe7c04280e5238ac7d'.split(',')

export const NATIVE_ADDRESS = '0x5300000000000000000000000000000000000004'

export const STABLE_TOKEN_ADDRESSES: string[] = '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4,0xca77eb3fefe3725dc33bccb54edefc3d9f764f97,0xf55bec9cafdbe8730f096aa55dad6d22d44099df,0xeb466342c4d449bc9f53a865d5cb90586f405215'.split(',')

export const MINIMUM_ETH_LOCKED = BigDecimal.fromString('1')

export const NATIVE_PRICE_POOL = Address.fromString('0xe64ae4128e725868e8fe52e771e3d272e787b041').toHex().toLowerCase()


export const factoryContract = FactoryContract.bind(FACTORY_ADDRESS)
