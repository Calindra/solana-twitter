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
    <div style="border-radius: 5px; padding: 10px;">
        <img :src="image.src" />
        <button @click="setPFP">Choose as PFP</button>
    </div>
</template>