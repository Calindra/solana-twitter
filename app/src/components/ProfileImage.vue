<script setup>
import { toRefs } from 'vue';

const props = defineProps({
    image: String,
})

const { image } = toRefs(props)

</script>
<template>
    <span :v-if="image" class="block bg-cover bg-no-repeat bg-center rounded-full image" :style="{ 'background-image': `url(${image})`}" />
</template>
<style scoped>
    .image {
        width: 200px;
        height: 200px;
    }
</style>