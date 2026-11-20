import { ref } from 'vue';
import { defineStore } from 'pinia';

/** App-wide toast messages; any component or store can push a success/error message. */
export const useNotificationStore = defineStore('notifications', () => {
    const items = ref([]);
    let nextId = 1;

    function dismiss(id) {
        items.value = items.value.filter((item) => item.id !== id);
    }

    function notify(message, type = 'success', timeout = 4000) {
        const id = nextId++;
        items.value.push({ id, message, type });
        if (timeout) setTimeout(() => dismiss(id), timeout);
        return id;
    }

    const success = (message) => notify(message, 'success');
    const error = (message) => notify(message, 'error', 7000);

    return { items, notify, success, error, dismiss };
});
