<script setup>
defineProps({
    title: { type: String, required: true },
    message: { type: String, default: '' },
});
</script>

<template>
    <div class="state state--empty">
        <p class="state__title">{{ title }}</p>
        <p v-if="message" class="state__message">{{ message }}</p>
        <slot />
    </div>
</template>
