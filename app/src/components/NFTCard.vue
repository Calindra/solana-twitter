<script setup>
import { ref, toRefs } from 'vue';
import { fetchMetadata } from '@/api'

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
</script>
<template>
    <div style="border-radius: 5px; padding: 10px;">
        <img :src="image.src" />
    </div>
</template>