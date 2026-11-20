<script setup>
import AppHeader from '@/components/AppHeader.vue';
import ToastStack from '@/components/ToastStack.vue';
</script>

<template>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <AppHeader />
    <main id="main-content" class="container main" tabindex="-1">
        <RouterView />
    </main>
    <footer class="footer">
        <div class="container">CIS 3339 · Student Management System</div>
    </footer>
    <ToastStack />
</template>
