import { useWorkspace } from "@/composables";
import { JWKInterface } from "arweave/node/lib/wallet";

import Arweave from "arweave/web";
import Transactions from "arweave/web/transactions";
import pick from 'lodash.pick'
import { Keypair } from '@solana/web3.js'
import { Metadata } from '@metaplex-foundation/js'

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

function castValidJSON(contentFile: string): JWKInterface {
  try {
    const inter: unknown = JSON.parse(contentFile);

    if (typeof inter !== "object" || inter === null) {
      throw new Error("Invalid parse JSON");
    }

    if (!("kty" in inter && "e" in inter && "n" in inter)) {
      throw new Error("Invalid required property");
    }

    const cast = inter as JWKInterface;

    const picked = pick(cast, [
      "kty",
      "e",
      "n",
      "d",
      "p",
      "q",
      "dp",
      "dq",
      "qi",
    ]);

    return picked;
  } catch (e) {
    throw new Error("Invalid JSON", { cause: e });
  }
}

async function getWalletFromKey(contentFile: string) {
  // const arweave = ArweaveTool.getInstance();
  const validJson = castValidJSON(contentFile);

  return validJson;
  // return await arweave.wallets.jwkToAddress(validJson);
}

export const uploadKey = async (file: File) => {
  if(!file.type.startsWith("application/json")) {
    throw new Error("Invalid file type");
  }

  const contentFile = await file.text();
  return await getWalletFromKey(contentFile);
}

const uploadMetadata = async () => {
  // const metadata: Metadata = {
  //   name: "Twitter Profile Image NFT",
  //   model: 'metadata',
  //   symbol: "",
  //   tokenStandard: 0,
  //   address: "",

  // }


}

type ResponseTransaction = Awaited<ReturnType<Transactions['post']>>

export const saveJSONMetadata = async (jwk: JWKInterface, metadata: ResponseTransaction) => {
  const value = JSON.stringify(metadata)
  const key = JSON.stringify(jwk)
  localStorage.setItem(key, value)
 }

export const mintNFT = async (uri: URL) => {
  const { connection } = useWorkspace();
  const keypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.SOLANA_KEYPAIR!.toString()))
  );
}

export const uploadNFT = async (imageFile: File, keyFile ?: File) => {
  // const { } = useWorkspace();

  console.log("uploading NFT", { imageFile, keyFile });
  const arrayBuffer = await imageFile.arrayBuffer();
  console.log("arrayBuffer", { arrayBuffer });

  const arweave = useArweave();

  if(!keyFile) throw new Error("No key file provided")

  const key = await uploadKey(keyFile);


  // const [key, err] = await generateWallet();

  // if (err) {
  //   console.log("err", { err });
  //   return;
  // }

  const transaction = await arweave.createTransaction({
    data: arrayBuffer,
  }, key);

  transaction.addTag("Content-Type", imageFile.type);
  console.log("transaction", { transaction, key });

  await arweave.transactions.sign(transaction, key);

  const response = await arweave.transactions.post(transaction);
  console.log("response", { response });

  await saveJSONMetadata(key, response);
};
