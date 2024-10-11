import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts';
import { Factory as FactoryContract } from '../../generated/Factory/Factory';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export const FACTORY_ADDRESS = Address.fromString(
  '0xc35dadb65012ec5796536bd9864ed8773abc74c4',
);
export const NETWORK = 'base';

export const ZERO_BI = BigInt.fromI32(0);
export const ONE_BI = BigInt.fromI32(1);
export const ZERO_BD = BigDecimal.fromString('0');
export const ONE_BD = BigDecimal.fromString('1');
export const BI_18 = BigInt.fromI32(18);

export const WHITELISTED_TOKEN_ADDRESSES: string[] =
  '0x4200000000000000000000000000000000000006,0x5c7e299cf531eb66f2a1df637d37abb78e6200c7,0xeb466342c4d449bc9f53a865d5cb90586f405215,0x8544fe9d190fd7ec52860abbf45088e81ee24a8c,0x81ab7e0d570b01411fcc4afd3d50ec8c241cb74b,0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca,0x50c5725949a6f0c72e6c4a641f24049a917db0cb,0x532f27101965dd16442e59d40670faf5ebb142e4,0xf6e932ca12afa26665dc4dde7e27be02a7c02e50,0x0d97f261b1e88845184f678e2d1e7a98d9fd38de,0x7f12d13b34f5f4f0a9449c16bcd42f0da47af200,0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22'.split(
    ',',
  );

export const NATIVE_ADDRESS = '0x4200000000000000000000000000000000000006';

export const STABLE_TOKEN_ADDRESSES: string[] =
  '0x5c7e299cf531eb66f2a1df637d37abb78e6200c7,0xeb466342c4d449bc9f53a865d5cb90586f405215,0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca,0x50c5725949a6f0c72e6c4a641f24049a917db0cb'.split(
    ',',
  );

export const MINIMUM_ETH_LOCKED = BigDecimal.fromString('1');

export const NATIVE_PRICE_POOL = Address.fromString(
  '0x6ecf6b2ca5b1681412839d9b72f43ff87acd3786',
)
  .toHex()
  .toLowerCase();

export const factoryContract = FactoryContract.bind(FACTORY_ADDRESS);
