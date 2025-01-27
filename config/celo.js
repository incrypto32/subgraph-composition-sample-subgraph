const NATIVE_ADDRESS = '0x471ece3750da237f93b8e339c536989b8978a438'
const WETH_ADDRESS = '0x122013fd7df1c6f636a5bb8f03108e876548b455'
const WETH2_ADDRESS = '0x66803fb87abd4aac3cbb3fad7c3aa01f6f3fb207'
const CEUR_ADDRESS = '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73'
const CUSD_ADDRESS = '0x765de816845861e75a25fca122bb6898b8b1282a'
const USDC_ADDRESS = '0xef4229c8c3250c675f21bcefa42f58efbff6002a'
const USDC2_ADDRESS = '0xceba9300f2b948710d2653dd7b07f33a8b32118c'
const USDT_ADDRESS = '0x88eec49252c8cbc039dcdb394c0c2ba2f1637ea0'
const WBTC_ADDRESS = '0xbaab46e28388d2779e6e31fd00cf0e5ad95e327b'
const DAI_ADDRESS = '0xe4fe50cdd716522a56204352f00aa110f731932d'
const DAI2_ADDRESS = '0x90ca507a5d4458a4c6c6249d186b6dcb02a5bccd'
const SUSHI_ADDRESS = '0x29dFce9c22003A4999930382Fd00f9Fd6133Acd1'

module.exports = {
  network: 'celo',
  sushi: { address: SUSHI_ADDRESS },
  minichef: {
    address: '0x8084936982d089130e001b470edf58faca445008',
    startBlock: 10186627,
    rewarder: {
      complex: {
        address: '0xfa3de59edd2500ba725dad355b98e6a4346ada7d',
        rewardToken: { address: NATIVE_ADDRESS }
      },
    },
  },
  bentobox: {
    address: '0x0711b6026068f736bae6b213031fce978d48e026',
    startBlock: 9451612,
  },
  legacy: {
    native: {
      address: NATIVE_ADDRESS,
    },
    whitelistedTokenAddresses: [
      // IMPORTANT! Native should be included here
      NATIVE_ADDRESS,
      WETH_ADDRESS,
      CEUR_ADDRESS,
      CUSD_ADDRESS,
      USDC_ADDRESS,
      USDT_ADDRESS,
      WBTC_ADDRESS,
      DAI_ADDRESS,
      DAI2_ADDRESS,
    ],
    stableTokenAddresses: [USDC_ADDRESS, USDT_ADDRESS, DAI_ADDRESS, DAI2_ADDRESS],
    minimumNativeLiquidity: 1,
    factory: {
      address: '0xc35dadb65012ec5796536bd9864ed8773abc74c4',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      startBlock: 7253488,
    },
  },
  v2: {
    nativeAddress: NATIVE_ADDRESS,
    whitelistAddresses: [
      // IMPORTANT! Native should be included here
      NATIVE_ADDRESS,
      WETH_ADDRESS,
      CEUR_ADDRESS,
      CUSD_ADDRESS,
      USDC_ADDRESS,
      USDT_ADDRESS,
      WBTC_ADDRESS,
      DAI_ADDRESS,
      DAI2_ADDRESS,
      SUSHI_ADDRESS,
      WETH2_ADDRESS,
      USDC2_ADDRESS
    ],
    stable0: USDC_ADDRESS,
    stable1: CUSD_ADDRESS,
    stable2: USDT_ADDRESS,
    minimumNativeLiquidity: 500,
    factory: {
      address: '0xc35dadb65012ec5796536bd9864ed8773abc74c4',
      initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
      startBlock: 7253488,
    }
  },
  furo: {
    stream: { address: '0x0000000000000000000000000000000000000000', startBlock: 0 },
    vesting: { address: '0x0000000000000000000000000000000000000000', startBlock: 0 },
  },
  auctionMaker: { address: '0x0000000000000000000000000000000000000000', startBlock: 0 },
  staking: { address: '0x0000000000000000000000000000000000000000', startBlock: 0 },
  blocks: {
    address: '0xc35dadb65012ec5796536bd9864ed8773abc74c4',
    startBlock: 0,
  },
  xswap: {
    address: '0x0000000000000000000000000000000000000000',
    startBlock: 0,
  },
  routeprocessor: {
    address: '0xcdbcd51a5e8728e0af4895ce5771b7d17ff71959',
    startBlock: 24238536,
  }
}
