import { useWorkspace } from "@/composables";
import { JWKInterface } from "arweave/node/lib/wallet";

import Arweave, { Config } from "arweave/web";

class ArweaveTool {
  private static instance?: Arweave;
  public static getInstance(): Arweave {
    if (!ArweaveTool.instance) {
      ArweaveTool.instance = Arweave.init({
        logging: true,
      });
    }
    return ArweaveTool.instance;
  }
}

export function useArweave(): Arweave {
  const arweave = ArweaveTool.getInstance();

  arweave.network.getInfo().then(console.log);

  return arweave;
}

async function generateWallet(): Promise<[wallet: JWKInterface, err: null] | [wallet: null, err: Error]> {
  try {
    const arweave = ArweaveTool.getInstance();
    const wallet = await arweave.wallets.generate();
    return [wallet, null];
  } catch(e) {
    const error = new Error("Failed to generate wallet", { cause: e });
    console.log("error", { error });
    return [null, error];
  }
}

export const uploadNFT = async (file: File) => {
  // const { } = useWorkspace();

  console.log("uploading NFT", { file });
  const arrayBuffer = await file.arrayBuffer();
  console.log("arrayBuffer", { arrayBuffer });

  const arweave = useArweave();

  const [key, err] = await generateWallet();

  if (err) {
    console.log("err", { err });
    return;
  }

  const transaction = await arweave.createTransaction({
    data: arrayBuffer,
  }, key);

  transaction.addTag("Content-Type", file.type);
  console.log("transaction", { transaction, key });

  await arweave.transactions.sign(transaction, key);

  const response = await arweave.transactions.post(transaction);
  console.log("response", { response });
};
