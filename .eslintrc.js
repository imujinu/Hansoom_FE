module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  globals: {
    defineProps: "readonly",
    defineEmits: "readonly",
    defineExpose: "readonly",
    defineSlots: "readonly",
    withDefaults: "readonly",
  },
  extends: ["plugin:vue/vue3-recommended", "eslint:recommended"],
};
