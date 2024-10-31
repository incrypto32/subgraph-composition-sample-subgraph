# Subgraph Composition Example

This example demonstrates how to use one subgraph as a data source for another, leveraging the Sushiswap v3 subgraph on the Base chain. The setup involves two subgraphs:

1. **Source Subgraph**: Tracks event data as entities.
2. **Dependent Subgraph**: Uses the source subgraph as a data source.

These subgraphs are located in the `source` and `dependent` directories, respectively.

The **source subgraph** is a basic event-tracking subgraph that records events emitted by relevant contracts. The **dependent subgraph** references the source subgraph as a data source, using the entities from the source as triggers. While the source subgraph is a standard subgraph, the dependent subgraph utilizes the subgraph composition feature.

## Source Subgraph

The source subgraph tracks events from the Sushiswap v3 subgraph on the Base chain. This subgraph’s configuration file is located in the `source/subgraph.yaml`.

## Dependent Subgraph

The dependent subgraph, located in the `dependent/subgraph.yaml`, specifies the source subgraph as a data source. This subgraph uses entities from the source as triggers, defining specific actions in response to entity changes.

To set the source subgraph as a data source in the dependent subgraph, include the following in `subgraph.yaml`:

```yaml
specVersion: 1.3.0
schema:
  file: ./schema.graphql
dataSources:
  - kind: subgraph
    name: Factory
    network: scroll
    source:
      address: 'QmdXu8byAFCGSDWsB5gMQjWr6GUvEVB7S1hemfxNuomerz'
      startBlock: 82522
```

Here, `source.address` refers to the Deployment ID of the source subgraph, and `startBlock` specifies the block from which indexing should begin.

### Defining Handlers

Below is an example of defining handlers in the dependent subgraph:

```typescript
export function handleInitialize(trigger: EntityTrigger<Initialize>): void {
  if (trigger.operation === EntityOp.Create) {
    let entity = trigger.data;
    let poolAddressParam = Address.fromBytes(entity.poolAddress);

    // Update pool sqrt price and tick
    let pool = Pool.load(poolAddressParam.toHexString()) as Pool;
    pool.sqrtPrice = entity.sqrtPriceX96;
    pool.tick = BigInt.fromI32(entity.tick);
    pool.save();

    // Update token prices
    let token0 = Token.load(pool.token0) as Token;
    let token1 = Token.load(pool.token1) as Token;

    // Update ETH price in USD
    let bundle = Bundle.load('1') as Bundle;
    bundle.ethPriceUSD = getEthPriceInUSD();
    bundle.save();

    updatePoolDayData(entity);
    updatePoolHourData(entity);

    // Update derived ETH price for tokens
    token0.derivedETH = findEthPerToken(token0);
    token1.derivedETH = findEthPerToken(token1);
    token0.save();
    token1.save();
  }
}
```

In this example, the `handleInitialize` function is triggered when a new `Initialize` entity is created in the source subgraph, passed as `EntityTrigger<Initialize>`. The handler updates the pool and token entities based on data from the new `Initialize` entity.

`EntityTrigger` has three fields:

1. `operation`: Specifies the operation type, which can be `Create`, `Modify`, or `Remove`.
2. `type`: Indicates the entity type.
3. `data`: Contains the entity data.

Developers can then determine specific actions for the entity data based on the operation type.