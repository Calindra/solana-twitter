import { useWorkspace } from "@/composables";
import { JWKInterface } from "arweave/node/lib/wallet";

import Arweave from "arweave/web";
import pick from 'lodash.pick'
import { Metaplex, toBigNumber, UploadMetadataInput } from "@metaplex-foundation/js";
import { Connection } from "@solana/web3.js";

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

const generateImageURI = (transactionId: string): URL => new URL(transactionId, 'https://arweave.net')

const uploadMetadata = async (imageUrl: URL, mimeTypeImage: string, wallet: JWKInterface): Promise<string> => {
  const { program } = useWorkspace();
  const arweave = useArweave();


  const metadata: UploadMetadataInput = {
    name: 'NFT Profile Picture',
    description: 'This is a profile picture',
    // external_url: '' Twitter url
    attributes: [{
      trait_type: 'web',
      value: "yes"
    }],
    collection: {
      name: 'NFT Profile Picture',
      family: 'NFT Profile Picture',
    },
    properties: {
      files: [{
        type: mimeTypeImage,
        uri: imageUrl.toString(),
      }],
      category: 'image',
      maxSupply: 0,
      creators: [
        {
          address: program.value.programId.toString(),
          share: 100
        }
      ],
      image: imageUrl.toString(),
    }
  }

  const metadataRequest = JSON.stringify(metadata);

  const transaction = await arweave.createTransaction({
    data: metadataRequest,
  }, wallet);

  transaction.addTag("Content-Type", "application/json");

  await arweave.transactions.sign(transaction, wallet);

  console.log("metadata txid", transaction.id);

  const response = await arweave.transactions.post(transaction);

  console.log('Metadata transaction response', transaction);

  const { status } = response;

  if (status < 200 || status > 299) {
    throw new Error(`Failed to upload metadata, ${response.statusText}`, { cause: response });
  }

  return transaction.id;
}

export const saveJSONMetadata = async (jwk: JWKInterface, metadata: UploadMetadataInput) => {
  const value = JSON.stringify(metadata)
  const key = JSON.stringify(jwk)
  localStorage.setItem(key, value)
 }

 /**
  *
  * @see https://solanacookbook.com/references/nfts.html#mint-the-nft
  */
export const mintNFT = async (uri: URL) => {
  const { wallet,  connection } = useWorkspace();
  if (!wallet?.value) throw new Error("No wallet found");
  if (!wallet.value.connected) throw new Error("Wallet not connected");

  const conn = connection.value as any as Connection;

  const metaplex = new Metaplex(conn);

  // const keypair = Keypair.fromSecretKey(
  //   Buffer.from(JSON.parse(process.env.SOLANA_KEYPAIR!.toString()))
  // );

  const maxSupply = toBigNumber(1);

  const mintNFTResponse = await metaplex.nfts().create({
    uri: uri.toString(),
    maxSupply,
    name: 'Profile NFT',
    sellerFeeBasisPoints: 0,
  });
}

/**
 * @see https://solanacookbook.com/references/nfts.html#how-to-get-nft-metadata
 */
const getNFTMetadata = async () => {
  const { connection, program } = useWorkspace();
  const conn = connection.value as any as Connection;

  const metaplex = new Metaplex(conn);

  // const mint = new PublicKey("Ay1U9DWphDgc7hq58Yj1yHabt91zTzvV2YJbAWkPNbaK");

  // const nft = await metaplex.nfts().findByToken(program.value.programId);

}

export const uploadNFT = async (imageFile: File, keyFile ?: File) => {
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
