<script setup>
import { storeToRefs } from 'pinia';
import { useNotificationStore } from '@/stores/notifications';

const notifications = useNotificationStore();
const { items } = storeToRefs(notifications);
</script>

<template>
    <div class="toasts" aria-live="polite" aria-atomic="false">
        <TransitionGroup name="toast">
            <div
                v-for="item in items"
                :key="item.id"
                class="toast"
                :class="`toast--${item.type}`"
                :role="item.type === 'error' ? 'alert' : 'status'"
            >
                <span class="toast__icon" aria-hidden="true">{{ item.type === 'error' ? '!' : '✓' }}</span>
                <p class="toast__message">{{ item.message }}</p>
                <button type="button" class="toast__close" aria-label="Dismiss message" @click="notifications.dismiss(item.id)">
                    ×
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>
