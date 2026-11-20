<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import FormField from './FormField.vue';
import AlertMessage from './AlertMessage.vue';
import { useStudentStore } from '@/stores/students';
import { useNotificationStore } from '@/stores/notifications';
import { validateStudent } from '@/utils/validation';

const emit = defineEmits(['added']);

const studentStore = useStudentStore();
const notifications = useNotificationStore();

const emptyForm = () => ({ name: '', studentId: '', phone: '', zip: '' });

const formRef = ref(null);
const form = reactive(emptyForm());
const touched = reactive({});
const submitted = ref(false);
const submitting = ref(false);
const serverErrors = ref({});
const formError = ref('');

const clientErrors = computed(() => validateStudent(form));
const isValid = computed(() => Object.keys(clientErrors.value).length === 0);

// Show a field's error once it has been touched or the form was submitted; server errors always show.
const errors = computed(() => {
    const result = {};
    for (const field of Object.keys(form)) {
        const showClient = submitted.value || touched[field];
        result[field] = serverErrors.value[field] || (showClient ? clientErrors.value[field] : '') || '';
    }
    return result;
});

// Editing the form clears stale server messages.
watch(form, () => {
    serverErrors.value = {};
    formError.value = '';
});

function resetForm() {
    Object.assign(form, emptyForm());
    for (const key of Object.keys(touched)) delete touched[key];
    submitted.value = false;
    serverErrors.value = {};
    formError.value = '';
}

async function focusFirstError() {
    await nextTick();
    formRef.value?.querySelector('[aria-invalid="true"]')?.focus();
}

async function handleSubmit() {
    submitted.value = true;
    if (!isValid.value) {
        focusFirstError();
        return;
    }

    submitting.value = true;
    try {
        const student = await studentStore.addStudent({
            name: form.name.trim(),
            studentId: form.studentId.trim(),
            phone: form.phone.trim(),
            zip: form.zip.trim(),
        });
        notifications.success(`Added ${student.name} (ID ${student.studentId}).`);
        resetForm();
        emit('added', student);
    } catch (err) {
        formError.value = err.message;
        serverErrors.value = err.details ?? {};
        focusFirstError();
    } finally {
        submitting.value = false;
    }
}
</script>

<template>
    <form ref="formRef" class="form" novalidate @submit.prevent="handleSubmit">
        <AlertMessage v-if="formError" :message="formError" />

        <FormField
            id="student-name"
            v-model="form.name"
            label="Full name"
            autocomplete="name"
            required
            :error="errors.name"
            @blur="touched.name = true"
        />
        <div class="form__row">
            <FormField
                id="student-id"
                v-model="form.studentId"
                label="Student ID"
                inputmode="numeric"
                autocomplete="off"
                placeholder="1001"
                required
                :error="errors.studentId"
                @blur="touched.studentId = true"
            />
            <FormField
                id="student-zip"
                v-model="form.zip"
                label="ZIP code"
                inputmode="numeric"
                autocomplete="postal-code"
                placeholder="77004"
                required
                :error="errors.zip"
                @blur="touched.zip = true"
            />
        </div>
        <FormField
            id="student-phone"
            v-model="form.phone"
            type="tel"
            label="Phone number"
            autocomplete="tel"
            placeholder="555-123-4567"
            required
            :error="errors.phone"
            @blur="touched.phone = true"
        />

        <p class="form__note"><span aria-hidden="true">*</span> Required field</p>
        <div class="form__actions">
            <button type="submit" class="btn btn--primary" :disabled="submitting">
                {{ submitting ? 'Adding…' : 'Add student' }}
            </button>
            <button type="button" class="btn btn--ghost" :disabled="submitting" @click="resetForm">Clear</button>
        </div>
    </form>
</template>
