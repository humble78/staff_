import { useSSRContext, defineComponent, shallowRef, ref, provide, computed, h, inject, watch, nextTick, mergeProps, unref, isRef, withCtx, withDirectives, createVNode, vShow, toRef, getCurrentInstance, onServerPrefetch, mergeModels, useModel, resolveComponent, resolveDirective, openBlock, createBlock, vModelText, createCommentVNode } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderSlot, ssrRenderStyle, ssrRenderAttr, ssrGetDirectiveProps, ssrGetDynamicModelProps } from 'vue/server-renderer';
import { h as hVue2, f as hF, j as getAttrsForVueVersion, s as sleep, k as isVue2, c as asyncDataDefaults, t as throwException, g as getException, d as useNuxtApp, e as createError, a as useRuntimeConfig } from './server.mjs';
import '../runtime.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:fs';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';
import 'vue-router';
import 'vue-tailwind-datepicker';
import 'maska';

const isDefer = (dedupe) => dedupe === "defer" || dedupe === false;
function useAsyncData(...args) {
  var _a2, _b2, _c, _d, _e, _f, _g, _h, _i;
  var _b;
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  let [key, _handler, options = {}] = args;
  if (typeof key !== "string") {
    throw new TypeError("[nuxt] [asyncData] key must be a string.");
  }
  if (typeof _handler !== "function") {
    throw new TypeError("[nuxt] [asyncData] handler must be a function.");
  }
  const nuxtApp = useNuxtApp();
  const handler = _handler ;
  const getDefault = () => null;
  const getDefaultCachedData = () => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : nuxtApp.static.data[key];
  options.server = (_a2 = options.server) != null ? _a2 : true;
  options.default = (_b2 = options.default) != null ? _b2 : getDefault;
  options.getCachedData = (_c = options.getCachedData) != null ? _c : getDefaultCachedData;
  options.lazy = (_d = options.lazy) != null ? _d : false;
  options.immediate = (_e = options.immediate) != null ? _e : true;
  options.deep = (_f = options.deep) != null ? _f : asyncDataDefaults.deep;
  options.dedupe = (_g = options.dedupe) != null ? _g : "cancel";
  const hasCachedData = () => options.getCachedData(key, nuxtApp) != null;
  if (!nuxtApp._asyncData[key] || !options.immediate) {
    (_h = (_b = nuxtApp.payload._errors)[key]) != null ? _h : _b[key] = null;
    const _ref = options.deep ? ref : shallowRef;
    nuxtApp._asyncData[key] = {
      data: _ref((_i = options.getCachedData(key, nuxtApp)) != null ? _i : options.default()),
      pending: ref(!hasCachedData()),
      error: toRef(nuxtApp.payload._errors, key),
      status: ref("idle")
    };
  }
  const asyncData = { ...nuxtApp._asyncData[key] };
  asyncData.refresh = asyncData.execute = (opts = {}) => {
    var _a3;
    if (nuxtApp._asyncDataPromises[key]) {
      if (isDefer((_a3 = opts.dedupe) != null ? _a3 : options.dedupe)) {
        return nuxtApp._asyncDataPromises[key];
      }
      nuxtApp._asyncDataPromises[key].cancelled = true;
    }
    if ((opts._initial || nuxtApp.isHydrating && opts._initial !== false) && hasCachedData()) {
      return Promise.resolve(options.getCachedData(key, nuxtApp));
    }
    asyncData.pending.value = true;
    asyncData.status.value = "pending";
    const promise = new Promise(
      (resolve, reject) => {
        try {
          resolve(handler(nuxtApp));
        } catch (err) {
          reject(err);
        }
      }
    ).then(async (_result) => {
      if (promise.cancelled) {
        return nuxtApp._asyncDataPromises[key];
      }
      let result = _result;
      if (options.transform) {
        result = await options.transform(_result);
      }
      if (options.pick) {
        result = pick(result, options.pick);
      }
      nuxtApp.payload.data[key] = result;
      asyncData.data.value = result;
      asyncData.error.value = null;
      asyncData.status.value = "success";
    }).catch((error) => {
      if (promise.cancelled) {
        return nuxtApp._asyncDataPromises[key];
      }
      asyncData.error.value = createError(error);
      asyncData.data.value = unref(options.default());
      asyncData.status.value = "error";
    }).finally(() => {
      if (promise.cancelled) {
        return;
      }
      asyncData.pending.value = false;
      delete nuxtApp._asyncDataPromises[key];
    });
    nuxtApp._asyncDataPromises[key] = promise;
    return nuxtApp._asyncDataPromises[key];
  };
  asyncData.clear = () => clearNuxtDataByKey(nuxtApp, key);
  const initialFetch = () => asyncData.refresh({ _initial: true });
  const fetchOnServer = options.server !== false && nuxtApp.payload.serverRendered;
  if (fetchOnServer && options.immediate) {
    const promise = initialFetch();
    if (getCurrentInstance()) {
      onServerPrefetch(() => promise);
    } else {
      nuxtApp.hook("app:created", async () => {
        await promise;
      });
    }
  }
  const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key]).then(() => asyncData);
  Object.assign(asyncDataPromise, asyncData);
  return asyncDataPromise;
}
function clearNuxtDataByKey(nuxtApp, key) {
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = void 0;
  }
  if (key in nuxtApp.payload._errors) {
    nuxtApp.payload._errors[key] = null;
  }
  if (nuxtApp._asyncData[key]) {
    nuxtApp._asyncData[key].data.value = void 0;
    nuxtApp._asyncData[key].error.value = null;
    nuxtApp._asyncData[key].pending.value = false;
    nuxtApp._asyncData[key].status.value = "idle";
  }
  if (key in nuxtApp._asyncDataPromises) {
    nuxtApp._asyncDataPromises[key].cancelled = true;
    nuxtApp._asyncDataPromises[key] = void 0;
  }
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}
const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "StageTabs",
  __ssrInlineRender: true,
  props: {
    "modelValue": { required: true, default: 0 },
    "modelModifiers": {}
  },
  emits: /* @__PURE__ */ mergeModels(["click-ready"], ["update:modelValue"]),
  setup(__props, { emit: __emit }) {
    const tabIndex = useModel(__props, "modelValue");
    const listTitles = [
      "\u041F\u0430\u0441\u043F\u043E\u0440\u0442\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435",
      "\u041A\u043E\u043D\u0442\u0430\u043A\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435",
      "\u0414\u0430\u043D\u043D\u044B\u0435 \u043E \u0441\u0435\u043C\u044C\u0435",
      "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435"
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full h-full flex justify-center mt-28" }, _attrs))}><div class="w-5/6 h-[33rem]"><div class="flex w-full h-10 bg-gray-300 overflow-hidden"><!--[-->`);
      ssrRenderList(listTitles, (item, index) => {
        _push(`<span class="${ssrRenderClass([{ "bg-indigo-800 after:border-l-indigo-800 text-white": index === tabIndex.value }, "relative text-sm font-medium flex justify-center items-center w-full after:content-[''] after:border-l-[2rem] after:border-solid after:border-y-[1.25rem] after:border-transparent after:absolute after:top-0 after:-right-4"])}">${ssrInterpolate(item)}</span>`);
      });
      _push(`<!--]--></div><div class="relative w-full h-full bg-gray-100">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`<div class="absolute bottom-0 right-0 mr-4 mb-4 flex gap-8"><button style="${ssrRenderStyle(tabIndex.value !== 0 && tabIndex.value !== 3 ? null : { display: "none" })}" class="py-3 px-5 flex items-center text-white bg-indigo-800 hover:bg-indigo-900" type="button"><svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 84" fill="none"><path d="M1.59837 46.2889L37.7119 82.4033C38.7428 83.4342 40.1168 84 41.5818 84C43.0484 84 44.4216 83.4333 45.4525 82.4033L48.7313 79.1236C49.7614 78.0944 50.3289 76.7196 50.3289 75.2537C50.3289 73.7887 49.7614 72.3676 48.7313 71.3383L27.6632 50.2239L94.5976 50.2239C97.6155 50.2239 100 47.8613 100 44.8426V40.2061C100 37.1874 97.6155 34.5866 94.5976 34.5866L27.4242 34.5866L48.7305 13.3542C49.7606 12.3234 50.3281 10.986 50.3281 9.52013C50.3281 8.05591 49.7606 6.69901 48.7305 5.66894L45.4517 2.39987C44.4208 1.36898 43.0476 0.807197 41.581 0.807197C40.1159 0.807197 38.742 1.37629 37.7111 2.40718L1.59756 38.5207C0.564236 39.5548 -0.00404906 40.9353 1.59498e-05 42.4028C-0.00323606 43.8751 0.564236 45.2564 1.59837 46.2889Z" fill="white"></path></svg><span class="ml-2 text-sm">\u041D\u0430\u0437\u0430\u0434</span></button><button style="${ssrRenderStyle(tabIndex.value !== 3 ? null : { display: "none" })}" class="py-3 px-5 flex items-center text-white bg-indigo-800 hover:bg-indigo-900" type="button"><span class="mr-2 text-sm">\u0414\u0430\u043B\u044C\u0448\u0435</span><svg class="h-3 w-3" viewBox="0 0 200 168" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M196.803 76.2293L124.576 4.00065C122.514 1.93888 119.767 0.807182 116.836 0.807182C113.903 0.807182 111.157 1.94051 109.095 4.00065L102.537 10.5599C100.477 12.6185 99.3423 15.368 99.3423 18.2997C99.3423 21.2298 100.477 24.072 102.537 26.1306L144.674 68.3595H10.8048C4.76907 68.3595 0 73.0846 0 79.122V88.3951C0 94.4324 4.76907 99.634 10.8048 99.634H145.152L102.539 142.099C100.479 144.16 99.3439 146.835 99.3439 149.767C99.3439 152.695 100.479 155.409 102.539 157.469L109.097 164.007C111.158 166.069 113.905 167.193 116.838 167.193C119.768 167.193 122.516 166.055 124.578 163.993L196.805 91.7658C198.872 89.6975 200.008 86.9366 200 84.0016C200.007 81.0569 198.872 78.2944 196.803 76.2293Z" fill="white"></path></svg></button><button style="${ssrRenderStyle(tabIndex.value === 3 ? null : { display: "none" })}" class="py-3 px-5 flex items-center text-white bg-indigo-800 hover:bg-indigo-900" type="button"><span class="text-sm">\u0413\u043E\u0442\u043E\u0432\u043E</span></button></div></div></div></div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StageTabs.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const useAvatar = () => useState("avatar");
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "UploadPhoto",
  __ssrInlineRender: true,
  setup(__props) {
    useAvatar();
    const flag = ref(true);
    const photo = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mr-5 flex items-center justify-center" }, _attrs))}><label for="dropzone-file" class="p-2 flex flex-col items-center justify-center w-full h-full border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-200" accept="image/*">`);
      if (unref(flag)) {
        _push(`<div class="flex flex-col items-center justify-center gap-4"><svg class="h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 10C8 7.79086 9.79086 6 12 6C14.2091 6 16 7.79086 16 10V11H17C18.933 11 20.5 12.567 20.5 14.5C20.5 16.433 18.933 18 17 18H16C15.4477 18 15 18.4477 15 19C15 19.5523 15.4477 20 16 20H17C20.0376 20 22.5 17.5376 22.5 14.5C22.5 11.7793 20.5245 9.51997 17.9296 9.07824C17.4862 6.20213 15.0003 4 12 4C8.99974 4 6.51381 6.20213 6.07036 9.07824C3.47551 9.51997 1.5 11.7793 1.5 14.5C1.5 17.5376 3.96243 20 7 20H8C8.55228 20 9 19.5523 9 19C9 18.4477 8.55228 18 8 18H7C5.067 18 3.5 16.433 3.5 14.5C3.5 12.567 5.067 11 7 11H8V10ZM15.7071 13.2929L12.7071 10.2929C12.3166 9.90237 11.6834 9.90237 11.2929 10.2929L8.29289 13.2929C7.90237 13.6834 7.90237 14.3166 8.29289 14.7071C8.68342 15.0976 9.31658 15.0976 9.70711 14.7071L11 13.4142V19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19V13.4142L14.2929 14.7071C14.6834 15.0976 15.3166 15.0976 15.7071 14.7071C16.0976 14.3166 16.0976 13.6834 15.7071 13.2929Z" fill="#919191"></path></svg><div><p class="text-center mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">\u041D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C</span> \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0444\u0430\u0439\u043B \u0441\u044E\u0434\u0430 </p><p class="text-center text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG (3x4)</p></div></div>`);
      } else {
        _push(`<img class="object-fill h-full w-full"${ssrRenderAttr("src", unref(photo))} alt="your-photo">`);
      }
      _push(`<input id="dropzone-file" type="file" class="hidden" maxlength="1" multiple="false" accept="image/*"></label></div>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/UploadPhoto.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "PassportDetails",
  __ssrInlineRender: true,
  props: {
    "modelValue": { required: true },
    "modelModifiers": {}
  },
  emits: ["update:modelValue"],
  setup(__props) {
    ref({
      gV: "",
      sV: ""
    });
    const data = useModel(__props, "modelValue");
    const dropdown = ref(false);
    const dateFlag = ref(false);
    const nameInFullFlag = ref(false);
    const options = {
      preProcess: (val) => val.toUpperCase()
    };
    const handleDateFocusout = (e) => {
      if (data.value.birth_date === "")
        dateFlag.value = false;
      else
        dateFlag.value = !/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19[5-9]\d|20\d{2})$/.test(data.value.birth_date);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UploadPhoto = _sfc_main$5;
      const _component_vue_tailwind_datepicker = resolveComponent("vue-tailwind-datepicker");
      const _directive_maska = resolveDirective("maska");
      let _temp0, _temp1, _temp2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-12 h-full flex flex-col animate-moving" }, _attrs))}><div class="space-y-7"><div class="flex items-center"><div class="h-full w-72 flex flex-col items-center gap-2">`);
      _push(ssrRenderComponent(_component_UploadPhoto, { class: "mt-2 w-48 h-52" }, null, _parent));
      _push(`</div><div class="h-full w-full grid grid-cols-2 justify-items-end items-start gap-y-10"><label class="relative w-80"><span>\u0424\u0430\u043C\u0438\u043B\u0438\u044F</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" viewBox="0 0 84 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M68.2179 32.4998C68.2179 46.9791 56.4821 58.7189 42.0009 58.7189C27.5177 58.7189 15.7798 46.9791 15.7798 32.5V26.2191C15.7798 11.7398 27.5175 0 42.0009 0C56.4821 0 68.2179 11.7398 68.2179 26.2189V32.4998ZM61.873 60.7002C71.7314 64.932 77.7869 72.3762 81.4841 78.9484C86.3884 87.6656 82.5435 100 74.0623 100H9.93785C1.4564 100 -2.38852 87.6656 2.51558 78.9484C6.2107 72.3764 12.2664 64.932 22.1246 60.7002C27.763 64.6449 34.6127 66.9672 42.0009 66.9672C49.3851 66.9672 56.2347 64.6447 61.873 60.7002Z" fill="#000" stroke="#000" stroke-width="0.195312"></path></svg><input${ssrRenderAttr("value", data.value.last_name)} class="border px-2 w-full h-full rounded-r-md peer" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0444\u0430\u043C\u0438\u043B\u0438\u044E" pattern="^([a-zA-Z]{0,20})|([\u0430-\u044F\u0410-\u042F]{0,30})$" type="text"></div><span class="absolute -bottom-5 left-14 text-sm text-red-400" style="${ssrRenderStyle(unref(nameInFullFlag) ? null : { display: "none" })}">\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0432\u0432\u043E\u0434</span></label><label class="relative w-80"><span>\u0418\u043C\u044F</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" viewBox="0 0 84 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M68.2179 32.4998C68.2179 46.9791 56.4821 58.7189 42.0009 58.7189C27.5177 58.7189 15.7798 46.9791 15.7798 32.5V26.2191C15.7798 11.7398 27.5175 0 42.0009 0C56.4821 0 68.2179 11.7398 68.2179 26.2189V32.4998ZM61.873 60.7002C71.7314 64.932 77.7869 72.3762 81.4841 78.9484C86.3884 87.6656 82.5435 100 74.0623 100H9.93785C1.4564 100 -2.38852 87.6656 2.51558 78.9484C6.2107 72.3764 12.2664 64.932 22.1246 60.7002C27.763 64.6449 34.6127 66.9672 42.0009 66.9672C49.3851 66.9672 56.2347 64.6447 61.873 60.7002Z" fill="#000" stroke="#000" stroke-width="0.195312"></path></svg><input${ssrRenderAttr("value", data.value.first_name)} class="border px-2 w-full h-full rounded-r-md peer" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F" pattern="^([a-zA-Z]{0,20})|([\u0430-\u044F\u0410-\u042F]{0,30})$" type="text"></div><span class="absolute -bottom-5 left-14 text-sm text-red-400" style="${ssrRenderStyle(unref(nameInFullFlag) ? null : { display: "none" })}">\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0432\u0432\u043E\u0434</span></label><label class="relative w-80"><span>\u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" viewBox="0 0 84 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M68.2179 32.4998C68.2179 46.9791 56.4821 58.7189 42.0009 58.7189C27.5177 58.7189 15.7798 46.9791 15.7798 32.5V26.2191C15.7798 11.7398 27.5175 0 42.0009 0C56.4821 0 68.2179 11.7398 68.2179 26.2189V32.4998ZM61.873 60.7002C71.7314 64.932 77.7869 72.3762 81.4841 78.9484C86.3884 87.6656 82.5435 100 74.0623 100H9.93785C1.4564 100 -2.38852 87.6656 2.51558 78.9484C6.2107 72.3764 12.2664 64.932 22.1246 60.7002C27.763 64.6449 34.6127 66.9672 42.0009 66.9672C49.3851 66.9672 56.2347 64.6447 61.873 60.7002Z" fill="#000" stroke="#000" stroke-width="0.195312"></path></svg><input${ssrRenderAttr("value", data.value.middle_name)} class="border px-2 w-full h-full rounded-r-md peer" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043E\u0442\u0447\u0435\u0441\u0442\u0432\u043E" pattern="^([a-zA-Z]{0,20})|([\u0430-\u044F\u0410-\u042F]{0,30})$" type="text"></div><span class="absolute -bottom-5 left-14 text-sm text-red-400" style="${ssrRenderStyle(unref(nameInFullFlag) ? null : { display: "none" })}">\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0432\u0432\u043E\u0434</span></label><div class="w-80">`);
      _push(ssrRenderComponent(_component_vue_tailwind_datepicker, {
        class: "max-w-80",
        modelValue: data.value.birth_date,
        "onUpdate:modelValue": ($event) => data.value.birth_date = $event,
        "as-single": "",
        formatter: {
          date: "DD.MM.YYYY",
          month: "MMM"
        }
      }, {
        default: withCtx(({ placeholder }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<label class="relative w-full"${_scopeId}><span${_scopeId}>\u0414\u0430\u0442\u0430 \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F</span><div class="relative h-10 w-full flex items-center"${_scopeId}><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"${_scopeId}><path d="M29.1665 8.33337C31.4677 8.33337 33.3332 10.1989 33.3332 12.5V20.8334H66.6668V12.5C66.6668 10.1989 68.5323 8.33337 70.8335 8.33337C73.1347 8.33337 75.0002 10.1989 75.0002 12.5V20.8334C82.8568 20.8334 86.7852 20.8334 89.226 23.2742C91.6668 25.715 91.6668 29.6433 91.6668 37.5001C91.6668 39.4642 91.6668 40.4464 91.0568 41.0565C90.4464 41.6667 89.4643 41.6667 87.5002 41.6667H12.5002C10.536 41.6667 9.55387 41.6667 8.9437 41.0565C8.3335 40.4464 8.3335 39.4642 8.3335 37.5001C8.3335 29.6433 8.3335 25.715 10.7743 23.2742C13.215 20.8334 17.1433 20.8334 24.9998 20.8334V12.5C24.9998 10.1989 26.8653 8.33337 29.1665 8.33337Z" fill="black"${_scopeId}></path><path fill-rule="evenodd" clip-rule="evenodd" d="M10.7743 89.2259C8.3335 86.785 8.3335 82.8567 8.3335 75V54.1667C8.3335 52.2025 8.3335 51.2205 8.9437 50.61C9.55387 50 10.536 50 12.5002 50H87.5002C89.4643 50 90.4464 50 91.0568 50.61C91.6668 51.2205 91.6668 52.2025 91.6668 54.1667V75C91.6668 82.8567 91.6668 86.785 89.226 89.2259C86.7852 91.6667 82.8568 91.6667 75.0002 91.6667H25.0002C17.1434 91.6667 13.215 91.6667 10.7743 89.2259ZM29.777 58.9434C29.1668 59.5538 29.1668 60.5359 29.1668 62.5C29.1668 64.4642 29.1668 65.4463 29.777 66.0567C30.3872 66.6667 31.3693 66.6667 33.3335 66.6667H41.6668C43.631 66.6667 44.6131 66.6667 45.2235 66.0567C45.8335 65.4463 45.8335 64.4642 45.8335 62.5C45.8335 60.5359 45.8335 59.5538 45.2235 58.9434C44.6131 58.3334 43.631 58.3334 41.6668 58.3334H33.3335C31.3693 58.3334 30.3872 58.3334 29.777 58.9434ZM29.1668 79.1667C29.1668 77.2025 29.1668 76.2205 29.777 75.61C30.3872 75 31.3693 75 33.3335 75H41.6668C43.631 75 44.6131 75 45.2235 75.61C45.8335 76.2205 45.8335 77.2025 45.8335 79.1667C45.8335 81.1309 45.8335 82.113 45.2235 82.7234C44.6131 83.3334 43.631 83.3334 41.6668 83.3334H33.3335C31.3693 83.3334 30.3872 83.3334 29.777 82.7234C29.1668 82.113 29.1668 81.1309 29.1668 79.1667ZM54.7768 58.9434C54.1668 59.5538 54.1668 60.5359 54.1668 62.5C54.1668 64.4642 54.1668 65.4463 54.7768 66.0567C55.3872 66.6667 56.3693 66.6667 58.3335 66.6667H66.6668C68.631 66.6667 69.6131 66.6667 70.2235 66.0567C70.8335 65.4463 70.8335 64.4642 70.8335 62.5C70.8335 60.5359 70.8335 59.5538 70.2235 58.9434C69.6131 58.3334 68.631 58.3334 66.6668 58.3334H58.3335C56.3693 58.3334 55.3872 58.3334 54.7768 58.9434ZM54.1668 79.1667C54.1668 77.2025 54.1668 76.2205 54.7768 75.61C55.3872 75 56.3693 75 58.3335 75H66.6668C68.631 75 69.6131 75 70.2235 75.61C70.8335 76.2205 70.8335 77.2025 70.8335 79.1667C70.8335 81.1309 70.8335 82.113 70.2235 82.7234C69.6131 83.3334 68.631 83.3334 66.6668 83.3334H58.3335C56.3693 83.3334 55.3872 83.3334 54.7768 82.7234C54.1668 82.113 54.1668 81.1309 54.1668 79.1667Z" fill="black"${_scopeId}></path></svg><input${ssrRenderAttrs((_temp0 = mergeProps({
              "data-maska": "##.##.####",
              value: data.value.birth_date,
              class: [{ "border-red-500": unref(dateFlag) }, "border px-2 w-full h-full rounded-r-md outline-none"],
              placeholder,
              maxlength: "10",
              type: "text"
            }, ssrGetDirectiveProps(_ctx, _directive_maska)), mergeProps(_temp0, ssrGetDynamicModelProps(_temp0, data.value.birth_date))))}${_scopeId}></div></label>`);
          } else {
            return [
              createVNode("label", { class: "relative w-full" }, [
                createVNode("span", null, "\u0414\u0430\u0442\u0430 \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F"),
                createVNode("div", { class: "relative h-10 w-full flex items-center" }, [
                  (openBlock(), createBlock("svg", {
                    class: "h-full py-2 px-3 rounded-l-md bg-gray-200",
                    xmlns: "http://www.w3.org/2000/svg",
                    viewBox: "0 0 100 100",
                    fill: "none"
                  }, [
                    createVNode("path", {
                      d: "M29.1665 8.33337C31.4677 8.33337 33.3332 10.1989 33.3332 12.5V20.8334H66.6668V12.5C66.6668 10.1989 68.5323 8.33337 70.8335 8.33337C73.1347 8.33337 75.0002 10.1989 75.0002 12.5V20.8334C82.8568 20.8334 86.7852 20.8334 89.226 23.2742C91.6668 25.715 91.6668 29.6433 91.6668 37.5001C91.6668 39.4642 91.6668 40.4464 91.0568 41.0565C90.4464 41.6667 89.4643 41.6667 87.5002 41.6667H12.5002C10.536 41.6667 9.55387 41.6667 8.9437 41.0565C8.3335 40.4464 8.3335 39.4642 8.3335 37.5001C8.3335 29.6433 8.3335 25.715 10.7743 23.2742C13.215 20.8334 17.1433 20.8334 24.9998 20.8334V12.5C24.9998 10.1989 26.8653 8.33337 29.1665 8.33337Z",
                      fill: "black"
                    }),
                    createVNode("path", {
                      "fill-rule": "evenodd",
                      "clip-rule": "evenodd",
                      d: "M10.7743 89.2259C8.3335 86.785 8.3335 82.8567 8.3335 75V54.1667C8.3335 52.2025 8.3335 51.2205 8.9437 50.61C9.55387 50 10.536 50 12.5002 50H87.5002C89.4643 50 90.4464 50 91.0568 50.61C91.6668 51.2205 91.6668 52.2025 91.6668 54.1667V75C91.6668 82.8567 91.6668 86.785 89.226 89.2259C86.7852 91.6667 82.8568 91.6667 75.0002 91.6667H25.0002C17.1434 91.6667 13.215 91.6667 10.7743 89.2259ZM29.777 58.9434C29.1668 59.5538 29.1668 60.5359 29.1668 62.5C29.1668 64.4642 29.1668 65.4463 29.777 66.0567C30.3872 66.6667 31.3693 66.6667 33.3335 66.6667H41.6668C43.631 66.6667 44.6131 66.6667 45.2235 66.0567C45.8335 65.4463 45.8335 64.4642 45.8335 62.5C45.8335 60.5359 45.8335 59.5538 45.2235 58.9434C44.6131 58.3334 43.631 58.3334 41.6668 58.3334H33.3335C31.3693 58.3334 30.3872 58.3334 29.777 58.9434ZM29.1668 79.1667C29.1668 77.2025 29.1668 76.2205 29.777 75.61C30.3872 75 31.3693 75 33.3335 75H41.6668C43.631 75 44.6131 75 45.2235 75.61C45.8335 76.2205 45.8335 77.2025 45.8335 79.1667C45.8335 81.1309 45.8335 82.113 45.2235 82.7234C44.6131 83.3334 43.631 83.3334 41.6668 83.3334H33.3335C31.3693 83.3334 30.3872 83.3334 29.777 82.7234C29.1668 82.113 29.1668 81.1309 29.1668 79.1667ZM54.7768 58.9434C54.1668 59.5538 54.1668 60.5359 54.1668 62.5C54.1668 64.4642 54.1668 65.4463 54.7768 66.0567C55.3872 66.6667 56.3693 66.6667 58.3335 66.6667H66.6668C68.631 66.6667 69.6131 66.6667 70.2235 66.0567C70.8335 65.4463 70.8335 64.4642 70.8335 62.5C70.8335 60.5359 70.8335 59.5538 70.2235 58.9434C69.6131 58.3334 68.631 58.3334 66.6668 58.3334H58.3335C56.3693 58.3334 55.3872 58.3334 54.7768 58.9434ZM54.1668 79.1667C54.1668 77.2025 54.1668 76.2205 54.7768 75.61C55.3872 75 56.3693 75 58.3335 75H66.6668C68.631 75 69.6131 75 70.2235 75.61C70.8335 76.2205 70.8335 77.2025 70.8335 79.1667C70.8335 81.1309 70.8335 82.113 70.2235 82.7234C69.6131 83.3334 68.631 83.3334 66.6668 83.3334H58.3335C56.3693 83.3334 55.3872 83.3334 54.7768 82.7234C54.1668 82.113 54.1668 81.1309 54.1668 79.1667Z",
                      fill: "black"
                    })
                  ])),
                  withDirectives(createVNode("input", {
                    onFocusout: handleDateFocusout,
                    "data-maska": "##.##.####",
                    "onUpdate:modelValue": ($event) => data.value.birth_date = $event,
                    class: [{ "border-red-500": unref(dateFlag) }, "border px-2 w-full h-full rounded-r-md outline-none"],
                    placeholder,
                    maxlength: "10",
                    type: "text"
                  }, null, 42, ["onUpdate:modelValue", "placeholder"]), [
                    [_directive_maska],
                    [vModelText, data.value.birth_date]
                  ])
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<span style="${ssrRenderStyle(unref(dateFlag) ? null : { display: "none" })}" class="ml-12 text-sm text-red-400"> \u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0432\u0432\u043E\u0434 </span></div></div></div><div class="flex justify-between"><div class="relative w-56 mb-8"><span>\u041F\u043E\u043B</span><button class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" viewBox="0 0 84 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M68.2179 32.4998C68.2179 46.9791 56.4821 58.7189 42.0009 58.7189C27.5177 58.7189 15.7798 46.9791 15.7798 32.5V26.2191C15.7798 11.7398 27.5175 0 42.0009 0C56.4821 0 68.2179 11.7398 68.2179 26.2189V32.4998ZM61.873 60.7002C71.7314 64.932 77.7869 72.3762 81.4841 78.9484C86.3884 87.6656 82.5435 100 74.0623 100H9.93785C1.4564 100 -2.38852 87.6656 2.51558 78.9484C6.2107 72.3764 12.2664 64.932 22.1246 60.7002C27.763 64.6449 34.6127 66.9672 42.0009 66.9672C49.3851 66.9672 56.2347 64.6447 61.873 60.7002Z" fill="#000" stroke="#000" stroke-width="0.195312"></path></svg><span class="border leading-10 px-2 w-full h-full text-start rounded-r-md bg-white">${ssrInterpolate(data.value.gender === "MALE" ? "\u041C\u0443\u0436\u0441\u043A\u043E\u0439" : data.value.gender === "FEMALE" ? "\u0416\u0435\u043D\u0441\u043A\u0438\u0439" : "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u043E\u043B")}</span><svg class="${ssrRenderClass([unref(dropdown) ? "rotate-90" : "rotate-0", "h-[1.3rem] w-[1.3rem] absolute right-2 fill-[#191D23] dark:fill-white transition-transform"])}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"><path fill="#191D23" fill-rule="evenodd" clip-rule="evenodd" d="M7.29308 14.707C7.10561 14.5194 7.00029 14.2651 7.00029 14C7.00029 13.7348 7.10561 13.4805 7.29308 13.293L10.5861 9.99997L7.29308 6.70697C7.19757 6.61472 7.12139 6.50438 7.06898 6.38237C7.01657 6.26037 6.98898 6.12915 6.98783 5.99637C6.98668 5.86359 7.01198 5.73191 7.06226 5.60902C7.11254 5.48612 7.18679 5.37447 7.28069 5.28057C7.37458 5.18668 7.48623 5.11243 7.60913 5.06215C7.73202 5.01187 7.8637 4.98656 7.99648 4.98772C8.12926 4.98887 8.26048 5.01646 8.38249 5.06887C8.50449 5.12128 8.61483 5.19746 8.70708 5.29297L12.7071 9.29297C12.8946 9.4805 12.9999 9.73481 12.9999 9.99997C12.9999 10.2651 12.8946 10.5194 12.7071 10.707L8.70708 14.707C8.51955 14.8944 8.26525 14.9998 8.00008 14.9998C7.73492 14.9998 7.48061 14.8944 7.29308 14.707Z"></path></svg><div class="${ssrRenderClass([{ "hidden": !unref(dropdown) }, "transition-all z-10 absolute top-12 right-1 w-44 rounded-md shadow-md overflow-hidden divide-y-2 bg-white"])}"><p class="flex items-center gap-4 py-2 px-4 hover:bg-gray-200"><svg class="py-1 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74 100" fill="none"><path d="M50.0773 62.7205C49.0059 60.7594 48.8338 58.7431 49.0139 57.0121C52.0283 54.4609 54.3033 50.6666 56.1459 45.6594C58.8307 44.2566 60.6922 41.2443 60.6922 37.7441C60.6922 35.5955 59.9902 33.6303 58.8287 32.1062L58.9359 31.1584C59.9941 27.151 62.907 13.1277 53.9498 6.55896C49.2783 0.719121 42.9711 -0.215059 35.9631 0.485722C32.4768 0.834159 29.126 1.87225 26.45 1.48357C23.3814 1.03748 20.8271 0.392753 20.0787 0.0183391C19.6473 -0.198067 18.417 1.5156 17.1123 4.37303C14.5248 10.0404 12.9947 19.7959 14.6045 28.5972L15.002 32.1047C13.8398 33.6287 13.1373 35.5947 13.1373 37.7439C13.1373 41.1595 14.91 44.1115 17.4902 45.556C19.3012 50.8045 21.741 54.7133 25.017 57.2814C25.1506 58.95 24.9396 60.8615 23.9229 62.7201C21.9195 66.3887 0.541992 71.3137 0.541992 91.4699C0.541992 94.5783 10.9584 100 37.0002 100C63.0424 100 73.4584 94.5783 73.4584 91.4699C73.4584 71.3137 52.0812 66.3887 50.0773 62.7205Z" fill="black"></path></svg><span> \u041C\u0443\u0436c\u043A\u043E\u0439 </span></p><p class="flex items-center gap-4 py-2 px-4 hover:bg-gray-200"><svg class="py-1 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 100" fill="none"><path d="M49.3034 64.0963C49.1722 62.835 49.1821 61.5703 49.269 60.3643C53.0497 62.7082 57.0651 62.0287 57.0651 62.0287C57.0651 62.0287 55.0425 57.7498 55.5263 52.0051C56.4905 50.1279 57.3526 48.0311 58.1313 45.7619C59.9673 44.5578 61.6341 42.4074 62.521 38.4803C62.8673 36.9479 62.5958 35.4926 61.9335 34.2246C69.3608 10.1262 53.8216 0 44.4534 0C42.6792 0 40.8241 0.168945 39.0003 0.490039C37.1745 0.168945 35.3198 0 33.5456 0C24.1771 0 8.6376 10.1266 16.0659 34.2262C15.404 35.4938 15.1331 36.9484 15.4792 38.4803C16.5782 43.3479 18.8761 45.4836 21.2089 46.4719C24.3534 54.773 20.9339 62.0287 20.9339 62.0287C20.9339 62.0287 24.9497 62.7084 28.7312 60.3637C28.8181 61.5699 28.828 62.8348 28.6968 64.0965C27.4425 76.1766 0.634277 75.1238 0.634277 91.0242C0.634277 94.2953 11.5958 100 39.0003 100C66.4044 100 77.3659 94.2953 77.3659 91.0242C77.3659 75.1236 50.5581 76.1764 49.3034 64.0963Z" fill="black"></path></svg><span> \u0416\u0435\u043D\u0441\u043A\u0438\u0439 </span></p></div></button></div><label class="relative w-80"><span>\u0421\u0435\u0440\u0438\u044F \u0438 \u043D\u043E\u043C\u0435\u0440 \u043F\u0430\u0441\u043F\u043E\u0440\u0442\u0430 / ID-\u043A\u0430\u0440\u0442\u044B</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.8335 20.8333C20.8335 19.1389 19.8221 17.6808 18.3701 17.0296C18.9698 16.5573 19.6965 16.234 20.4985 16.1194L65.4885 9.69225C70.5085 8.97508 75.0002 12.8706 75.0002 17.9418V21.3584C73.6685 21.0156 72.2722 20.8333 70.8335 20.8333H20.8335ZM40.625 54.1666C40.625 48.9891 44.8225 44.7916 50 44.7916C55.1775 44.7916 59.375 48.9891 59.375 54.1666C59.375 59.3441 55.1775 63.5416 50 63.5416C44.8225 63.5416 40.625 59.3441 40.625 54.1666ZM83.3332 37.5C83.3332 32.0575 79.8548 27.4273 74.9998 25.7113C73.6965 25.2507 72.294 25 70.8332 25H20.8332C19.2909 25 17.9444 24.1621 17.2239 22.9167C16.8694 22.3038 16.6665 21.5923 16.6665 20.8334V79.1667C16.6665 86.0705 22.263 91.6667 29.1665 91.6667H70.8332C77.7369 91.6667 83.3332 86.0705 83.3332 79.1667V37.5ZM34.3748 54.1667C34.3748 45.5371 41.3704 38.5417 49.9998 38.5417C58.6294 38.5417 65.6248 45.5371 65.6248 54.1667C65.6248 62.7963 58.6294 69.7917 49.9998 69.7917C41.3704 69.7917 34.3748 62.7963 34.3748 54.1667ZM38.5415 79.1667C38.5415 77.4409 39.9406 76.0417 41.6665 76.0417H58.3332C60.059 76.0417 61.4582 77.4409 61.4582 79.1667C61.4582 80.8925 60.059 82.2917 58.3332 82.2917H41.6665C39.9406 82.2917 38.5415 80.8925 38.5415 79.1667Z" fill="black"></path></svg><input${ssrRenderAttrs((_temp1 = mergeProps({
        class: "border px-2 w-full h-full rounded-r-md peer",
        "data-maska": "ss #######",
        "data-maska-tokens": "s:[A-Z]",
        placeholder: "AA 0000000",
        value: data.value.series_and_number,
        maxlength: "10",
        type: "text"
      }, ssrGetDirectiveProps(_ctx, _directive_maska, void 0, options)), mergeProps(_temp1, ssrGetDynamicModelProps(_temp1, data.value.series_and_number))))}></div></label><label class="relative w-80"><span>\u041F\u0418\u041D\u0424\u041B</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.8335 20.8333C20.8335 19.1389 19.8221 17.6808 18.3701 17.0296C18.9698 16.5573 19.6965 16.234 20.4985 16.1194L65.4885 9.69225C70.5085 8.97508 75.0002 12.8706 75.0002 17.9418V21.3584C73.6685 21.0156 72.2722 20.8333 70.8335 20.8333H20.8335ZM40.625 54.1666C40.625 48.9891 44.8225 44.7916 50 44.7916C55.1775 44.7916 59.375 48.9891 59.375 54.1666C59.375 59.3441 55.1775 63.5416 50 63.5416C44.8225 63.5416 40.625 59.3441 40.625 54.1666ZM83.3332 37.5C83.3332 32.0575 79.8548 27.4273 74.9998 25.7113C73.6965 25.2507 72.294 25 70.8332 25H20.8332C19.2909 25 17.9444 24.1621 17.2239 22.9167C16.8694 22.3038 16.6665 21.5923 16.6665 20.8334V79.1667C16.6665 86.0705 22.263 91.6667 29.1665 91.6667H70.8332C77.7369 91.6667 83.3332 86.0705 83.3332 79.1667V37.5ZM34.3748 54.1667C34.3748 45.5371 41.3704 38.5417 49.9998 38.5417C58.6294 38.5417 65.6248 45.5371 65.6248 54.1667C65.6248 62.7963 58.6294 69.7917 49.9998 69.7917C41.3704 69.7917 34.3748 62.7963 34.3748 54.1667ZM38.5415 79.1667C38.5415 77.4409 39.9406 76.0417 41.6665 76.0417H58.3332C60.059 76.0417 61.4582 77.4409 61.4582 79.1667C61.4582 80.8925 60.059 82.2917 58.3332 82.2917H41.6665C39.9406 82.2917 38.5415 80.8925 38.5415 79.1667Z" fill="black"></path></svg><input${ssrRenderAttrs((_temp2 = mergeProps({
        "data-maska": "##############",
        value: data.value.pinfl,
        class: "border px-2 w-full h-full rounded-r-md peer",
        placeholder: "12345678901234",
        type: "text"
      }, ssrGetDirectiveProps(_ctx, _directive_maska)), mergeProps(_temp2, ssrGetDynamicModelProps(_temp2, data.value.pinfl))))}></div></label></div></div></div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PassportDetails.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
function applyModifier(coords, modifier) {
  const result = {
    x: 0,
    y: 0
  };
  result.x = coords.x * modifier;
  result.y = coords.y * modifier;
  return result;
}
function applyFunctionModifier(coords, functionModifier) {
  const result = {
    x: 0,
    y: 0
  };
  result.x = functionModifier(coords.x, 1);
  result.y = functionModifier(coords.y, 2);
  return result;
}
function worldToPixels(coords, modifier) {
  const i = 2 ** modifier / 2 * 256;
  return applyModifier({
    x: coords.x + 1,
    y: 1 - coords.y
  }, i);
}
function convertWorldCoordinates(projection, coordinates, modifier) {
  const worldCoordinates = projection.toWorldCoordinates(coordinates);
  return worldToPixels(worldCoordinates, modifier);
}
function pixelsToWorld(coords, modifier) {
  const i = 2 ** modifier / 2 * 256;
  return {
    x: coords.x / i - 1,
    y: 1 - coords.y / i
  };
}
function findNeededValue(t, e, i) {
  return Math.max(Math.min(t, i), e);
}
function worldCoordsFromModifier(projection, coords, modifier) {
  const resultCoords = applyFunctionModifier(pixelsToWorld(coords, modifier), (value) => findNeededValue(value, -1, 1 - 1e-15));
  return projection.fromWorldCoordinates(resultCoords);
}
function convertBounds(projection, bounds, modifier) {
  const topLeft = convertWorldCoordinates(projection, bounds[0], modifier);
  const bottomRight = convertWorldCoordinates(projection, bounds[1], modifier);
  const modified = 2 ** modifier * 256;
  const updatedBounds = [[topLeft.x, topLeft.y], [bottomRight.x, bottomRight.y]];
  if (topLeft.x > bottomRight.x) {
    updatedBounds[0][0] = topLeft.x;
    updatedBounds[1][0] = bottomRight.x + modified;
  }
  if (topLeft.y > bottomRight.y) {
    updatedBounds[0][1] = bottomRight.y;
    updatedBounds[1][1] = topLeft.y;
  }
  return updatedBounds;
}
function applyMarginToCoords(coords, margin) {
  return {
    x: Math.max(coords.x - (margin ? margin[1] + margin[3] : 0), 1),
    y: Math.max(coords.y - (margin ? margin[0] + margin[2] : 0), 1)
  };
}
function findZoom(projection, bounds, coords, isSnap, zoomRange) {
  const [[topLeftFirst, topLeftSecond], [bottomRightFirst, bottomRightSecond]] = convertBounds(projection, bounds, 0);
  const firstCalc = Math.max(Math.abs(bottomRightFirst - topLeftFirst), 1e-10);
  const secondCalc = Math.max(Math.abs(bottomRightSecond - topLeftSecond), 1e-10);
  const zoom = findNeededValue(Math.min(Math.log2(coords.x / firstCalc), Math.log2(coords.y / secondCalc)), zoomRange.min, zoomRange.max);
  return isSnap ? Math.floor(zoom + 1e-6) : zoom;
}
function findCenter(projection, bounds, zoom) {
  const [[topLeftFirst, topLeftSecond], [bottomRightFirst, bottomRightSecond]] = convertBounds(projection, bounds, zoom);
  return worldCoordsFromModifier(projection, {
    x: (topLeftFirst + bottomRightFirst) / 2,
    y: (topLeftSecond + bottomRightSecond) / 2
  }, zoom);
}
async function getLocationFromBounds({
  bounds,
  map,
  roundZoom,
  comfortZoomLevel
}) {
  var _a;
  const ctxMap = Object.keys(map).find((x) => x.endsWith("CtxMap"));
  if (!ctxMap) {
    throwException({
      text: "CtxMap was not found in useYMapsGetCenterAndZoomFromBounds",
      isInternal: true
    });
  }
  const ctx = map[ctxMap];
  const ctxItem = await new Promise((resolve, reject) => {
    ctx.forEach((item, { name }) => {
      if (name !== "map")
        return;
      resolve(item);
    });
    reject(getException({
      text: "Map item was not found in useYMapsGetCenterAndZoomFromBounds",
      isInternal: true
    }));
  });
  const ctxItemMapKey = Object.keys(ctxItem).find((x) => x.endsWith("_context"));
  if (!ctxItemMapKey) {
    throwException({
      text: "CtxMapKey was not found in useYMapsGetCenterAndZoomFromBounds",
      isInternal: true
    });
  }
  const ctxItemMap = ctxItem[ctxItemMapKey].map;
  const boundsFunc = ctxItemMap.setBounds.toString();
  const funcKey = (_a = boundsFunc.split("const{center:e,zoom:i}=")[1]) == null ? void 0 : _a.split("(")[0];
  if (!funcKey) {
    throwException({
      text: "funcKey was not found in useYMapsGetCenterAndZoomFromBounds",
      isInternal: true
    });
  }
  const projection = ctxItemMap.projection;
  const size = ctxItemMap.size;
  const margin = ctxItemMap.margin;
  const isSnap = ctxItemMap.effectiveZoomRounding === "snap";
  const zoomRange = ctxItemMap.zoomRange;
  let zoom = findZoom(projection, bounds, applyMarginToCoords(size, margin), isSnap, zoomRange);
  const center = findCenter(projection, bounds, zoom);
  if (roundZoom || comfortZoomLevel) {
    const originalZoom = zoom;
    let roundedZoom = Math[typeof roundZoom === "string" ? roundZoom : "floor"](zoom);
    if (roundZoom)
      zoom = roundedZoom;
    if (comfortZoomLevel) {
      const userSettings = typeof comfortZoomLevel === "object" ? comfortZoomLevel : {};
      if (userSettings.roundStrategy)
        roundedZoom = Math[userSettings.roundStrategy](originalZoom);
      const diff2 = originalZoom - roundedZoom;
      const settings = {
        diff: 0.5,
        correction: 1,
        ...userSettings
      };
      if (diff2 < settings.diff) {
        zoom -= settings.correction;
      }
    }
  }
  return {
    zoom,
    center
  };
}
function getBoundsFromCoords(coordinates) {
  if (coordinates.length < 2) {
    throwException({
      text: "Invalid parameters in useYMapsBoundsFromCoords: you must pass at least two LngLat"
    });
  }
  const {
    minLongitude,
    minLatitude,
    maxLongitude,
    maxLatitude
  } = coordinates.reduce(
    (acc, [longitude, latitude]) => ({
      minLongitude: Math.min(acc.minLongitude, longitude),
      minLatitude: Math.min(acc.minLatitude, latitude),
      maxLongitude: Math.max(acc.maxLongitude, longitude),
      maxLatitude: Math.max(acc.maxLatitude, latitude)
    }),
    {
      minLongitude: Infinity,
      minLatitude: Infinity,
      maxLongitude: -Infinity,
      maxLatitude: -Infinity
    }
  );
  return [[minLongitude, maxLatitude], [maxLongitude, minLatitude]];
}
function injectMap() {
  if (!getCurrentInstance()) {
    throwException({
      text: "injectMap must be only called on runtime.",
      isInternal: true
    });
  }
  const map = inject("map");
  if (!map || !isRef(map)) {
    throwException({
      text: "Was not able to inject valid map in injectMap.",
      isInternal: true
    });
  }
  return map;
}
const _sfc_main$o = defineComponent({
  name: "YandexMap",
  props: {
    modelValue: {
      type: Object,
      default: null
    },
    value: {
      type: Object,
      default: null
    },
    tag: {
      type: String,
      default: "div"
    },
    width: {
      type: String,
      default: "100%"
    },
    height: {
      type: String,
      default: "100%"
    },
    // z-index for Map Container. Without this, elements of the map will be displayed under your site's elements due to high z-index inside of them
    zIndex: {
      type: Number,
      default: 0
    },
    /**
     * @description Settings for cart initialization.,
     *
     * You can modify this object or use map methods, such as setLocation/setBehaviors e.t.c.
     * @see https://yandex.ru/dev/maps/jsapi/doc/3.0/dg/concepts/map.html#map-parms
     * @see https://yandex.com/dev/maps/jsapi/doc/3.0/dg/concepts/map.html#map-parms
     */
    settings: {
      type: Object,
      required: true
    },
    /**
     * @description Makes settings readonly. Enable this if reactivity causes problems
     */
    readonlySettings: {
      type: Boolean,
      default: false
    },
    /**
     * @description Always inserts actual user center or bounds (based on your input) on every location change
     * @note This prop will cause user location change on every settings update (if user did move since last time). Use it with caution.
     */
    realSettingsLocation: {
      type: Boolean,
      default: false
    },
    /**
     * @description You can also add layers through <yandex-*> components
     *
     * Modifying this object after mount will cause no effect.
     *
     * Instead, please use map methods, such as addChild.
     * @see https://yandex.ru/dev/maps/jsapi/doc/3.0/dg/concepts/map.html#layers
     * @see https://yandex.com/dev/maps/jsapi/doc/3.0/dg/concepts/map.html#layers
     */
    layers: {
      type: Array,
      default: () => []
    },
    /**
     * @description Adds cursor: grab/grabbing to ymaps scheme layer
     */
    cursorGrab: {
      type: Boolean,
      default: false
    }
  },
  /**
   * @description Other events are NOT available. You can listen to events via layers prop, addChildren prop or by adding <ymap-listener> as children.
   * @see https://yandex.ru/dev/maps/jsapi/doc/3.0/dg/concepts/events.html
   * @see https://yandex.com/dev/maps/jsapi/doc/3.0/dg/concepts/events.html
   */
  emits: {
    "input"(map) {
      return !map || typeof ymaps3 === "undefined" || map instanceof ymaps3.YMap;
    },
    "update:modelValue"(map) {
      return !map || typeof ymaps3 === "undefined" || map instanceof ymaps3.YMap;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const map = shallowRef(null);
    const mapRef = shallowRef(null);
    const layers = shallowRef([]);
    const projection = shallowRef(null);
    const ymapContainer = shallowRef(null);
    const mounted = shallowRef(false);
    const needsToHold = ref(0);
    provide("map", map);
    provide("layers", layers);
    provide("projection", projection);
    provide("needsToHold", needsToHold);
    emit("input", map.value);
    emit("update:modelValue", map.value);
    computed(() => ({
      ...props.settings,
      projection: void 0
    }));
    return () => {
      var _a;
      const mapNodeProps = {
        class: [
          "__ymap",
          {
            "__ymap--grab": props.cursorGrab
          }
        ],
        ref: mapRef,
        style: {
          width: props.width,
          height: props.height,
          "z-index": props.zIndex.toString()
        }
      };
      const containerNode = h("div", {
        class: "__ymap_container",
        ref: ymapContainer
      });
      const slotsNodeProps = {
        class: "__ymap_slots",
        style: { display: "none" }
      };
      if (!mounted.value)
        return h(props.tag, mapNodeProps, [containerNode, h("div", slotsNodeProps)]);
      return h(props.tag, mapNodeProps, [
        containerNode,
        h("div", slotsNodeProps, (_a = slots.default) == null ? void 0 : _a.call(slots, {}))
      ]);
    };
  }
});
const _sfc_main$n = defineComponent({
  name: "YandexMapListener",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
const _sfc_main$m = defineComponent({
  name: "YandexMapDefaultFeaturesLayer",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    },
    hold(status) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const hold = inject("needsToHold");
    hold.value++;
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
const _sfc_main$l = defineComponent({
  name: "YandexMapDefaultSchemeLayer",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  slots: Object,
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    },
    hold(status) {
      return true;
    }
  },
  setup(props, {
    slots,
    emit
  }) {
    const hold = inject("needsToHold");
    hold.value++;
    return () => {
      var _a;
      return (_a = slots.default) == null ? void 0 : _a.call(slots, {});
    };
  }
});
defineComponent({
  name: "YandexMapDefaultSatelliteLayer",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    },
    hold(status) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const hold = inject("needsToHold");
    hold.value++;
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
defineComponent({
  name: "YandexMapTileDataSource",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      required: true
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    },
    hold(status) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const hold = inject("needsToHold");
    hold.value++;
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
defineComponent({
  name: "YandexMapFeatureDataSource",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      required: true
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    },
    hold(status) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const hold = inject("needsToHold");
    hold.value++;
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
defineComponent({
  name: "YandexMapLayer",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      required: true
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    },
    hold(status) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const hold = inject("needsToHold");
    hold.value++;
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
function getMarkerContainerProps({
  position,
  containerAttrs,
  wrapperAttrs,
  zeroSizes
}) {
  const root = {
    class: ["__ymap-marker"],
    style: {}
  };
  const children = {
    class: ["__ymap-marker_wrapper"],
    style: {}
  };
  const isDefaultPosition = position === "default" || position === "default default";
  if (position && !isDefaultPosition) {
    if (position.startsWith("translate")) {
      children.style.transform = position;
    } else {
      let translateX = 0;
      let translateY = 0;
      const splitted = position.split(" ");
      for (let i = 0; i < splitted.length; i++) {
        let local = 0;
        const item = splitted[i];
        switch (item) {
          case "top":
          case "left":
            local = -100;
            break;
          case "top-center":
          case "left-center":
            local = -50;
            break;
          case "bottom":
          case "right":
            local = 100;
            break;
          case "bottom-center":
          case "right-center":
            local = 50;
            break;
          default:
            local = 0;
        }
        if (item.startsWith("left") || item.startsWith("right"))
          translateX = local;
        else
          translateY = local;
      }
      children.style.transform = `translate(${translateX}%, ${translateY}%)`;
    }
  }
  if (zeroSizes === true || zeroSizes !== false && position && !isDefaultPosition) {
    root.style.width = "0";
    root.style.height = "0";
    if (children.style.transform)
      children.style.width = "fit-content";
  }
  const attrs = {
    root: { ...containerAttrs != null ? containerAttrs : {} },
    children: { ...wrapperAttrs != null ? wrapperAttrs : {} }
  };
  for (const [key, value] of Object.entries(attrs)) {
    const obj = key === "root" ? root : children;
    if (value.class) {
      if (!Array.isArray(value.class))
        value.class = [value.class];
      value.class = [
        ...obj.class,
        ...value.class
      ];
    }
    if (value == null ? void 0 : value.style) {
      if (typeof value.style !== "object" || Array.isArray(value.style)) {
        console.warn(`Style property was given in ${key} of marker, but it is not an object. Style of this prop can only be an object, therefore it was ignored.`);
      } else {
        value.style = {
          ...obj.style,
          ...value.style
        };
      }
    }
    Object.assign(obj, value);
  }
  return {
    root,
    children
  };
}
function excludeYandexMarkerProps(props) {
  props = { ...props };
  const toExclude = {
    position: true,
    containerAttrs: true,
    wrapperAttrs: true,
    zeroSizes: true
  };
  for (const excluded in toExclude) {
    if (excluded in props)
      delete props[excluded];
  }
  return props;
}
defineComponent({
  name: "YandexMapMarker",
  inheritAttrs: false,
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      required: true
    },
    /**
     * @description Sets translate(%, %) to marker to align it properly.
     *
     * If you want to make aligment to be like Yandex Maps 2.0, set this property to "top left-center".
     * @default default (as goes in Yandex by default)
     */
    position: {
      type: String
    },
    /**
     * @description Allows you to add any attributes to <div class="__ymap-marker"> container.
     *
     * Important: to pass styles, you must use object-style prop instead of string.
     */
    containerAttrs: {
      type: Object,
      default: () => ({})
    },
    /**
     * @description Allows you to add any attributes to <div class="__ymap-marker_wrapper"> container.
     *
     * Important: to pass styles, you must use object-style prop instead of string.
     */
    wrapperAttrs: {
      type: Object,
      default: () => ({})
    },
    /**
     * @description Will add width and height: 0 to container.
     *
     * Null enables default behavior, false disables it completely (even if position is specified).
     *
     * @default true if position is specified, false otherwise
     */
    zeroSizes: {
      type: Boolean,
      default: null
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit,
    attrs
  }) {
    const element = ref(null);
    watch(element, () => {
      var _a;
      if (element.value)
        (_a = element.value.parentNode) == null ? void 0 : _a.removeChild(element.value);
    });
    const rootProps = computed(() => getMarkerContainerProps({
      position: props.position,
      containerAttrs: props.containerAttrs,
      wrapperAttrs: props.wrapperAttrs,
      zeroSizes: props.zeroSizes
    }));
    return () => {
      var _a;
      return hF([
        h("div", {
          ...rootProps.value.root,
          ref: element,
          ...getAttrsForVueVersion(attrs)
        }, [
          h("div", {
            ...rootProps.value.children
          }, (_a = slots.default) == null ? void 0 : _a.call(slots, {}))
        ])
      ]);
    };
  }
});
const _sfc_main$f = defineComponent({
  name: "YandexMapDefaultMarker",
  inheritAttrs: false,
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      required: true
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit,
    attrs
  }) {
    const popup = ref(null);
    const closeFunc = ref(() => {
    });
    const contentFunc = (close) => {
      closeFunc.value = close;
      return popup.value;
    };
    computed(() => {
      const settings = { ...props.settings };
      if (settings.popup && (typeof settings.popup.content === "undefined" || settings.popup.content === "fromSlot") && popup.value) {
        settings.popup = {
          ...settings.popup,
          content: contentFunc
        };
      }
      return settings;
    });
    watch(popup, () => {
      var _a;
      if (popup.value)
        (_a = popup.value.parentNode) == null ? void 0 : _a.removeChild(popup.value);
    });
    return () => {
      var _a;
      if (slots.popup) {
        return hF([
          h("div", {
            ref: popup
          }, (_a = slots.popup) == null ? void 0 : _a.call(slots, { close: closeFunc.value }))
        ]);
      }
      return void 0;
    };
  }
});
defineComponent({
  name: "YandexMapFeature",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      required: true
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
defineComponent({
  name: "YandexMapControls",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      required: true
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const mapChildren = shallowRef(null);
    return () => {
      var _a;
      return mapChildren.value ? hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {})) : h("div");
    };
  }
});
defineComponent({
  name: "YandexMapControl",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit,
    attrs
  }) {
    const element = ref(null);
    return () => {
      var _a;
      return hF([
        h("div", {
          ref: element,
          ...getAttrsForVueVersion(attrs)
        }, (_a = slots.default) == null ? void 0 : _a.call(slots, {}))
      ]);
    };
  }
});
defineComponent({
  name: "YandexMapControlButton",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit,
    attrs
  }) {
    const element = ref(null);
    return () => {
      var _a;
      return hF([
        h("div", {
          ref: element,
          ...getAttrsForVueVersion(attrs)
        }, (_a = slots.default) == null ? void 0 : _a.call(slots, {}))
      ]);
    };
  }
});
defineComponent({
  name: "YandexMapGeolocationControl",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
defineComponent({
  name: "YandexMapZoomControl",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  slots: Object,
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  setup(props, {
    slots,
    emit
  }) {
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
defineComponent({
  name: "YandexMapScaleControl",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  slots: Object,
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  setup(props, {
    slots,
    emit
  }) {
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
defineComponent({
  name: "YandexMapCartesianProjection",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    bounds: {
      type: Array,
      required: true
    },
    cycled: {
      type: Array
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    },
    hold(status) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const hold = inject("needsToHold");
    hold.value++;
    inject("projection");
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
defineComponent({
  name: "YandexMapSphericalMercatorProjection",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    },
    hold(status) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const hold = inject("needsToHold");
    hold.value++;
    inject("projection");
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
defineComponent({
  name: "YandexMapHint",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    // Property that you will set on YandexMapMarker or YandexMapFeature to display hint content
    hintProperty: {
      type: String,
      required: true
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit,
    attrs
  }) {
    const element = shallowRef(null);
    const hintContent = shallowRef("");
    return () => {
      var _a;
      return hF([
        h("div", {
          ref: element,
          ...getAttrsForVueVersion(attrs)
        }, (_a = slots.default) == null ? void 0 : _a.call(slots, { content: hintContent.value }))
      ]);
    };
  }
});
defineComponent({
  name: "YandexMapOpenMapsButton",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    return () => {
      var _a;
      return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
    };
  }
});
const _sfc_main$3$1 = defineComponent({
  name: "YandexMapClustererClusters",
  props: {
    clusterMarkerProps: {
      type: Object,
      default: () => ({})
    },
    zoomOnClusterClick: {
      type: [Boolean, Object],
      default: false
    }
  },
  slots: Object,
  emits: {
    // Exact features bounds returned on cluster click
    trueBounds(bounds) {
      return bounds.length === 2;
    },
    // Auto-corrected features bounds returned on cluster click
    updatedBounds(bounds) {
      return bounds.length === 2;
    }
  },
  setup(props, { slots, emit }) {
    const map = injectMap();
    const features = inject("clusterFeatures");
    const containerProps = computed(() => {
      var _a2;
      var _a, _b, _c, _d;
      return getMarkerContainerProps({
        position: (_a2 = (_a = props.clusterMarkerProps) == null ? void 0 : _a.position) != null ? _a2 : "top-center left-center",
        containerAttrs: (_b = props.clusterMarkerProps) == null ? void 0 : _b.containerAttrs,
        wrapperAttrs: (_c = props.clusterMarkerProps) == null ? void 0 : _c.wrapperAttrs,
        zeroSizes: (_d = props.clusterMarkerProps) == null ? void 0 : _d.zeroSizes
      });
    });
    return () => {
      const clusterSlots = features.value.map(({
        clusterer,
        element
      }, index) => {
        var _a;
        return hF([
          h(
            "div",
            {
              ...containerProps.value.root,
              ref: async (_item) => {
                if (!_item)
                  return;
                const item = _item;
                if (element.children.length)
                  return;
                await nextTick();
                try {
                  element.addChild(new ymaps3.YMapMarker({
                    ...excludeYandexMarkerProps(props.clusterMarkerProps),
                    coordinates: clusterer.lnglat,
                    onClick: async (e) => {
                      var _a3;
                      var _a2, _b, _c, _d;
                      (_b = (_a2 = props.clusterMarkerProps).onClick) == null ? void 0 : _b.call(_a2, e);
                      if (clusterer.features.length >= 2) {
                        const settings = typeof props.zoomOnClusterClick === "object" ? props.zoomOnClusterClick : {};
                        const featuresCoords = clusterer.features.map((x) => x.geometry.coordinates);
                        const bounds = getBoundsFromCoords(featuresCoords);
                        emit("trueBounds", bounds);
                        if (!props.zoomOnClusterClick)
                          return;
                        const defaultDuration = (_a3 = settings.duration) != null ? _a3 : 500;
                        if (settings.strategy === "boundsCorrect") {
                          const [[minLongitude, maxLatitude], [maxLongitude, minLatitude]] = bounds;
                          const latDiff = maxLatitude - minLatitude;
                          const longDiff = maxLongitude - minLongitude;
                          const updatedBounds = [[minLongitude - longDiff, maxLatitude - latDiff], [maxLongitude + longDiff, minLatitude + latDiff]];
                          emit("updatedBounds", updatedBounds);
                          (_c = map.value) == null ? void 0 : _c.setLocation({
                            bounds: updatedBounds,
                            duration: defaultDuration,
                            easing: settings.easing
                          });
                        } else {
                          const { center, zoom } = await getLocationFromBounds({
                            bounds,
                            map: map.value,
                            roundZoom: true,
                            comfortZoomLevel: true
                          });
                          (_d = map.value) == null ? void 0 : _d.setLocation({
                            center,
                            zoom,
                            duration: defaultDuration,
                            easing: settings.easing
                          });
                          await sleep(defaultDuration + 50);
                          if (map.value)
                            emit("updatedBounds", map.value.bounds);
                        }
                      }
                    }
                  }, item));
                } catch (e) {
                  console.error(e);
                }
              }
            },
            [
              h("div", {
                ...containerProps.value.children
              }, (_a = slots.default) == null ? void 0 : _a.call(slots, {
                clusterer,
                coordinates: clusterer.lnglat,
                length: clusterer.features.length
              }))
            ]
          )
        ], {
          key: clusterer.clusterId + clusterer.features.length
        });
      });
      return hF(clusterSlots);
    };
  }
});
defineComponent({
  name: "YandexMapClusterer",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: () => ({})
    },
    /**
     * @description All custom (non-settings) props are also supported
     */
    clusterMarkerProps: {
      type: Object,
      default: () => ({})
    },
    /**
     * @description Size of the grid division in pixels
     *
     * Used in settings.method via Yandex clusterByGrid method
     *
     * @see https://yandex.ru/dev/jsapi30/doc/ru/ref/packages/clusterer/
     * @see https://yandex.ru/dev/jsapi30/doc/en/ref/packages/clusterer/
     */
    gridSize: {
      type: Number,
      default: 64
    },
    /**
     * @description Zooms to bounds of features of cluster
     */
    zoomOnClusterClick: {
      type: [Boolean, Object],
      default: false
    }
  },
  slots: Object,
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    },
    // Exact features bounds returned on cluster click
    trueBounds(bounds) {
      return bounds.length === 2;
    },
    // Auto-corrected features bounds returned on cluster click
    updatedBounds(bounds) {
      return bounds.length === 2;
    }
  },
  setup(props, {
    slots,
    emit
  }) {
    const mapChildren = shallowRef(null);
    const entities = shallowRef([]);
    const clusterFeatures = shallowRef([]);
    const filteredFeatures = computed(() => clusterFeatures.value.filter((x) => x.clusterer.features.length > 1));
    provide("clusterFeatures", filteredFeatures);
    let _clusterByGrid;
    const tickTimeout = computed(() => props.settings.tickTimeout);
    const getSettings = () => {
      const settings = { ...props.settings };
      if (!settings.method && _clusterByGrid)
        settings.method = void 0;
      if (tickTimeout.value)
        settings.tickTimeout = tickTimeout.value;
      const marker = (feature) => {
        const entity = entities.value.find((x) => x._props.id === feature.id);
        if (!entity) {
          throwException({
            text: `No entity with id ${feature.id} (coordinates: ${feature.geometry.coordinates.join(", ")}) were found in YandexMapClusterer.`,
            isInternal: true,
            warn: true
          });
          return new ymaps3.YMapMarker({ coordinates: feature.geometry.coordinates });
        }
        return entity;
      };
      const cluster = (coordinates) => {
        const foundCluster = clusterFeatures.value.find((x) => x.clusterer.lnglat[0] === coordinates[0] && x.clusterer.lnglat[1] === coordinates[1]);
        if (!foundCluster) {
          throwException({
            text: `No element with coordinates of ${coordinates.join(", ")} were found in YandexMapClusterer.`,
            isInternal: true,
            warn: true
          });
          return new ymaps3.YMapMarker({ coordinates });
        }
        return foundCluster.element;
      };
      const features = entities.value.map((entity, i) => {
        if (!entity._props.id) {
          entity.update({
            id: Math.random().toString() + Date.now().toString()
          });
        }
        return {
          type: "Feature",
          id: entity._props.id,
          geometry: {
            type: "Point",
            coordinates: entity._props.coordinates
          },
          properties: "properties" in entity._props ? entity._props.properties : {}
        };
      });
      settings.onRender = (clustersList) => {
        clusterFeatures.value = clustersList.map((clusterer) => {
          var _a;
          return {
            clusterer,
            element: ((_a = clusterFeatures.value.find((x) => x.clusterer.clusterId === clusterer.clusterId)) == null ? void 0 : _a.element) || new ymaps3.YMapCollection({})
          };
        });
        if (props.settings.onRender)
          return props.settings.onRender(clustersList);
      };
      return {
        ...settings,
        marker,
        features,
        cluster
      };
    };
    const update = async () => {
      var _a, _b;
      await nextTick();
      (_a = mapChildren.value) == null ? void 0 : _a.update(getSettings());
      (_b = mapChildren.value) == null ? void 0 : _b._render();
    };
    watch(() => [props.settings, props.gridSize], () => {
      update();
    }, {
      deep: true
    });
    watch(entities, async () => {
      await nextTick();
      update();
    });
    return () => {
      var _a, _b;
      if (!mapChildren.value)
        return h("div");
      if (isVue2()) {
        return h("div", [
          ...((_a = slots.default) == null ? void 0 : _a.call(slots, {})) || [],
          h(_sfc_main$3$1, {
            props: {
              clusterMarkerProps: props.clusterMarkerProps,
              zoomOnClusterClick: props.zoomOnClusterClick
            },
            on: {
              trueBounds: (e) => emit("trueBounds", e),
              updatedBounds: (e) => emit("updatedBounds", e)
            },
            scopedSlots: {
              default: (options) => {
                var _a2;
                return h("div", {}, [(_a2 = slots.cluster) == null ? void 0 : _a2.call(slots, options)]);
              }
            }
          })
        ]);
      }
      return h("div", [
        ...((_b = slots.default) == null ? void 0 : _b.call(slots, {})) || [],
        h(_sfc_main$3$1, {
          clusterMarkerProps: props.clusterMarkerProps,
          zoomOnClusterClick: props.zoomOnClusterClick,
          onTrueBounds: (e) => emit("trueBounds", e),
          onUpdatedBounds: (e) => emit("updatedBounds", e)
        }, {
          default: (options) => {
            var _a2;
            return (_a2 = slots.cluster) == null ? void 0 : _a2.call(slots, options);
          }
        })
      ]);
    };
  }
});
defineComponent({
  name: "YandexMapCollection",
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit
  }) {
    const mapChildren = shallowRef(null);
    return () => {
      if (!mapChildren.value)
        return h("div");
      return () => {
        var _a;
        return hVue2((_a = slots.default) == null ? void 0 : _a.call(slots, {}));
      };
    };
  }
});
defineComponent({
  name: "YandexMapEntity",
  inheritAttrs: false,
  props: {
    value: {
      type: Object,
      default: null
    },
    modelValue: {
      type: Object,
      default: null
    }
  },
  emits: {
    "input"(item) {
      return true;
    },
    "update:modelValue"(item) {
      return true;
    }
  },
  slots: Object,
  setup(props, {
    slots,
    emit,
    attrs
  }) {
    const element = ref(null);
    return () => {
      var _a;
      return hF([
        h("div", {
          ref: element,
          ...getAttrsForVueVersion(attrs)
        }, (_a = slots.default) == null ? void 0 : _a.call(slots, {}))
      ]);
    };
  }
});
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "YandexMap",
  __ssrInlineRender: true,
  props: {
    "longitude": { required: true },
    "longitudeModifiers": {},
    "latitude": { required: true },
    "latitudeModifiers": {}
  },
  emits: ["update:longitude", "update:latitude"],
  setup(__props) {
    const longitude = useModel(__props, "longitude");
    const latitude = useModel(__props, "latitude");
    const selectedSearch = ref(null);
    const search = ref("");
    const searchResponse = shallowRef(null);
    const map = shallowRef(null);
    const zoom = ref(12);
    function sleep2(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    watch(search, async (val) => {
      var _a;
      if (!val)
        return;
      if (val.split(/[,.]/).length === 4) {
        selectedSearch.value = val.split(",").map((x) => parseFloat(x));
        longitude.value = selectedSearch.value[0];
        latitude.value = selectedSearch.value[1];
        return;
      }
      await sleep2(300);
      if (val !== search.value)
        return;
      searchResponse.value = await ymaps3.search({
        text: val,
        bounds: (_a = map.value) == null ? void 0 : _a.bounds
      });
    });
    watch([selectedSearch], async () => {
      var _a, _b;
      if (selectedSearch.value) {
        (_a = map.value) == null ? void 0 : _a.setLocation({
          center: selectedSearch.value,
          zoom: 15,
          duration: 300
        });
      } else if (selectedSearch.value) {
        (_b = map.value) == null ? void 0 : _b.setLocation({
          ...await getLocationFromBounds({
            bounds: getBoundsFromCoords([selectedSearch.value]),
            map: map.value,
            comfortZoomLevel: true
          }),
          duration: 300
        });
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full pt-2 space-y-2" }, _attrs))}><label class="relative w-full"><span>\u0413\u0435\u043E\u043B\u043E\u043A\u0430\u0446\u0438\u044F</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M46.2731 81.0303L44.5772 77.6387C39.0857 66.6474 33.5692 55.9933 26.5026 46.4187C21.9736 40.2688 20.0611 32.673 21.1236 25.0232C22.9194 12.115 33.6274 1.67363 46.594 0.198662C54.8979 -0.776319 63.2269 1.87343 69.4183 7.40243C75.6141 12.9355 79.1681 20.8688 79.1681 29.1686C79.1681 34.681 77.6139 40.0518 74.6723 44.7017L72.2762 48.4724C67.0704 56.6537 61.6876 65.1132 57.3227 73.847L53.7311 81.0303C53.023 82.4428 51.5812 83.3343 50.0021 83.3343C48.423 83.3343 46.9815 82.4428 46.2731 81.0303ZM62.5019 29.1688C62.5019 22.2773 56.8936 16.669 50.0021 16.669C43.1107 16.669 37.5024 22.2773 37.5024 29.1688C37.5024 36.0603 43.1107 41.6686 50.0021 41.6686C56.8936 41.6686 62.5019 36.0603 62.5019 29.1688ZM70.9412 64.234C71.4703 61.9965 73.7202 60.6008 75.9536 61.1424C91.4617 64.8174 99.999 71.2172 99.999 79.1671C99.999 92.8418 74.8454 100 50 100C25.1589 100 0.000976562 92.8418 0.000976562 79.1671C0.000976562 71.2172 8.53831 64.8174 24.0421 61.1424C26.2755 60.6007 28.5254 61.9965 29.0545 64.234C29.5879 66.4714 28.2045 68.7173 25.963 69.2464C13.03 72.3172 8.33421 76.8587 8.33421 79.1671C8.33421 84.1461 24.9546 91.6668 50 91.6668C75.0495 91.6668 91.6658 84.1461 91.6658 79.1671C91.6658 76.8587 86.9741 72.3172 74.0327 69.2464C71.7953 68.7173 70.4078 66.4714 70.9412 64.234Z" fill="black"></path></svg><input class="border px-2 w-full h-full rounded-r-md peer"${ssrRenderAttr("value", search.value)} type="text" list="search" placeholder="\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0432\u0432\u043E\u0434\u0438\u0442\u044C \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430" autocomplete="off"><datalist id="search"><!--[-->`);
      ssrRenderList((_a = searchResponse.value) != null ? _a : [], (item, index) => {
        var _a2;
        _push(`<option${ssrRenderAttr("value", (_a2 = item.geometry) == null ? void 0 : _a2.coordinates)}>${ssrInterpolate(item.properties.name)} (${ssrInterpolate(item.properties.description)}) </option>`);
      });
      _push(`<!--]--></datalist></div></label>`);
      _push(ssrRenderComponent(unref(_sfc_main$o), {
        modelValue: map.value,
        "onUpdate:modelValue": ($event) => map.value = $event,
        settings: {
          location: {
            center: (_b = selectedSearch.value) != null ? _b : [66.975836, 39.654397],
            zoom: zoom.value
          },
          className: "rounded-md border-2 border-gray-400",
          theme: "light",
          showScaleInCopyrights: true
        },
        width: "100%",
        height: "16.4rem"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(_sfc_main$l), null, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(unref(_sfc_main$m), null, null, _parent2, _scopeId));
            if (selectedSearch.value) {
              _push2(ssrRenderComponent(unref(_sfc_main$f), {
                settings: { coordinates: selectedSearch.value }
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(ssrRenderComponent(unref(_sfc_main$n), {
              settings: {
                onClick: (object, event) => {
                  if (map.value)
                    zoom.value = map.value.zoom;
                  selectedSearch.value = event.coordinates;
                  longitude.value = selectedSearch.value[0];
                  latitude.value = selectedSearch.value[1];
                  search.value = event.coordinates.toString();
                }
              }
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(unref(_sfc_main$l)),
              createVNode(unref(_sfc_main$m)),
              selectedSearch.value ? (openBlock(), createBlock(unref(_sfc_main$f), {
                key: 0,
                settings: { coordinates: selectedSearch.value }
              }, null, 8, ["settings"])) : createCommentVNode("", true),
              createVNode(unref(_sfc_main$n), {
                settings: {
                  onClick: (object, event) => {
                    if (map.value)
                      zoom.value = map.value.zoom;
                    selectedSearch.value = event.coordinates;
                    longitude.value = selectedSearch.value[0];
                    latitude.value = selectedSearch.value[1];
                    search.value = event.coordinates.toString();
                  }
                }
              }, null, 8, ["settings"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/YandexMap.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "Dropdown",
  __ssrInlineRender: true,
  props: {
    list: {},
    placeholder: {},
    active: { type: Boolean }
  },
  emits: ["select"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const dropdown = ref(false);
    const selectItem = ref(props.placeholder);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<button${ssrRenderAttrs(mergeProps({
        disabled: !_ctx.active,
        class: "relative h-10 w-full flex items-center"
      }, _attrs))}><span class="border leading-10 px-2 w-full h-full text-start rounded-r-md bg-white">${ssrInterpolate(_ctx.active ? unref(selectItem) : "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u044C")}</span><svg class="${ssrRenderClass([unref(dropdown) ? "rotate-90" : "rotate-0", "w-[1.3rem] h-[1.3rem] absolute right-2 fill-[#191D23] dark:fill-white transition-transform"])}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"><path fill="#191D23" fill-rule="evenodd" clip-rule="evenodd" d="M7.29308 14.707C7.10561 14.5194 7.00029 14.2651 7.00029 14C7.00029 13.7348 7.10561 13.4805 7.29308 13.293L10.5861 9.99997L7.29308 6.70697C7.19757 6.61472 7.12139 6.50438 7.06898 6.38237C7.01657 6.26037 6.98898 6.12915 6.98783 5.99637C6.98668 5.86359 7.01198 5.73191 7.06226 5.60902C7.11254 5.48612 7.18679 5.37447 7.28069 5.28057C7.37458 5.18668 7.48623 5.11243 7.60913 5.06215C7.73202 5.01187 7.8637 4.98656 7.99648 4.98772C8.12926 4.98887 8.26048 5.01646 8.38249 5.06887C8.50449 5.12128 8.61483 5.19746 8.70708 5.29297L12.7071 9.29297C12.8946 9.4805 12.9999 9.73481 12.9999 9.99997C12.9999 10.2651 12.8946 10.5194 12.7071 10.707L8.70708 14.707C8.51955 14.8944 8.26525 14.9998 8.00008 14.9998C7.73492 14.9998 7.48061 14.8944 7.29308 14.707Z"></path></svg><div class="${ssrRenderClass([{ "hidden": !unref(dropdown) }, "transition-all z-20 absolute top-12 right-1 w-full h-72 overflow-y-scroll rounded-md shadow-md overflow-hidden divide-y-2 bg-white"])}"><!--[-->`);
      ssrRenderList(_ctx.list, (item) => {
        _push(`<p class="flex items-center gap-4 py-2 px-4 hover:bg-gray-200">${ssrInterpolate(item)}</p>`);
      });
      _push(`<!--]--></div></button>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Dropdown.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ContactDetails",
  __ssrInlineRender: true,
  props: {
    "modelValue": { required: true },
    "modelModifiers": {}
  },
  emits: ["update:modelValue"],
  setup(__props) {
    const data = useModel(__props, "modelValue");
    const emailFlag = ref(false);
    const selectRegion = (region) => {
      data.value.region = region;
    };
    const selectDistrict = (district) => {
      data.value.district = district;
    };
    const regionList = {
      "\u041A\u0430\u0448\u043A\u0430\u0434\u0430\u0440\u044C\u0438\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0413\u0443\u0437\u0430\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0414\u0435\u0445\u043A\u0430\u043D\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u043C\u0430\u0448\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u0440\u0448\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u0441\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u0441\u0431\u0438\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0438\u0442\u0430\u0431\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0438\u0440\u0438\u0448\u043A\u043E\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0443\u0431\u0430\u0440\u0435\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041D\u0438\u0448\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0427\u0438\u0440\u0430\u043A\u0447\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0428\u0430\u0445\u0440\u0438\u0441\u0430\u0431\u0437\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042F\u043A\u043A\u0430\u0431\u0430\u0433\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u041A\u0430\u0440\u0448\u0438"
      ],
      "\u041D\u0430\u0432\u043E\u0438\u0439\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u041A\u0430\u043D\u0438\u043C\u0435\u0445\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u0440\u043C\u0430\u043D\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u044B\u0437\u044B\u043B\u0442\u0435\u043F\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041D\u0430\u0432\u0431\u0430\u0445\u043E\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041D\u0443\u0440\u0430\u0442\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0422\u0430\u043C\u0434\u044B\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0447\u043A\u0443\u0434\u0443\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0425\u0430\u0442\u044B\u0440\u0447\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0417\u0430\u0440\u0430\u0444\u0448\u0430\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u041D\u0430\u0432\u043E\u0438"
      ],
      "\u041D\u0430\u043C\u0430\u043D\u0433\u0430\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u041A\u0430\u0441\u0430\u043D\u0441\u0430\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0438\u043D\u0433\u0431\u0443\u043B\u0430\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041D\u0430\u043C\u0430\u043D\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041D\u0430\u0440\u044B\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041F\u0430\u043F\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0422\u0443\u0440\u0430\u043A\u0443\u0440\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0439\u0447\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0447\u043A\u0443\u0440\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0427\u0430\u0440\u0442\u0430\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0427\u0443\u0441\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042F\u043D\u0433\u0438\u043A\u0443\u0440\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u041D\u0430\u043C\u0430\u043D\u0433\u0430\u043D"
      ],
      "\u0421\u0430\u043C\u0430\u0440\u043A\u0430\u043D\u0434\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0410\u043A\u0434\u0430\u0440\u044C\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0443\u043B\u0443\u043D\u0433\u0443\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0414\u0436\u0430\u043C\u0431\u0430\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0418\u0448\u0442\u044B\u0445\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u0442\u0442\u0430\u043A\u0443\u0440\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u043E\u0448\u0440\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041D\u0430\u0440\u043F\u0430\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041D\u0443\u0440\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041F\u0430\u0439\u0430\u0440\u044B\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041F\u0430\u0441\u0442\u0434\u0430\u0440\u0433\u043E\u043C\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041F\u0430\u0445\u0442\u0430\u0447\u0438\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0421\u0430\u043C\u0430\u0440\u043A\u0430\u043D\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0422\u0430\u0439\u043B\u0430\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0440\u0433\u0443\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u041A\u0430\u0442\u0442\u0430\u043A\u0443\u0440\u0433\u0430\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0421\u0430\u043C\u0430\u0440\u043A\u0430\u043D\u0434"
      ],
      "\u0421\u0443\u0440\u0445\u0430\u043D\u0434\u0430\u0440\u044C\u0438\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0410\u043B\u0442\u044B\u043D\u0441\u0430\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0410\u043D\u0433\u043E\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0430\u0439\u0441\u0443\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0430\u043D\u0434\u0438\u0445\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0414\u0435\u043D\u0430\u0443\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0414\u0436\u0430\u0440\u043A\u0443\u0440\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0438\u0437\u0438\u0440\u0438\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0443\u043C\u043A\u0443\u0440\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0443\u0437\u0440\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0421\u0430\u0440\u0438\u0430\u0441\u0438\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0422\u0435\u0440\u043C\u0435\u0437\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0437\u0443\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0428\u0435\u0440\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0428\u0443\u0440\u0447\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0422\u0435\u0440\u043C\u0435\u0437"
      ],
      "\u0421\u044B\u0440\u0434\u0430\u0440\u044C\u0438\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0410\u043A\u0430\u043B\u0442\u044B\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0430\u044F\u0443\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0413\u0443\u043B\u0438\u0441\u0442\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0438\u0440\u0437\u0430\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0421\u0430\u0439\u0445\u0443\u043D\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0421\u0430\u0440\u0434\u043E\u0431\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0421\u044B\u0440\u0434\u0430\u0440\u044C\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0425\u0430\u0432\u0430\u0441\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0413\u0443\u043B\u0438\u0441\u0442\u0430\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0428\u0438\u0440\u0438\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u042F\u043D\u0433\u0438\u0435\u0440"
      ],
      "\u0413\u043E\u0440\u043E\u0434 \u0422\u0430\u0448\u043A\u0435\u043D\u0442": [
        "\u0410\u043B\u043C\u0430\u0437\u0430\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0435\u043A\u0442\u0435\u043C\u0438\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0438\u0440\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0438\u0440\u0437\u043E-\u0423\u043B\u0443\u0433\u0431\u0435\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0421\u0435\u0440\u0433\u0435\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0447\u0442\u0435\u043F\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042F\u0448\u043D\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0427\u0438\u043B\u0430\u043D\u0437\u0430\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0428\u0430\u0439\u0445\u0430\u043D\u0442\u0430\u0445\u0443\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042E\u043D\u0443\u0441\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042F\u043A\u043A\u0430\u0441\u0430\u0440\u0430\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D"
      ],
      "\u0422\u0430\u0448\u043A\u0435\u043D\u0442\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0410\u043A\u043A\u0443\u0440\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0410\u0445\u0430\u043D\u0433\u0430\u0440\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0435\u043A\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u043E\u0441\u0442\u0430\u043D\u043B\u044B\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0443\u043A\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0417\u0430\u043D\u0433\u0438\u0430\u0442\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0438\u0431\u0440\u0430\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0443\u0439\u0438\u0447\u0438\u0440\u0447\u0438\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041F\u0430\u0440\u043A\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041F\u0441\u043A\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0422\u0430\u0448\u043A\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0440\u0442\u0430\u0447\u0438\u0440\u0447\u0438\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0427\u0438\u043D\u0430\u0437\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042E\u043A\u043E\u0440\u0438\u0447\u0438\u0440\u0447\u0438\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042F\u043D\u0433\u0438\u044E\u043B\u044C\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0410\u043B\u043C\u0430\u043B\u044B\u043A",
        "\u0433\u043E\u0440\u043E\u0434 \u0410\u043D\u0433\u0440\u0435\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0411\u0435\u043A\u0430\u0431\u0430\u0434",
        "\u0433\u043E\u0440\u043E\u0434 \u0427\u0438\u0440\u0447\u0438\u043A"
      ],
      "\u0424\u0435\u0440\u0433\u0430\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0410\u043B\u0442\u044B\u0430\u0440\u044B\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0430\u0433\u0434\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0435\u0448\u0430\u0440\u044B\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0443\u0432\u0430\u0439\u0434\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0414\u0430\u043D\u0433\u0430\u0440\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0443\u0432\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0443\u0448\u0442\u0435\u043F\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0420\u0438\u0448\u0442\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0421\u043E\u0445\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0422\u0430\u0448\u043B\u0430\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0447\u043A\u0443\u043F\u0440\u0438\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0424\u0435\u0440\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0424\u0443\u0440\u043A\u0430\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042F\u0437\u044A\u044F\u0432\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u041A\u043E\u043A\u0430\u043D\u0434",
        "\u0433\u043E\u0440\u043E\u0434 \u041A\u0443\u0432\u0430\u0441\u0430\u0439",
        "\u0433\u043E\u0440\u043E\u0434 \u041C\u0430\u0440\u0433\u0438\u043B\u0430\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0424\u0435\u0440\u0433\u0430\u043D\u0430"
      ],
      "\u0425\u043E\u0440\u0435\u0437\u043C\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0411\u0430\u0433\u0430\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0413\u0443\u0440\u043B\u0435\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u043E\u0448\u043A\u0443\u043F\u044B\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u0440\u0433\u0435\u043D\u0447\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0425\u0430\u0437\u0430\u0440\u0430\u0441\u043F\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0425\u0430\u043D\u043A\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0425\u0438\u0432\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0428\u0430\u0432\u0430\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042F\u043D\u0433\u0438\u0430\u0440\u044B\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042F\u043D\u0433\u0438\u0431\u0430\u0437\u0430\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0423\u0440\u0433\u0435\u043D\u0447"
      ],
      "\u0420\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0430 \u041A\u0430\u0440\u0430\u043A\u0430\u043B\u043F\u0430\u043A\u0438\u0441\u0442\u0430\u043D": [
        "\u0410\u043C\u0443\u0434\u0430\u0440\u044C\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0435\u0440\u0443\u043D\u0438\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u0440\u0430\u0443\u0437\u044F\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0435\u0433\u0435\u0439\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0443\u043D\u0433\u0440\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u043D\u043B\u044B\u043A\u0443\u043B\u044C\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0443\u0439\u043D\u0430\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041D\u0443\u043A\u0443\u0441\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0422\u0430\u0445\u0438\u0430\u0442\u0430\u0448\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0422\u0430\u0445\u0442\u0430\u043A\u0443\u043F\u044B\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0422\u0443\u0440\u0442\u043A\u0443\u043B\u044C\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0425\u043E\u0434\u0436\u0435\u0439\u043B\u0438\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0427\u0438\u043C\u0431\u0430\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0428\u0443\u043C\u0430\u043D\u0430\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042D\u043B\u043B\u0438\u043A\u043A\u0430\u043B\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u041D\u0443\u043A\u0443\u0441"
      ],
      "\u0410\u043D\u0434\u0438\u0436\u0430\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0410\u043B\u0442\u044B\u043D\u043A\u0443\u043B\u044C\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0410\u043D\u0434\u0438\u0436\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0410\u0441\u0430\u043A\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0430\u043B\u044B\u043A\u0447\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u043E\u0437\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0443\u043B\u0430\u043A\u0431\u0430\u0448\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0414\u0436\u0430\u043B\u0430\u043A\u0443\u0434\u0443\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0418\u0437\u0431\u0430\u0441\u043A\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0443\u0440\u0433\u0430\u043D\u0442\u0435\u043F\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0430\u0440\u0445\u0430\u043C\u0430\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041F\u0430\u0445\u0442\u0430\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0423\u043B\u0443\u0433\u043D\u043E\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0425\u043E\u0434\u0436\u0430\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0428\u0430\u0445\u0440\u0438\u0445\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0410\u043D\u0434\u0438\u0436\u0430\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0425\u0430\u043D\u0430\u0431\u0430\u0434"
      ],
      "\u0411\u0443\u0445\u0430\u0440\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0410\u043B\u0430\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0443\u0445\u0430\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0412\u0430\u0431\u043A\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0413\u0438\u0436\u0434\u0443\u0432\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0416\u043E\u043D\u0434\u043E\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u0433\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u0440\u0430\u043A\u0443\u043B\u044C\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041A\u0430\u0440\u0430\u0443\u043B\u0431\u0430\u0437\u0430\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041F\u0435\u0448\u043A\u0443\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0420\u043E\u043C\u0438\u0442\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0428\u0430\u0444\u0438\u0440\u043A\u0430\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0411\u0443\u0445\u0430\u0440\u0430",
        "\u0433\u043E\u0440\u043E\u0434 \u041A\u0430\u0433\u0430\u043D"
      ],
      "\u0414\u0436\u0438\u0437\u0430\u043A\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C": [
        "\u0410\u0440\u043D\u0430\u0441\u0430\u0439\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0411\u0430\u0445\u043C\u0430\u043B\u044C\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0413\u0430\u043B\u043B\u044F\u0430\u0440\u0430\u043B\u044C\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0414\u0443\u0441\u0442\u043B\u0438\u043A\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0417\u0430\u0430\u043C\u0438\u043D\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0417\u0430\u0440\u0431\u0434\u0430\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0417\u0430\u0444\u0430\u0440\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041C\u0438\u0440\u0437\u0430\u0447\u0443\u043B\u044C\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u041F\u0430\u0445\u0442\u0430\u043A\u043E\u0440\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0424\u0430\u0440\u0438\u0448\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0428\u0430\u0440\u0430\u0444-\u0420\u0430\u0448\u0438\u0434\u043E\u0432\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u042F\u043D\u0433\u0438\u0430\u0431\u0430\u0434\u0441\u043A\u0438\u0439 \u0440\u0430\u0439\u043E\u043D",
        "\u0433\u043E\u0440\u043E\u0434 \u0414\u0436\u0438\u0437\u0430\u043A"
      ]
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_YandexMap = _sfc_main$3;
      const _component_Dropdown = _sfc_main$2;
      const _directive_maska = resolveDirective("maska");
      let _temp0, _temp1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-8 h-full flex flex-col gap-5 animate-moving" }, _attrs))}><div class="flex justify-between"><label class="relative w-80"><span>\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.7813 3.19369C12.8749 2.10175 14.188 1.25468 15.6337 0.708629C17.0795 0.162577 18.6247 -0.0699918 20.1671 0.0263345C21.7095 0.122661 23.2139 0.545683 24.5804 1.26737C25.947 1.98905 27.1445 2.99292 28.0938 4.21244L39.3125 18.6249C41.3688 21.2687 42.0938 24.7124 41.2813 27.9624L37.8625 41.6499C37.6858 42.3589 37.6953 43.1015 37.8902 43.8056C38.0852 44.5098 38.4589 45.1516 38.975 45.6687L54.3313 61.0249C54.849 61.5421 55.4918 61.9165 56.1972 62.1114C56.9026 62.3064 57.6464 62.3153 58.3563 62.1374L72.0375 58.7187C73.6414 58.3177 75.3154 58.2865 76.933 58.6276C78.5507 58.9687 80.0696 59.673 81.375 60.6874L95.7875 71.8999C100.969 75.9312 101.444 83.5874 96.8063 88.2187L90.3438 94.6812C85.7188 99.3062 78.8063 101.337 72.3625 99.0687C55.8699 93.2657 40.8955 83.8239 28.55 71.4437C16.1706 59.1 6.72881 44.1278 0.925014 27.6374C-1.33749 21.1999 0.693764 14.2812 5.31876 9.65619L11.7813 3.19369Z" fill="black"></path></svg><input${ssrRenderAttrs((_temp0 = mergeProps({
        "data-maska": "+998 ## ### ## ##",
        value: data.value.main_phone,
        class: "border px-2 w-full h-full rounded-r-md peer",
        placeholder: "+998 ** *** ** **",
        type: "text"
      }, ssrGetDirectiveProps(_ctx, _directive_maska)), mergeProps(_temp0, ssrGetDynamicModelProps(_temp0, data.value.main_phone))))}></div></label><label class="relative w-80"><span>\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.7813 3.19369C12.8749 2.10175 14.188 1.25468 15.6337 0.708629C17.0795 0.162577 18.6247 -0.0699918 20.1671 0.0263345C21.7095 0.122661 23.2139 0.545683 24.5804 1.26737C25.947 1.98905 27.1445 2.99292 28.0938 4.21244L39.3125 18.6249C41.3688 21.2687 42.0938 24.7124 41.2813 27.9624L37.8625 41.6499C37.6858 42.3589 37.6953 43.1015 37.8902 43.8056C38.0852 44.5098 38.4589 45.1516 38.975 45.6687L54.3313 61.0249C54.849 61.5421 55.4918 61.9165 56.1972 62.1114C56.9026 62.3064 57.6464 62.3153 58.3563 62.1374L72.0375 58.7187C73.6414 58.3177 75.3154 58.2865 76.933 58.6276C78.5507 58.9687 80.0696 59.673 81.375 60.6874L95.7875 71.8999C100.969 75.9312 101.444 83.5874 96.8063 88.2187L90.3438 94.6812C85.7188 99.3062 78.8063 101.337 72.3625 99.0687C55.8699 93.2657 40.8955 83.8239 28.55 71.4437C16.1706 59.1 6.72881 44.1278 0.925014 27.6374C-1.33749 21.1999 0.693764 14.2812 5.31876 9.65619L11.7813 3.19369ZM78.125 6.24994C78.9538 6.24994 79.7487 6.57918 80.3347 7.16523C80.9208 7.75128 81.25 8.54614 81.25 9.37494V18.7499H90.625C91.4538 18.7499 92.2487 19.0792 92.8347 19.6652C93.4208 20.2513 93.75 21.0461 93.75 21.8749C93.75 22.7037 93.4208 23.4986 92.8347 24.0846C92.2487 24.6707 91.4538 24.9999 90.625 24.9999H81.25V34.3749C81.25 35.2037 80.9208 35.9986 80.3347 36.5846C79.7487 37.1707 78.9538 37.4999 78.125 37.4999C77.2962 37.4999 76.5014 37.1707 75.9153 36.5846C75.3293 35.9986 75 35.2037 75 34.3749V24.9999H65.625C64.7962 24.9999 64.0014 24.6707 63.4153 24.0846C62.8293 23.4986 62.5 22.7037 62.5 21.8749C62.5 21.0461 62.8293 20.2513 63.4153 19.6652C64.0014 19.0792 64.7962 18.7499 65.625 18.7499H75V9.37494C75 8.54614 75.3293 7.75128 75.9153 7.16523C76.5014 6.57918 77.2962 6.24994 78.125 6.24994Z" fill="black"></path></svg><input${ssrRenderAttrs((_temp1 = mergeProps({
        "data-maska": "+998 ## ### ## ##",
        value: data.value.additional_phone,
        class: "border px-2 w-full h-full rounded-r-md peer",
        placeholder: "+998 ** *** ** **",
        type: "text"
      }, ssrGetDirectiveProps(_ctx, _directive_maska)), mergeProps(_temp1, ssrGetDynamicModelProps(_temp1, data.value.additional_phone))))}></div></label><label class="relative w-80"><span>\u0410\u0434\u0440\u0435\u0441\u0441 \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0439 \u043F\u043E\u0447\u0442\u044B</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 76" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M92.3619 0.842331L54.9081 36.2378C52.1082 38.7836 47.8832 38.7836 45.1416 36.2839L7.4585 0.896628C8.30849 0.663231 9.18348 0.500732 10.1085 0.500732H89.8911C90.7494 0.500732 91.566 0.638231 92.3619 0.842331ZM70.9209 32.5645L98.9041 6.12292C99.5791 7.48131 99.9998 8.9897 100 10.6063V65.3891C100 67.0099 99.5832 68.514 98.9041 69.8724L70.9209 32.5645ZM60.5692 42.3498C57.5401 45.1082 53.7568 46.4873 49.9777 46.4873C46.2236 46.4873 42.4737 45.1248 39.4862 42.4039L35.1737 38.3539L7.97803 75.262C8.66552 75.412 9.37391 75.4995 10.1071 75.4995H89.8899C90.7733 75.4995 91.619 75.3495 92.4358 75.1329L64.8276 38.3248L60.5692 42.3498ZM0 10.6055C0 9.05122 0.383395 7.59303 1.01249 6.27625L29.0582 32.6137L1.30839 70.2675C0.499996 68.8176 0 67.1676 0 65.3926V10.6055Z" fill="black"></path></svg><input${ssrRenderAttr("value", data.value.email)} class="${ssrRenderClass([{ "border-red-500": unref(emailFlag) }, "border px-2 w-full h-full rounded-r-md peer"])}" placeholder="email@example.com" type="text"></div><span class="absolute -bottom-5 left-14 text-sm text-red-400" style="${ssrRenderStyle(unref(emailFlag) ? null : { display: "none" })}">\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0432\u0432\u043E\u0434</span></label></div><div class=""><h3 class="text-lg font-semibold">\u0410\u0434\u0440\u0435\u0441\u0441 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0436\u0438\u0432\u0430\u043D\u0438\u044F</h3><div class="flex justify-between"><div class="w-[22rem] h-80">`);
      _push(ssrRenderComponent(_component_YandexMap, {
        longitude: data.value.longitude,
        "onUpdate:longitude": ($event) => data.value.longitude = $event,
        latitude: data.value.latitude,
        "onUpdate:latitude": ($event) => data.value.latitude = $event
      }, null, _parent));
      _push(`</div><div class="pt-2 grid grid-cols-2 gap-x-10"><label class="w-80"><span>\u041E\u0431\u043B\u0430\u0441\u0442\u044C</span><div class="h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M46.2731 81.0303L44.5772 77.6387C39.0857 66.6474 33.5692 55.9933 26.5026 46.4187C21.9736 40.2688 20.0611 32.673 21.1236 25.0232C22.9194 12.115 33.6274 1.67363 46.594 0.198662C54.8979 -0.776319 63.2269 1.87343 69.4183 7.40243C75.6141 12.9355 79.1681 20.8688 79.1681 29.1686C79.1681 34.681 77.6139 40.0518 74.6723 44.7017L72.2762 48.4724C67.0704 56.6537 61.6876 65.1132 57.3227 73.847L53.7311 81.0303C53.023 82.4428 51.5812 83.3343 50.0021 83.3343C48.423 83.3343 46.9815 82.4428 46.2731 81.0303ZM62.5019 29.1688C62.5019 22.2773 56.8936 16.669 50.0021 16.669C43.1107 16.669 37.5024 22.2773 37.5024 29.1688C37.5024 36.0603 43.1107 41.6686 50.0021 41.6686C56.8936 41.6686 62.5019 36.0603 62.5019 29.1688ZM70.9412 64.234C71.4703 61.9965 73.7202 60.6008 75.9536 61.1424C91.4617 64.8174 99.999 71.2172 99.999 79.1671C99.999 92.8418 74.8454 100 50 100C25.1589 100 0.000976562 92.8418 0.000976562 79.1671C0.000976562 71.2172 8.53831 64.8174 24.0421 61.1424C26.2755 60.6007 28.5254 61.9965 29.0545 64.234C29.5879 66.4714 28.2045 68.7173 25.963 69.2464C13.03 72.3172 8.33421 76.8587 8.33421 79.1671C8.33421 84.1461 24.9546 91.6668 50 91.6668C75.0495 91.6668 91.6658 84.1461 91.6658 79.1671C91.6658 76.8587 86.9741 72.3172 74.0327 69.2464C71.7953 68.7173 70.4078 66.4714 70.9412 64.234Z" fill="black"></path></svg>`);
      _push(ssrRenderComponent(_component_Dropdown, {
        list: Object.keys(regionList),
        placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u044C",
        active: true,
        onSelect: selectRegion
      }, null, _parent));
      _push(`</div></label><label class="relative w-80"><span>\u0420\u0430\u0439\u043E\u043D / \u0413\u043E\u0440\u043E\u0434</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M46.2731 81.0303L44.5772 77.6387C39.0857 66.6474 33.5692 55.9933 26.5026 46.4187C21.9736 40.2688 20.0611 32.673 21.1236 25.0232C22.9194 12.115 33.6274 1.67363 46.594 0.198662C54.8979 -0.776319 63.2269 1.87343 69.4183 7.40243C75.6141 12.9355 79.1681 20.8688 79.1681 29.1686C79.1681 34.681 77.6139 40.0518 74.6723 44.7017L72.2762 48.4724C67.0704 56.6537 61.6876 65.1132 57.3227 73.847L53.7311 81.0303C53.023 82.4428 51.5812 83.3343 50.0021 83.3343C48.423 83.3343 46.9815 82.4428 46.2731 81.0303ZM62.5019 29.1688C62.5019 22.2773 56.8936 16.669 50.0021 16.669C43.1107 16.669 37.5024 22.2773 37.5024 29.1688C37.5024 36.0603 43.1107 41.6686 50.0021 41.6686C56.8936 41.6686 62.5019 36.0603 62.5019 29.1688ZM70.9412 64.234C71.4703 61.9965 73.7202 60.6008 75.9536 61.1424C91.4617 64.8174 99.999 71.2172 99.999 79.1671C99.999 92.8418 74.8454 100 50 100C25.1589 100 0.000976562 92.8418 0.000976562 79.1671C0.000976562 71.2172 8.53831 64.8174 24.0421 61.1424C26.2755 60.6007 28.5254 61.9965 29.0545 64.234C29.5879 66.4714 28.2045 68.7173 25.963 69.2464C13.03 72.3172 8.33421 76.8587 8.33421 79.1671C8.33421 84.1461 24.9546 91.6668 50 91.6668C75.0495 91.6668 91.6658 84.1461 91.6658 79.1671C91.6658 76.8587 86.9741 72.3172 74.0327 69.2464C71.7953 68.7173 70.4078 66.4714 70.9412 64.234Z" fill="black"></path></svg>`);
      _push(ssrRenderComponent(_component_Dropdown, {
        list: regionList[data.value.region],
        placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u0439\u043E\u043D/\u0433\u043E\u0440\u043E\u0434",
        active: data.value.region !== "",
        onSelect: selectDistrict
      }, null, _parent));
      _push(`</div></label><label class="relative w-80"><span>\u041C\u0430\u0445\u0430\u043B\u043B\u044F</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M46.2731 81.0303L44.5772 77.6387C39.0857 66.6474 33.5692 55.9933 26.5026 46.4187C21.9736 40.2688 20.0611 32.673 21.1236 25.0232C22.9194 12.115 33.6274 1.67363 46.594 0.198662C54.8979 -0.776319 63.2269 1.87343 69.4183 7.40243C75.6141 12.9355 79.1681 20.8688 79.1681 29.1686C79.1681 34.681 77.6139 40.0518 74.6723 44.7017L72.2762 48.4724C67.0704 56.6537 61.6876 65.1132 57.3227 73.847L53.7311 81.0303C53.023 82.4428 51.5812 83.3343 50.0021 83.3343C48.423 83.3343 46.9815 82.4428 46.2731 81.0303ZM62.5019 29.1688C62.5019 22.2773 56.8936 16.669 50.0021 16.669C43.1107 16.669 37.5024 22.2773 37.5024 29.1688C37.5024 36.0603 43.1107 41.6686 50.0021 41.6686C56.8936 41.6686 62.5019 36.0603 62.5019 29.1688ZM70.9412 64.234C71.4703 61.9965 73.7202 60.6008 75.9536 61.1424C91.4617 64.8174 99.999 71.2172 99.999 79.1671C99.999 92.8418 74.8454 100 50 100C25.1589 100 0.000976562 92.8418 0.000976562 79.1671C0.000976562 71.2172 8.53831 64.8174 24.0421 61.1424C26.2755 60.6007 28.5254 61.9965 29.0545 64.234C29.5879 66.4714 28.2045 68.7173 25.963 69.2464C13.03 72.3172 8.33421 76.8587 8.33421 79.1671C8.33421 84.1461 24.9546 91.6668 50 91.6668C75.0495 91.6668 91.6658 84.1461 91.6658 79.1671C91.6658 76.8587 86.9741 72.3172 74.0327 69.2464C71.7953 68.7173 70.4078 66.4714 70.9412 64.234Z" fill="black"></path></svg><input${ssrRenderAttr("value", data.value.mahalla)} class="border px-2 w-full h-full rounded-r-md peer" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043C\u0430\u0445\u0430\u043B\u043B\u0438" maxlength="30" type="text"></div></label><label class="relative w-80"><span>\u0423\u043B\u0438\u0446\u0430</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M46.2731 81.0303L44.5772 77.6387C39.0857 66.6474 33.5692 55.9933 26.5026 46.4187C21.9736 40.2688 20.0611 32.673 21.1236 25.0232C22.9194 12.115 33.6274 1.67363 46.594 0.198662C54.8979 -0.776319 63.2269 1.87343 69.4183 7.40243C75.6141 12.9355 79.1681 20.8688 79.1681 29.1686C79.1681 34.681 77.6139 40.0518 74.6723 44.7017L72.2762 48.4724C67.0704 56.6537 61.6876 65.1132 57.3227 73.847L53.7311 81.0303C53.023 82.4428 51.5812 83.3343 50.0021 83.3343C48.423 83.3343 46.9815 82.4428 46.2731 81.0303ZM62.5019 29.1688C62.5019 22.2773 56.8936 16.669 50.0021 16.669C43.1107 16.669 37.5024 22.2773 37.5024 29.1688C37.5024 36.0603 43.1107 41.6686 50.0021 41.6686C56.8936 41.6686 62.5019 36.0603 62.5019 29.1688ZM70.9412 64.234C71.4703 61.9965 73.7202 60.6008 75.9536 61.1424C91.4617 64.8174 99.999 71.2172 99.999 79.1671C99.999 92.8418 74.8454 100 50 100C25.1589 100 0.000976562 92.8418 0.000976562 79.1671C0.000976562 71.2172 8.53831 64.8174 24.0421 61.1424C26.2755 60.6007 28.5254 61.9965 29.0545 64.234C29.5879 66.4714 28.2045 68.7173 25.963 69.2464C13.03 72.3172 8.33421 76.8587 8.33421 79.1671C8.33421 84.1461 24.9546 91.6668 50 91.6668C75.0495 91.6668 91.6658 84.1461 91.6658 79.1671C91.6658 76.8587 86.9741 72.3172 74.0327 69.2464C71.7953 68.7173 70.4078 66.4714 70.9412 64.234Z" fill="black"></path></svg><input${ssrRenderAttr("value", data.value.street)} class="border px-2 w-full h-full rounded-r-md peer" placeholder="\u0443\u043B. \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u043B\u0438\u0446\u044B" type="text"></div></label><label class="relative w-80"><span>\u041D\u043E\u043C\u0435\u0440 \u0437\u0434\u0430\u043D\u0438\u044F</span><div class="relative h-10 w-full flex items-center"><svg class="h-full py-2 px-3 rounded-l-md bg-gray-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M46.2731 81.0303L44.5772 77.6387C39.0857 66.6474 33.5692 55.9933 26.5026 46.4187C21.9736 40.2688 20.0611 32.673 21.1236 25.0232C22.9194 12.115 33.6274 1.67363 46.594 0.198662C54.8979 -0.776319 63.2269 1.87343 69.4183 7.40243C75.6141 12.9355 79.1681 20.8688 79.1681 29.1686C79.1681 34.681 77.6139 40.0518 74.6723 44.7017L72.2762 48.4724C67.0704 56.6537 61.6876 65.1132 57.3227 73.847L53.7311 81.0303C53.023 82.4428 51.5812 83.3343 50.0021 83.3343C48.423 83.3343 46.9815 82.4428 46.2731 81.0303ZM62.5019 29.1688C62.5019 22.2773 56.8936 16.669 50.0021 16.669C43.1107 16.669 37.5024 22.2773 37.5024 29.1688C37.5024 36.0603 43.1107 41.6686 50.0021 41.6686C56.8936 41.6686 62.5019 36.0603 62.5019 29.1688ZM70.9412 64.234C71.4703 61.9965 73.7202 60.6008 75.9536 61.1424C91.4617 64.8174 99.999 71.2172 99.999 79.1671C99.999 92.8418 74.8454 100 50 100C25.1589 100 0.000976562 92.8418 0.000976562 79.1671C0.000976562 71.2172 8.53831 64.8174 24.0421 61.1424C26.2755 60.6007 28.5254 61.9965 29.0545 64.234C29.5879 66.4714 28.2045 68.7173 25.963 69.2464C13.03 72.3172 8.33421 76.8587 8.33421 79.1671C8.33421 84.1461 24.9546 91.6668 50 91.6668C75.0495 91.6668 91.6658 84.1461 91.6658 79.1671C91.6658 76.8587 86.9741 72.3172 74.0327 69.2464C71.7953 68.7173 70.4078 66.4714 70.9412 64.234Z" fill="black"></path></svg><input${ssrRenderAttr("value", data.value.apartment)} class="border px-2 w-full h-full rounded-r-md peer" placeholder="\u043D\u043E\u043C\u0435\u0440 \u043A\u0432\u0430\u0440\u0442\u0438\u0440\u044B/\u0434\u043E\u043C\u0430 (*\u0431\u0443\u043A\u0432\u0443)" type="text"></div></label></div></div></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ContactDetails.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const config = useRuntimeConfig();
    const tabIndex = ref(0);
    const avatar = useAvatar();
    const passportDetails = ref({
      last_name: "",
      first_name: "",
      middle_name: "",
      birth_date: "",
      gender: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u043E\u043B",
      series_and_number: "",
      pinfl: ""
    });
    const contactDetails = ref({
      main_phone: "",
      additional_phone: "",
      email: "",
      latitude: 0,
      longitude: 0,
      region: "",
      district: "",
      mahalla: "",
      street: "",
      apartment: ""
    });
    const { status, execute, data } = useAsyncData(async () => await $fetch(config.public.apiBaseUrl + "/employee/", {
      method: "post",
      body: {
        // last_name: passportDetails.value.last_name,
        // first_name: passportDetails.value.first_name,
        // middle_name: passportDetails.value.middle_name,
        // birth_date: passportDetails.value.birth_date,
        // gender: passportDetails.value.gender,
        // series_and_number: passportDetails.value.series_and_number,
        // pinfl: passportDetails.value.pinfl,
        // main_phone: contactDetails.value.main_phone,
        // additional_phone: contactDetails.value.additional_phone,
        // email: contactDetails.value.email,
        // latitude: contactDetails.value.latitude,
        // longitude: contactDetails.value.longitude,
        // region: contactDetails.value.region,
        // district: contactDetails.value.district,
        // mahalla: contactDetails.value.mahalla,
        // street: contactDetails.value.street,
        // apartment: contactDetails.value.apartment,
        ...passportDetails.value,
        ...contactDetails.value
      }
    }), { immediate: false, server: false }, "$pqtWcjQkdb");
    const formData = new FormData();
    const { status: avatarStatus, execute: avatarRequest } = useAsyncData(async () => {
      var _a;
      return await $fetch(config.public.apiBaseUrl + `/employee/${(_a = data.value) == null ? void 0 : _a.id}/set-avatar/`, {
        method: "post",
        body: formData
      });
    }, { immediate: false, server: false }, "$cmRBlMwAGX");
    const handleReady = async () => {
      passportDetails.value.birth_date = passportDetails.value.birth_date.replaceAll(".", "-");
      passportDetails.value.series_and_number = passportDetails.value.series_and_number.replace(/\s/g, "").toString();
      await execute();
      if (status.value === "success") {
        formData.append("avatar", avatar.value);
        await avatarRequest();
      } else {
        alert("something is wrong");
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_StageTabs = _sfc_main$6;
      const _component_PassportDetails = _sfc_main$4;
      const _component_ContactDetails = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-screen h-screen font-montserrat fixed" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_StageTabs, {
        modelValue: unref(tabIndex),
        "onUpdate:modelValue": ($event) => isRef(tabIndex) ? tabIndex.value = $event : null,
        onClickReady: handleReady
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_PassportDetails, {
              modelValue: unref(passportDetails),
              "onUpdate:modelValue": ($event) => isRef(passportDetails) ? passportDetails.value = $event : null,
              style: unref(tabIndex) == 0 ? null : { display: "none" }
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_ContactDetails, {
              modelValue: unref(contactDetails),
              "onUpdate:modelValue": ($event) => isRef(contactDetails) ? contactDetails.value = $event : null,
              style: unref(tabIndex) == 1 ? null : { display: "none" }
            }, null, _parent2, _scopeId));
          } else {
            return [
              withDirectives(createVNode(_component_PassportDetails, {
                modelValue: unref(passportDetails),
                "onUpdate:modelValue": ($event) => isRef(passportDetails) ? passportDetails.value = $event : null
              }, null, 8, ["modelValue", "onUpdate:modelValue"]), [
                [vShow, unref(tabIndex) == 0]
              ]),
              withDirectives(createVNode(_component_ContactDetails, {
                modelValue: unref(contactDetails),
                "onUpdate:modelValue": ($event) => isRef(contactDetails) ? contactDetails.value = $event : null
              }, null, 8, ["modelValue", "onUpdate:modelValue"]), [
                [vShow, unref(tabIndex) == 1]
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BixESNJM.mjs.map
