import { ref } from 'vue'
import { ethers } from 'ethers'
// import { useAnchorWallet } from 'solana-wallets-vue'
// import { Connection, PublicKey } from '@solana/web3.js'
// import { Provider, Program } from '@project-serum/anchor'
import idl from '@/idl/solana_twitter.json'
import { getWorkspace, onWalletConnected } from 'solana-cartesi-web3-adapter'

// const clusterUrl = process.env.VUE_APP_CLUSTER_URL
// const preflightCommitment = 'processed'
// const commitment = 'processed'
// const programID = new PublicKey(idl.metadata.address)
const config = {
    idl: idl,
    inspectURL: `${process.env.VUE_APP_CARTESI_INSPECT_URL}`,
    graphqlURL: `${process.env.VUE_APP_CARTESI_GRAPHQL_URL}`,
    contractAddress: `${process.env.VUE_APP_CONTRACT_ADDRESS}`,
    report: {
        maxRetry: 10,
        baseDelay: 1000,
    },
}

let workspace = null

export const useWorkspace = () => workspace

export const initWorkspace = () => {
    const { connection, wallet, provider, program } = getWorkspace(config)
    workspace = {
        wallet: ref(wallet),
        connection: connection,
        provider: ref(provider),
        program: ref(program),
    }

    // const wallet = useAnchorWallet()
    // const connection = new Connection(clusterUrl, commitment)
    // const provider = computed(() => new Provider(connection, wallet.value, { preflightCommitment, commitment }))
    // const program = computed(() => new Program(idl, programID, provider.value))

    // workspace = {
    //     wallet,
    //     connection,
    //     provider,
    //     program,
    // }
}

export async function connectMetaMaskWallet() {
    const { ethereum } = window;
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

    const { program, provider: providerEth, wallet, connection } = getWorkspace({ ...config, signer });
    if (!workspace) {
        workspace = {}
    }
    workspace.wallet.value = wallet;
    workspace.program.value = program;
    workspace.provider.value = providerEth;
    workspace.signer = signer;
    workspace.connection.value = connection;
    workspace.wallet.value.connected = true;
}

async function checkMetaMaskConnected() {
    const { ethereum } = window;
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
