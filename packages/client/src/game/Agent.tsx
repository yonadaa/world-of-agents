import { useRecords } from "@latticexyz/stash/react";
import { stash } from "../mud/stash";
import { useWorldContract } from "../mud/useWorldContract";
import { AsyncButton } from "../ui/AsyncButton";
import mudConfig from "contracts/mud.config";
import { useAccount } from "wagmi";
import { useSync } from "@latticexyz/store-sync/react";
import { getAction } from "./getAction";
import { useState } from "react";
import { useTrees } from "./useTrees";

export function Agent() {
  const [goal, setGoal] = useState("Move towards the closest tree.");
  const [call, setCall] = useState<{ functionName: string; args: unknown[] }>();
  const [reasoning, setReasoning] = useState("...");

  const sync = useSync();
  const worldContract = useWorldContract();
  const { address: userAddress } = useAccount();

  const players = useRecords({ stash, table: mudConfig.tables.app__Position });
  const currentPlayer = players.find(
    (player) => player.player.toLowerCase() === userAddress?.toLowerCase()
  );

  const trees = useTrees();

  async function onClick() {
    if (sync.data && worldContract && userAddress && currentPlayer) {
      const state = {
        players: players.map((player) => ({
          player: player.player,
          x: player.x,
          y: player.y,
        })),
        trees,
      };

      const action = await getAction(state, userAddress, goal);

      if (action.functionName === "move") {
        const tx = await worldContract.write.app__move(action.args as [number]);
        await sync.data.waitForTransaction(tx);
      }
      if (action.functionName === "harvest") {
        const tx = await worldContract.write.app__harvest();
        await sync.data.waitForTransaction(tx);
      }

      setReasoning(action.chainOfThought);
      setCall({ functionName: action.functionName, args: action.args });
    }
  }

  return (
    <div className="absolute left-0 top-0 flex flex-col m-2 border-2 w-96">
      <div className="flex flex-row ">
        <form className="bg-white shadow-md rounded">
          <input
            className="shadow appearance-none border rounded py-2 px-3 w-full h-16 w-64 text-gray-700 focus:outline-none focus:shadow-outline"
            type="text"
            onChange={(event) => {
              setGoal(event.target.value);
            }}
            value={goal}
          />
        </form>
        <AsyncButton
          className="group outline-0 p-4 border-4 border-green-400 transition ring-green-300 hover:ring-4 active:scale-95 rounded-lg font-medium aria-busy:pointer-events-none aria-busy:animate-pulse"
          onClick={onClick}
        >
          Act<span className="hidden group-aria-busy:inline">ing…</span>
        </AsyncButton>
      </div>
      <div className="p-2 border-2" style={{ whiteSpace: "pre-line" }}>
        {reasoning}
      </div>
      <div className="p-2 border-2">
        <div>{call ? `functionName: ${call.functionName}` : null}</div>
        <div>{call ? `args: [${call.args.toString()}]` : null}</div>
      </div>
    </div>
  );
}
