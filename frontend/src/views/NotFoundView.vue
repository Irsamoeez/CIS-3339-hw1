<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
    <div class="page page--centered">
        <h1>Page not found</h1>
        <p class="page__lead">There is no page at <code>{{ route.fullPath }}</code>.</p>
        <RouterLink :to="{ name: 'students' }" class="btn btn--primary">Go to Students</RouterLink>
    </div>
</template>
