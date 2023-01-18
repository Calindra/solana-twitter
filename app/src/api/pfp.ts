import { useWorkspace } from '@/composables';
import { Metaplex } from '@metaplex-foundation/js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { fetchMetadata } from './fetch-nft';

export async function setNFTasPFP(nft: any) {
    const { program, wallet } = useWorkspace();
    const owner = wallet?.value?.publicKey;
    if (!owner) {
        alert('You must be connected');
        return;
    }

    const userData = await getUserData();


    const tokenAccount = getAssociatedTokenAddressSync(nft.mintAddress, owner)
    const [user] = PublicKey.findProgramAddressSync([
        Buffer.from("user"),
        owner.toBuffer(),
    ], program.value.programId)
    if (userData) {
        await program.value.methods.update()
            .accounts({
                tokenAccount,
                user
            })
            .rpc()
    } else {
        await program.value.methods.initialize()
            .accounts({
                tokenAccount,
                user
            })
            .rpc()
    }
    location.reload();
}

export async function getUserData() {
    try {
        const { program, wallet } = useWorkspace();
        const owner = wallet?.value?.publicKey;
        if (!owner) {
            throw new Error('You must be connected');
        }
        const [user] = PublicKey.findProgramAddressSync([
            Buffer.from("user"),
            owner.toBuffer(),
        ], program.value.programId)
        const userData = await program.value.account.user.fetch(user)
        return userData
    } catch (e) {
        return null
    }
}

export async function getPFP(): Promise<string> {
    const { connection } = useWorkspace()
    const userData = await getUserData()
    if (!userData) return ''
    const metaplex = new Metaplex(connection)
    const nft = await metaplex.nfts().findByMint({ mintAddress: userData.pfp })
    const metadata = await fetchMetadata(nft)
    return metadata.image
}
