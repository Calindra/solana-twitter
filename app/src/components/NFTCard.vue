<script setup>
import { ref, toRefs } from 'vue';
import { fetchMetadata, setNFTasPFP } from '@/api'

const image = ref({ src: '' })
const props = defineProps({
    nft: Object,
})
const { nft } = toRefs(props)

loadImage();

async function loadImage() {
    const metadata = await fetchMetadata(nft.value);
    image.value.src = metadata.image;
}

async function setPFP() {
    setNFTasPFP(nft.value)
}

</script>
<template>
    <div class="p-3 rounded-md">
        <img :src="image.src" alt="Image from NFT wallet" />
        <button class="cursor-pointer m-auto mt-3 text-white px-9 py-2.5 rounded-full font-semibold bg-pink-500 hover:bg-blue-500" @click="setPFP">Choose as PFP</button>
    </div>
</template>