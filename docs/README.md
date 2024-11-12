

## Subgraph Data Sources

Subgraph data sources enable a subgraph to depend on another subgraph as a data source, allowing one subgraph to consume and react to the data or entity changes of another subgraph. This feature facilitates **subgraph composition**, enabling modular subgraph architectures.

Rather than directly interacting with on-chain data, a subgraph can be set up to listen to updates from another subgraph and respond to entity changes. This can be used for a wide range of use cases, such as aggregating data from multiple subgraphs or triggering actions based on changes in external subgraph entities.

---

### Overview

Subgraph data sources allow a subgraph to act as a consumer of data from another subgraph. This is achieved by specifying the **source subgraph** in the manifest file of the dependent subgraph, along with a **start block** to begin indexing from.

When an entity in the source subgraph is updated, the dependent subgraph reacts to this change and runs handlers defined in the dependent subgraph's mapping file. These handlers allow developers to perform operations based on the data from the source subgraph, such as updating entities, making calculations, or triggering custom logic.

This feature enables more complex workflows, extending the capabilities of subgraphs by allowing them to interact with each other.

---

### How It Works

1. **Source Subgraph**: This subgraph provides the data for the dependent subgraph to consume. The source subgraph could be tracking events, logging transactions, or storing general data such as balances or user activity. It can be used for tracking any kind of on-chain data relevant to the dependent subgraph's logic

2. **Dependent Subgraph**: This subgraph depends on the data from the source subgraph. Instead of interacting with on-chain data, it references the source subgraph's entities and reacts to changes by running specific handler functions.

3. **Entity Changes**: The dependent subgraph listens for entity updates at the end of each block. When an entity in the source subgraph undergoes a change or update, the dependent subgraph detects this and triggers the corresponding handlers to process the updated data.

4. **Handlers**: When changes are detected in the source subgraph, the dependent subgraph executes handlers defined in the manifest to process the data. These handlers can perform any custom logic, such as updating entities, performing calculations, or triggering other workflows.

---

### Manifest Configuration

In the manifest of the dependent subgraph, you define the **subgraph datasource** by specifying the **source subgraph's deployment ID** and the **start block** from which indexing will begin. This setup allows the dependent subgraph to react to entity changes in the source subgraph.

Here’s a generic example of how the manifest for a dependent subgraph might look:

```yaml
specVersion: 1.3.0
schema:
  file: ./schema.graphql
dataSources:
  - kind: subgraph
    name: DataAggregator
    network: mainnet
    source:
      address: 'QmHASH'  # Source subgraph deployment ID
      startBlock: 1000000  # Block number to start indexing from
    mapping:
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      file: ./src/mappings/mapping.ts
      entities: []  # No entities defined here, as this is a data source
      abis:
        - name: CustomEntity
          file: ./abis/CustomEntity.json
      handlers:
        - entity: CustomEntity
          handler: handleCustomEntity
```

### Breakdown of the Manifest:
1. **specVersion**: Specifies the version of the subgraph manifest.
2. **schema**: Points to the schema file that defines the types and entities for the subgraph.
3. **dataSources**: The list of data sources for the subgraph, where we define the **subgraph** type, **source** subgraph address, and **startBlock**.
4. **mapping**: Contains the details of how to process the data from the source subgraph. It includes:
   - **apiVersion** and **language**: The version and language of the mapping.
   - **file**: The path to the mapping code.
   - **entities**: Specifies the entities this subgraph will interact with. In this case, it is empty as this subgraph is a consumer, not a producer of entities.
   - **abis**: Any ABIs required for interacting with the source subgraph, such as contract ABIs.
   - **handlers**: The list of handlers that are triggered by the changes in the source subgraph’s entities.

---

### Creating Handlers for Entity Changes

Once the source subgraph is set up as a data source, you will need to define handlers in the mapping file to process the changes in the entities from the source subgraph. These handlers are triggered whenever a relevant change occurs in the source subgraph.

Example handler in TypeScript:

```typescript
import { EntityTrigger, log } from '@graphprotocol/graph-ts'
import { CustomEntity } from '../generated/subgraph-QmHASH'

export function handleCustomEntityChange(
  trigger: EntityTrigger<CustomEntity>
): void {
  if (trigger.operation === EntityOp.Create) {
    /// Do something (e.g., create a new entity in the dependent subgraph)
  }

  if (trigger.operation === EntityOp.Update) {
    /// Do something (e.g., update an existing entity in the dependent subgraph)
  }

  if (trigger.operation === EntityOp.Remove) {
  /// Do something (e.g., remove an entity from the dependent subgraph)
  }
}
```
  
---



### Limitations

- **Entity Updates Only After Block Finalization**: Changes in the source subgraph are only available once a block has been finalized. Intermediate entity states within the block are not available; only final changes at the end of the block can be processed. It is recommended to design your source subgraphs in such a way that intermediate states are not required.

- **One Source Subgraph per Dependent Subgraph**: Currently, only one source subgraph can be specified per dependent subgraph. This limitation is planned to be lifted in future updates to allow multiple source subgraphs for greater flexibility.

- **No On-Chain Data Sources with Subgraph Data Sources**: When using subgraph data sources in a dependent subgraph, no other types of data sources (e.g., on-chain or file data sources) are allowed. Only the specified source subgraph can be used for fetching data.

---

### Conclusion

Subgraph data sources offer a powerful way to chain subgraphs together, creating more dynamic, modular subgraph architectures. By leveraging data from other subgraphs, you can build complex applications with decentralized data flows, making it easier to manage and react to updates in a decentralized manner.


