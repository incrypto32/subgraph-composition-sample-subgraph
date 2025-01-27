const NATIVE_ADDRESS = '0x4200000000000000000000000000000000000006'
const OP_ADDRESS = '0x4200000000000000000000000000000000000042'
const WBTC_ADDRESS = '0x68f180fcce6836688e9084f035309e29bf0a2095'
const USDC_ADDRESS = '0x7f5c764cbc14f9669b88837ca1490cca17c31607'
const USDT_ADDRESS = '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58'
const DAI_ADDRESS = '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1'
const SUSD_ADDRESS = '0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9'
const SUSHI_ADDRESS = '0x3eaeb77b03dbc0f6321ae1b72b2e9adb0f60112b'
const USDC_CIRCLE_ADDRESS = '0x0b2c639c533813f4aa9d7837caf62653d097ff85'
const WSTETH_ADDRESS = '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb'

module.exports = {
  network: 'optimism',
  sushi: { address: SUSHI_ADDRESS },
  minichef: {
    address: '0xb25157bf349295a7cd31d1751973f426182070d6',
    startBlock: 72848630,
    rewarder: {
      complex: {
        address: '0x320a04b981c092884a9783cde907578f613ef773',
        rewardToken: { address: OP_ADDRESS },
      },
    },
  },
  bentobox: {
    address: '0xc35dadb65012ec5796536bd9864ed8773abc74c4',
    base: 'QmYJh2tYmFv9yGxeyRHDTKKCFgyHAv7wgczpWojF5B4BqN',
    startBlock: 7019815,
  },
  trident: {
    masterDeployer: { address: '0xcaabdd9cf4b61813d4a52f980d6bc1b713fe66f5', startBlock: 7464195 },
    concentratedLiquidityPoolFactory: { address: '0x0000000000000000000000000000000000000000' },
    constantProductPoolFactory: {
      address: '0x93395129bd3fcf49d95730d3c2737c17990ff328',
      initCodeHash: '0x3172d82413be467c1130709f7479a07def9b99caf8e0059f248c131081e4ea09',
    },
    stablePoolFactory: { address: '0x827179dD56d07A7eeA32e3873493835da2866976' },
    hybridPoolFactory: { address: '0x0000000000000000000000000000000000000000' },
    indexPoolFactory: { address: '0x0000000000000000000000000000000000000000' },
    native: { address: NATIVE_ADDRESS },
    whitelistedTokenAddresses: [
      // WNATIVE - This is actually quite important, though uneeded here anymore since
      // it's now apart of the whitelisted token check in createPair, because the
      // base should always be whitelisted or pricing never begins.
      NATIVE_ADDRESS,
      WBTC_ADDRESS,
      USDC_ADDRESS,
      USDT_ADDRESS,
      DAI_ADDRESS,
      OP_ADDRESS,
      SUSD_ADDRESS,
    ],
    stableTokenAddresses: [
      // USDC
      USDC_ADDRESS,
      // USDT
      USDT_ADDRESS,
      // DAI
      DAI_ADDRESS,
    ],
    // List of STABLE/NATIVE pools to use to price NATIVE in USD
    stablePoolAddresses: [
      // USDC/WETH/30/FALSE
      '0x1e31a2c6e6614273d740358affb46bef180efb7b',
    ],
    tokensToPriceOffNative: [
      // These tokens will be priced off the NATIVE token
      USDC_ADDRESS,
    ],
    minimumNativeLiquidity: '0.01', // Threshold for being considered for pricing
  },
  v2: {
    nativeAddress: NATIVE_ADDRESS,
    whitelistAddresses: [
      // IMPORTANT! Native should be included here
      NATIVE_ADDRESS,
      WBTC_ADDRESS,
      USDC_ADDRESS,
      USDT_ADDRESS,
      DAI_ADDRESS,
      OP_ADDRESS,
      SUSD_ADDRESS,
      USDC_CIRCLE_ADDRESS,
      SUSHI_ADDRESS,
      WSTETH_ADDRESS
    ],
    stable0: USDC_ADDRESS,
    stable1: USDT_ADDRESS,
    stable2: DAI_ADDRESS,
    minimumNativeLiquidity: 0.7,
    factory: {
      address: '0xfbc12984689e5f15626bad03ad60160fe98b303c',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      startBlock: 110882086,
    }
  },
  v3: {
    factory: {
      address: '0x9c6522117e2ed1fe5bdb72bb0ed5e3f2bde7dbe0',
      startBlock: 85432013,
    },
    positionManager: {
      address: '0x1af415a1eba07a4986a52b6f2e7de7003d82231e',
      startBlock: 85528596,
    },
    native: { address: NATIVE_ADDRESS },
    whitelistedTokenAddresses: [
      // IMPORTANT! Native should be included here
      NATIVE_ADDRESS,
      WBTC_ADDRESS,
      USDC_ADDRESS,
      USDT_ADDRESS,
      DAI_ADDRESS,
      OP_ADDRESS,
      SUSD_ADDRESS,
    ],
    stableTokenAddresses: [USDC_ADDRESS, USDT_ADDRESS, DAI_ADDRESS],
    nativePricePool: '0x79e11ef350d7c73925f8d0037c2dd1b8ced41533',
    minimumEthLocked: 0.7,
  },
  furo: {
    stream: { address: '0x4ab2fc6e258a0ca7175d05ff10c5cf798a672cae', startBlock: 10835062 },
    vesting: { address: '0x0689640d190b10765f09310fcfe9c670ede4e25b', startBlock: 10835089 },
  },
  auctionMaker: { address: '0x0000000000000000000000000000000000000000', startBlock: 0 },
  staking: { address: '0x0000000000000000000000000000000000000000', startBlock: 0 },
  blocks: {
    address: '0xfbc12984689e5f15626bad03ad60160fe98b303c',
    startBlock: 0,
  },
  xswap: {
    address: '0x8b396ddf906d552b2f98a8e7d743dd58cd0d920f',
    startBlock: 15265298,
  },
  stargate: {
    usdcPool: { address: '0xdecc0c09c3b5f6e92ef4184125d5648a66e35298', startBlock: 4535509 },
    usdtPool: { address: '0x0000000000000000000000000000000000000000', startBlock: 0 },
  },
  legacy: {
    native: { address: NATIVE_ADDRESS },
    whitelistedTokenAddresses: [
      // IMPORTANT! Native should be included here
      NATIVE_ADDRESS,
      WBTC_ADDRESS,
      USDC_ADDRESS,
      USDT_ADDRESS,
      DAI_ADDRESS,
      OP_ADDRESS,
      SUSD_ADDRESS,
    ],
    stableTokenAddresses: [USDC_ADDRESS, USDT_ADDRESS, DAI_ADDRESS],
    minimumNativeLiquidity: 0.7,
    factory: {
      address: '0xfbc12984689e5f15626bad03ad60160fe98b303c',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      startBlock: 110882086,
    },
  },
  routeprocessor: {
    address: '0x1f2fcf1d036b375b384012e61d3aa33f8c256bbe',
    startBlock: 116630702,
  }
}
