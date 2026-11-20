<script setup>
defineProps({
    message: { type: String, required: true },
    type: { type: String, default: 'error', validator: (value) => ['error', 'warning', 'info'].includes(value) },
});
</script>

<template>
    <div class="alert" :class="`alert--${type}`" :role="type === 'error' ? 'alert' : 'status'">
        <p class="alert__message">{{ message }}</p>
        <slot />
    </div>
</template>
