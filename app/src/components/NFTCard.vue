<script setup>
import { ref, toRefs } from 'vue';
import { fetchMetadata, setNFTasPFP } from '@/api'
import ProfileImage from '@/components/ProfileImage'

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
    <li class="rounded-md">
        <ProfileImage :image="image.src" />
        <button class="cursor-pointer m-auto mt-3 text-white px-9 py-2.5 rounded-full font-semibold bg-pink-500 hover:bg-blue-500 transition-colors duration-500" @click="setPFP">Choose as PFP</button>
    </li>
</template>