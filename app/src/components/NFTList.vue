<script setup>
import { ref, watchEffect } from 'vue';
import { useWallet } from 'solana-wallets-vue';
import { useWorkspace } from '@/composables';
import { Metaplex } from "@metaplex-foundation/js";
import NFTCard from '@/components/NFTCard';
const { connected: useWalletConnected } = useWallet()


const { wallet, connection } = useWorkspace()

const allNFTs = ref([]);
watchEffect(() => {
    if (wallet?.value?.connected || useWalletConnected) {
        listNFTs(wallet.value, connection.value);
    }
})

async function listNFTs(wallet, connection) {
    if (!wallet?.publicKey) return;
    const metaplex = new Metaplex(connection);
    const nfts = await metaplex.nfts().findAllByOwner({ owner: wallet.publicKey });
    allNFTs.value = nfts;
}

</script>
<template>
    <NFT-card v-for="nft in allNFTs" :nft="nft" :key="nft.key"></NFT-card>
</template>