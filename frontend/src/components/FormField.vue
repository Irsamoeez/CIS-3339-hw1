<script setup>
import { computed } from 'vue';

// Extra attributes (autocomplete, inputmode, placeholder, @blur...) go to the <input>, not the wrapper.
defineOptions({ inheritAttrs: false });

const model = defineModel({ type: String, default: '' });

const props = defineProps({
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, default: 'text' },
    error: { type: String, default: '' },
    hint: { type: String, default: '' },
    required: { type: Boolean, default: false },
});

const describedBy = computed(
    () => [props.hint && `${props.id}-hint`, props.error && `${props.id}-error`].filter(Boolean).join(' ') || undefined
);
</script>

<template>
    <div class="field" :class="{ 'field--invalid': error }">
        <label :for="id" class="field__label">
            {{ label }}<span v-if="required" class="field__required" aria-hidden="true"> *</span>
        </label>
        <input
            :id="id"
            v-model="model"
            :type="type"
            class="field__input"
            :aria-required="required || undefined"
            :aria-invalid="error ? 'true' : 'false'"
            :aria-describedby="describedBy"
            v-bind="$attrs"
        />
        <p v-if="hint && !error" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>
        <p v-if="error" :id="`${id}-error`" class="field__error">{{ error }}</p>
    </div>
</template>
