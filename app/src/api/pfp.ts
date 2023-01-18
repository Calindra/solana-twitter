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

    const pfp = await hasPFP();


    const tokenAccount = getAssociatedTokenAddressSync(nft.mintAddress, owner)
    const [user] = PublicKey.findProgramAddressSync([
        Buffer.from("user"),
        owner.toBuffer(),
    ], program.value.programId)
    if (pfp) {
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

export async function hasPFP() {
    try {
        return getPFP()
    } catch (e) {
        return false
    }
}

export async function getPFP() {
    const { program, wallet, connection } = useWorkspace();
    const owner = wallet?.value?.publicKey;
    if (!owner) {
        alert('You must be connected');
        return;
    }
    const [user] = PublicKey.findProgramAddressSync([
        Buffer.from("user"),
        owner.toBuffer(),
    ], program.value.programId)
    const userData = await program.value.account.user.fetch(user)
    const metaplex = new Metaplex(connection)
    const nft = await metaplex.nfts().findByMint({ mintAddress: userData.pfp })
    const metadata = await fetchMetadata(nft)
    return metadata.image
}
