import { computed, Ref, ref, UnwrapRef } from 'vue'
import { AnchorWallet, useAnchorWallet } from 'solana-wallets-vue'
import { Connection, PublicKey } from '@solana/web3.js'
import { Address, AnchorProvider, Program } from '@project-serum/anchor'
import { ethers } from "ethers";
import idl from '@/anchor/idl/solana_twitter.json'
import { SolanaTwitter } from '@/anchor/types/solana_twitter';
import { getWorkspace, DevWorkspaceArgs, onWalletConnected } from 'solana-cartesi-web3-adapter';

interface WorkspaceLocal {
    wallet?: Ref<(AnchorWallet & { connected?: boolean }) | undefined>;
    program: Ref<UnwrapRef<Program<SolanaTwitter>>>;
    provider: Ref<UnwrapRef<AnchorProvider>>;
    signer?: ethers.Signer;
    connection: Connection;
}

const clusterUrl = process.env.VUE_APP_CLUSTER_URL as string
const preflightCommitment = 'processed'
const commitment = 'processed'
const programID = new PublicKey(idl.metadata.address)
let workspace: null | WorkspaceLocal = null

const config: DevWorkspaceArgs<SolanaTwitter> = {
    idl: idl as any,
    inspectURL: `${process.env.VUE_APP_CARTESI_INSPECT_URL}`,
    graphqlURL: `${process.env.VUE_APP_CARTESI_GRAPHQL_URL}`,
    contractAddress: `${process.env.VUE_APP_CARTESI_ROLLUPS}`,
    report: {
        maxRetry: 10,
        baseDelay: 1000,
    },
}

export const useWorkspace = () => {
    if (!workspace) {
        throw new Error('Workspace not initialized')
    }

    return workspace
}

export const initWorkspace = () => {
    if (isCartesiDAppEnv()) {
        createAdaptedWorkspace();
    } else {
        createWorkspace()
    }
}

export function isCartesiDAppEnv() {
    return localStorage.getItem('ctsi_sol') === '1'
}

export function getUserAddress(): Address {
    const { program, wallet } = useWorkspace()

    const owner = wallet?.value?.publicKey;

    if (!owner) {
        throw new Error('You must be connected')
    }

    const [user] = PublicKey.findProgramAddressSync([
        Buffer.from("user"),
        owner.toBuffer(),
    ], program.value.programId)

    return user;
}

function createWorkspace() {
    const wallet = useAnchorWallet()
    const connection = new Connection(clusterUrl, commitment)
    const provider = computed(() => {
        return new AnchorProvider(connection, (wallet.value || {}) as any, { preflightCommitment, commitment })
    })
    const program = computed(() => {
        return new Program<SolanaTwitter>(idl as any, programID, provider.value)
    })

    workspace = {
        wallet,
        connection,
        provider,
        program,
    }
}

export async function connectMetaMaskWallet() {
    const { ethereum } = window as any;
    if (!ethereum) {
        alert("Get MetaMask!");
        return;
    }
    // A Web3Provider wraps a standard Web3 provider, which is
    // what MetaMask injects as window.ethereum into each page
    const provider = new ethers.providers.Web3Provider(ethereum)

    // MetaMask requires requesting permission to connect users accounts
    await provider.send("eth_requestAccounts", []);

    // The MetaMask plugin also allows signing transactions to
    // send ether and pay to change state within the blockchain.
    // For this, you need the account signer...
    const signer = provider.getSigner()
    console.log("Signer", signer);
    await onWalletConnected({ ...config, signer });

    const { program, provider: providerEth, wallet, connection } = getWorkspace<SolanaTwitter>({ ...config, signer });
    if (!workspace) {
        workspace = {
            wallet: ref(wallet),
            connection,
            provider: ref(providerEth),
            program: ref(program),
        };

        return;
    }

    if (workspace.wallet) {
        workspace.wallet.value = wallet;
        workspace.wallet.value.connected = true;
    } else {
        workspace.wallet = ref(wallet);
    }

    workspace.program.value = program;
    workspace.provider.value = providerEth;
    workspace.signer = signer;
    workspace.connection = connection;
    workspace.wallet.value!.connected = true;
}

async function checkMetaMaskConnected() {
    if (!isCartesiDAppEnv()) {
        return;
    }
    const { ethereum } = window as any;
    if (!ethereum) {
        return;
    }
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length) {
        connectMetaMaskWallet()
    }
    ethereum.on('accountsChanged', checkMetaMaskConnected);
}

checkMetaMaskConnected()

function createAdaptedWorkspace() {
    try {
        const { connection, wallet, provider, program } = getWorkspace<SolanaTwitter>(config)
        workspace = {
            wallet: ref(wallet),
            connection,
            provider: ref(provider),
            program: ref(program),
        }
    } catch (error) {
        console.log(error);
    }
}
