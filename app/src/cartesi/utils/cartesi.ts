import { Provider } from "@ethersproject/providers";
import { Signer } from "ethers";
import {
    InputFacet,
    InputFacet__factory,
    OutputFacet,
    OutputFacet__factory,
    ERC20PortalFacet,
    ERC20PortalFacet__factory,
} from "@cartesi/rollups";

export interface Args {
    dapp: string;
    address?: string;
    addressFile?: string;
}

interface Contracts {
    inputContract: InputFacet;
    outputContract: OutputFacet;
    erc20Portal: ERC20PortalFacet;
}

const contractAddress = '0xF8C694fd58360De278d5fF2276B7130Bfdc0192A';

/**
 * Connect to instance of Rollups application
 * @param chainId number of chain id of connected network
 * @param provider provider or signer of connected network
 * @param args args for connection logic
 * @returns Connected rollups contracts
 */
 export const cartesiRollups = async (
    provider: Provider | Signer
): Promise<Contracts> => {
    console.log(`connect to contracts address=${contractAddress}`);
    const inputContract = InputFacet__factory.connect(contractAddress, provider);
    const outputContract = OutputFacet__factory.connect(contractAddress, provider);
    const erc20Portal = ERC20PortalFacet__factory.connect(contractAddress, provider);
    return {
        inputContract,
        outputContract,
        erc20Portal,
    };
};