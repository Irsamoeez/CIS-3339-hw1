<script setup>
defineProps({
    message: { type: String, default: 'Loading…' },
});
</script>

<template>
    <div class="state state--loading" role="status">
        <span class="spinner" aria-hidden="true"></span>
        <span>{{ message }}</span>
    </div>
</template>
