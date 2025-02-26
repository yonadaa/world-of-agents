import { GameMap } from "./GameMap";
import mudConfig from "contracts/mud.config";
import { useWorldContract } from "../mud/useWorldContract";
import { stash } from "../mud/stash";
import { useSync } from "@latticexyz/store-sync/react";
import { useMemo } from "react";
import { Direction } from "../common";
import { Spawn } from "./Spawn";
import { useKeyboardMovement } from "./useKeyboardMovement";
import { Agent } from "./Agent";
import { useAccount } from "wagmi";
import { useRecords } from "@latticexyz/stash/react";

export function Game() {
  const sync = useSync();
  const worldContract = useWorldContract();
  const { address: userAddress } = useAccount();

  const onMove = useMemo(
    () =>
      sync.data && worldContract
        ? async (direction: Direction) => {
            const tx = await worldContract.write.app__move([
              mudConfig.enums.Direction.indexOf(direction),
            ]);
            await sync.data.waitForTransaction(tx);
          }
        : undefined,
    [sync.data, worldContract]
  );

  const onHarvest = useMemo(
    () =>
      sync.data && worldContract
        ? async () => {
            const tx = await worldContract.write.app__harvest();
            await sync.data.waitForTransaction(tx);
          }
        : undefined,
    [sync.data, worldContract]
  );

  useKeyboardMovement(onMove, onHarvest);

  const players = useRecords({ stash, table: mudConfig.tables.app__Position });
  const currentPlayer = players.find(
    (player) => player.player.toLowerCase() === userAddress?.toLowerCase()
  );

  return (
    <div>
      <GameMap />
      <Spawn onMove={onMove} />
      {currentPlayer ? <Agent /> : null}
    </div>
  );
}
