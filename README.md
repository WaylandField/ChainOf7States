

### Core Design Concept
This system utilizes blockchain technology to simulate the historical era of the Warring States period in China, focusing on the struggle for dominance among the seven powerful states. The project environment encompasses:

1.  **Oracle:** Simulates major events such as weather, wars, special historical events, etc.
2.  **National Central Currency Chains:** Facilitates commercial activities within each respective state.
3.  **National Currency Exchange Systems:** Supports the conversion of external currencies into the domestic monetary system, featuring dynamic exchange rates and taxes during conversion.
4.  **Unified Gold and Silver Settlement System:** A system where each state's currency can be settled against gold and silver.
5.  **Independent National Production:** Each state has its own independent output for agriculture, industry, and commerce. This output is influenced by events from the oracle.
6.  **Population Base:** Each state has its own population base, which is also affected by the oracle and influences the actual quantity of output.
7.  **RWA (Real World Asset) Support:** Uses NFTs to represent important assets such as cities, treasures (like the Heshibi jade), mines, pastures, forests, etc. Owning these NFTs also impacts production output.
8.  **Individual Affiliation and Wallets:** Individuals belong to a specific state and possess a wallet capable of holding currencies and NFTs from different states.
9.  **Asset Ownership:** Cities can only be owned by the Emperor, while other assets can be owned by individuals.

### Code Architecture

*   **`frontend`**: Frontend service.
*   **`contracts-l1`**: L1 contract service, handling gold and silver currency.
*   **`contracts-l2-template`**: L2 contract service. The seven states have similar monetary functions and are deployed using the same template.
*   **`oracle-service`**: Oracle service, includes historical events like weather changes, wars, etc.


### Demo
https://www.loom.com/share/02cd7b65dce34be2b18ba8490584c5f2


### Development Guide

#### Starting the Frontend Service
```shell
cd frontend
yarn run dev
```

#### Starting the Hardhat Service (Local Network)
```shell
cd contracts-l1
yarn hardhat node
```

#### Deploying the L2 Seven-States Economy System using Ignition
```shell
cd contracts-l2-template
yarn hardhat ignition deploy --network localhost ignition/modules/DeployStateEconomy.ts
```

#### Deploying the L1 Main Chain Currency (Gold) using Ignition
```shell
cd contracts-l1
yarn hardhat ignition deploy --network localhost ignition/modules/Gold.ts
```