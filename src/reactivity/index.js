import Vue, * as vueDefaultHandlers from "vue";
import {
  __v_isSpecial,
  __v_isRef,
  __v_isShallow,
  __v_isReadonly,
  __v_raw,
  __v_isReactive,
  __v_skip,
  __v_dep,
  __v_ob,
  __v_cut_skip,
  ITERATE_KEY,
  promiseThen,
  isArray,
  MAP_KEY_ITERATE_KEY,
  hasOwn,
  isString,
  isSymbol,
  hasChanged,
  isMap,
  isObject2,
  def,
  getProto,
  toRawType,
  isFunction,
  isObject,
  toString,
  extend,
  isPromise,
  NOOP,
} from "./shared";

let app,
  observable = Vue.observable,
  proxyVm,
  versionFlag = false;

class TransformReactive {
  constructor() { }
}

const version =
  vueDefaultHandlers.version ||
  (vueDefaultHandlers.default && vueDefaultHandlers.default.version);

function validateVersion() {
  const symbolRef = ".";
  if (!version) return;
  return (versionFlag =
    +version.slice(
      version.indexOf(symbolRef) + 1,
      version.indexOf(symbolRef, 2)
    ) > 6);
}

validateVersion();

function getVueDefaultHandler(key, customHandle) {
  if (key in vueDefaultHandlers) {
    return vueDefaultHandlers[key];
  }
  return customHandle;
}

const nextTick = getVueDefaultHandler("nextTick", function () {
  if (proxyVm.$nextTick) {
    return proxyVm.$nextTick.apply(proxyVm, arguments);
  }
  return promiseThen.then(arguments[0]);
});

const watchEffect = function (effectFn, options) {
  return createDoWatchEffect(effectFn, options);
};

const watchPostEffect = function (effectFn, options) {
  return createDoWatchEffect(effectFn, options, "post");
};

const watchSyncEffect = function (effectFn, options) {
  return createDoWatchEffect(effectFn, options, "sync");
};

function createDoWatchEffect(effectFn, options, flush) {
  return watch(effectFn, () => 1, {
    immediate: true,
    flush: flush || "pre",
    onTrigger: options && options.onTrigger,
    onTrack: options && options.onTrack,
  });
}

let activeEffectScope;
class EffectScope {
  constructor(detached = false) {
    this.detached = detached;
    /**
     * @internal
     */
    this._active = true;
    /**
     * @internal
     */
    this.effects = [];
    /**
     * @internal
     */
    this.cleanups = [];
    this.parent = activeEffectScope;
    if (!detached && activeEffectScope) {
      this.index =
        (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
          this
        ) - 1;
    }
  }

  get active() {
    return this._active;
  }

  run(fn) {
    if (this._active) {
      const currentEffectScope = activeEffectScope;
      try {
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = currentEffectScope;
      }
    } else if (process.env.NODE_ENV !== "production") {
      warn(`cannot run an inactive effect scope.`);
    }
  }

  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    activeEffectScope = this;
  }

  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    activeEffectScope = this.parent;
  }

  stop(fromParent) {
    if (this._active) {
      let i, l;
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop();
      }
      for (i = 0, l = this.cleanups.length; i < l; i++) {
        this.cleanups[i]();
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].stop(true);
        }
      }
      if (!this.detached && this.parent && !fromParent) {
        const last = this.parent.scopes.pop();
        if (last && last !== this) {
          this.parent.scopes[this.index] = last;
          last.index = this.index;
        }
      }
      this.parent = void 0;
      this._active = false;
    }
  }
}

const effectScope = getVueDefaultHandler("effectScope", function () {
  return new EffectScope(false);
});

function recordEffectScope(effect, scope = activeEffectScope) {
  if (scope && scope.active) {
    scope.effects.push(effect);
  }
}

function validate() {
  if (!app && !observable) {
    warn("Have you registered(TransformReactive) the plugin");
    return false;
  }
  return true;
}

function createReactiveHandler(target) {
  if (!isObject(target)) {
    target = {};
  }
  setReactiveProxyMap(target);
  let oldValue;
  let trackFlag = true;
  return {
    useTrigger(value) {
      const newValue = arguments.length ? value : target.value;
      triggerRefValue(target, newValue, oldValue);
      oldValue = newValue;
    },
    useTrack() {
      trackRefValue(target);
      if (oldValue === void 0 && trackFlag) {
        trackFlag = false;
        oldValue = target.value;
        trackFlag = true;
      }
    },
  };
}

class RefImplComment {
  constructor(shallow) {
    this[__v_isShallow] = !!shallow;
    this[__v_isRef] = true;
  }
}

function trackRefValue(target) {
  track(target, "get", "value");
}

function triggerRefValue(target, newValue, oldValue) {
  trigger(target, "set", "value", newValue, oldValue);
}

function getReactiveProxyMap(target) {
  return reactiveProxyMap.get(target);
}

function setReactiveProxyMap(target, proxyTarget = target) {
  reactiveProxyMap.set(target, {
    proxyTarget: proxyTarget,
    proxyObserver: {},
  });
  return reactiveProxyMap.get(target);
}

class RefImpl extends RefImplComment {
  constructor(value, shallow) {
    super(shallow);
    this._rawValue = value;
    this._value = value;
    setReactiveProxyMap(this);
  }

  get value() {
    trackRefValue(this);
    return this[__v_isShallow] ? toRaw(this._value) : toReactive(this._value);
  }

  set value(v) {
    if (!hasChanged(v, this._value)) {
      return false;
    }
    const oldValue = this._value;
    this._value = v;
    triggerRefValue(this, v, oldValue);
    return v;
  }

  get [__v_dep]() {
    const value = getReactiveProxyMap(this).proxyObserver;
    const observer = value.value && value.value[__v_ob];
    return observer && observer[__v_dep];
  }
}

class ObjectRefImpl extends RefImplComment {
  constructor(object, key, defaultValue, shallow) {
    super(shallow);
    this._object = object;
    this._key = key;
    this._value = Reflect.get(object, key);
    this._defaultValue = defaultValue;
  }

  get value() {
    const value = this._object[this._key];
    const returnValue = value === void 0 ? this._defaultValue : value;
    return this[__v_isShallow] ? toRaw(returnValue) : toReactive(returnValue);
  }

  set value(v) {
    this._object[this._key] = v;
  }
}

class CustomRef extends RefImplComment {
  constructor(factory) {
    super(false);
    const hooks = createReactiveHandler(this);
    const result = factory(hooks.useTrack, hooks.useTrigger);
    const getter = result && result.get;
    const setter = result && result.set;
    if (!isFunction(getter) || !isFunction(setter)) {
      warn("CustomRef return = { get : Function , set : Function }");
      return {};
    }
    this._getter = getter;
    this._setter = setter;
  }

  get value() {
    return this._getter();
  }

  set value(v) {
    this._setter(v);
  }
}

function warn(...args) {
  console.warn(`[Vue warn]:`, ...args);
}

function getProxyVmOptions(key) {
  if (!proxyVm) {
    return;
  }
  return proxyVm[key];
}

function isCutSkip(target) {
  return !!target && target[__v_cut_skip];
}

function isRef(target) {
  if (target) {
    try {
      return [__v_isRef] in target;
    } catch { }
  }
  return false;
}

function patchWatchOptions(options, key) {
  if (hasOwn(options, key)) {
    options[options[key]] = true;
  }
}

function createDep(target) {
  target.deps = new Map();
  return target.deps;
}

function setReactiveObserverDeps(targetEffect, reactiveProxyMap, key) {
  const observerProxy = reactiveProxyMap.proxyObserver;
  if (!targetEffect) return;
  if (!targetEffect.deps) {
    createDep(targetEffect);
  }
  const value = observerProxy[key];
  if (!hasOwn(value, "deps")) {
    createDep(value);
    if (isSpecialRef(reactiveProxyMap)) {
      value.deps.computed = reactiveProxyMap.proxyTarget
    }
  }
  value.deps.set(targetEffect, reactiveEffectId);
  targetEffect.deps.set(value, {
    key: key,
    get [__v_dep]() {
      return value[__v_ob][__v_dep];
    },
  });
}

function trackEffect(dep, debuOptions) {
  if (activeEffect) {
    const deps = dep.deps;
    if (deps && deps.has(activeEffect)) {
      activeEffect.onTrack &&
        activeEffect.onTrack(
          extend(
            {
              watcher: activeEffect.effect,
              effect: activeEffect,
            },
            debuOptions
          )
        );
    }
  }
}

function triggerEffect2(dep, debuOptions) {
  const deps = dep.deps;
  let _shouldSchedule = !deps;
  if (deps) {
    for (let effect of deps.keys()) {
      _shouldSchedule = _shouldSchedule || effect._shouldSchedule;
      effect._shouldSchedule = false;
      if (effect.onTrigger && !deps.computed) {
        effect.onTrigger(
          extend(
            {
              watcher: effect.effect,
              effect: effect,
            },
            debuOptions
          )
        );
      }
    }
  }
  return _shouldSchedule;
}

function triggerEffect(reactiveProxyMap, key, debuOptions) {
  setVue2ObserverTargetReactive(reactiveProxyMap, key);
  const proxyObserver = reactiveProxyMap.proxyObserver;
  if (triggerEffect2(proxyObserver[key], debuOptions)) {
    queueEffectSchedulers.push(() => {
      proxyObserver[key]._notice();
    });
  }
}

function track(target, type, key) {
  if (reactiveProxyMap.has(target)) {
    const ctx = reactiveProxyMap.get(target);
    const proxyObserver = ctx.proxyObserver;
    setVue2ObserverTargetReactive(ctx, key);
    switch (type) {
      case "has":
      case "get":
      case "iterate":
        proxyObserver[key].value;
        break;
    }
    setReactiveObserverDeps(activeEffect, ctx, key);
    trackEffect(proxyObserver[key], {
      target: target,
      type: type,
      key: key,
    });
  }
}

function trigger(target, type, key, newValue, oldValue) {
  if (reactiveProxyMap.has(target)) {
    const ctx = reactiveProxyMap.get(target);
    const proxyObserver = ctx.proxyObserver;
    const deps = [key];
    if (type === "clear") {
      deps.splice(0, 1, ITERATE_KEY);
      deps.push("size");
      for (let [key2] of oldValue) {
        deps.push(key2);
      }
      oldValue.clear();
    } else if (key === "length" && isArray(target)) {
      deps.length = 0;
      const newLength = Number(newValue);
      for (var key2 in proxyObserver) {
        if (!isSymbol(key2) && key2 >= newLength) {
          deps.push(key2);
        }
      }
    } else {
      switch (type) {
        case "set":
          if (isMap(target)) {
            if (ITERATE_KEY in proxyObserver) {
              deps.push(ITERATE_KEY);
            }
          }
          break;
        case "add":
          if (!isArray(target)) {
            deps.push(ITERATE_KEY);
            if (isMap(target)) {
              deps.push(MAP_KEY_ITERATE_KEY);
            }
          } else {
            if (isIntegerKey(key)) {
              deps.push("length");
            } else {
              warn(`${key} is not a valid array key.`);
            }
          }
          break;
        case "delete":
          if (!isArray(target)) {
            deps.push(ITERATE_KEY);
            if (isMap(target)) {
              deps.push(MAP_KEY_ITERATE_KEY);
            }
          }
          break;
      }
    }

    if (deps.length) {
      pauseScheduling();
      for (let dep of deps) {
        triggerEffect(ctx, dep, {
          type,
          key,
          newValue,
          oldValue,
          target: ctx.proxyTarget,
        });
      }
      resetScheduling();
    }
  }
}

function stopReactiveEffect(target) {
  if (target && target.deps) {
    for (let val of target.deps.keys()) {
      val.deps.delete(target);
    }
    target.deps.clear();
  }
}

var seenObjects = new Set();

function traverse(val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
  return val;
}

function _traverse(val, seen) {
  var i, keys;
  var isA = isArray(val);
  if (
    (!isA && !isObject(val)) ||
    toRaw(val)[__v_skip] ||
    Object.isFrozen(val) ||
    (val.constructor.name === "VNode" && val.__isVue && val.context)
  ) {
    return;
  }
  if (seen.has(val)) {
    return;
  }
  seen.add(val);
  if (isA) {
    i = val.length;
    while (i--) _traverse(val[i], seen);
  } else if (isRef(val)) {
    _traverse(val.value, seen);
  } else if (isObject2(val)) {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) _traverse(val[keys[i]], seen);
  } else {
    try {
      keys = val.keys();
      var cv;
      while ((cv = keys.next()) && cv && !cv.done) {
        _traverse(val.get(cv.value), seen);
      }
    } catch { }
  }
}

let activeEffect,
  reactiveEffectId = 0;

class ReactiveEffect {
  constructor(fn, scheduler, options = {}) {
    this.fn = fn;
    this.active = true;
    this.onTrack = options.onTrack;
    this.onTrigger = options.onTrigger;
    this.scheduler = scheduler;
    this.onStop = options.onStop;
    this._shouldSchedule = true;
    this.effect = options.effect || null;
    recordEffectScope(this);
    reactiveEffectId++;
  }
  run() {
    if (!this.active) return;
    stopReactiveEffect(this);
    this.parent = activeEffect;
    activeEffect = this;
    try {
      return this.fn();
    } finally {
      this._shouldSchedule = true;
      activeEffect = this.parent;
      this.parent = null;
    }
  }
  stop() {
    this.active = false;
    stopReactiveEffect(this);
    if (this.teardownInstance) {
      this.teardownInstance.stop();
      if (this.instanceEffects) {
        nextTick(() => {
          const index = this.instanceEffects.findIndex((i) => i === this)
          if (index > -1) {
            this.instanceEffects.splice(index, 1);
          }
        })
      }
    }
  }
  teardown() {
    this.stop();
  }
}

function createReactiveEffect(fn, cb, options = {}) {
  const watchFn =
    getProxyVmOptions("$watch") ||
    vueDefaultHandlers.watch ||
    Vue.prototype.$watch;
  if (watchFn) {
    const caches = [fn],
      index = 1,
      deepFlag = !!options.deep;
    fn = isFunction(fn)
      ? fn
      : () => {
        const _target = caches[0];
        return (
          caches[index] === void 0
            ? (caches[index] = isRef(_target))
            : caches[index]
        )
          ? _target.value
          : _target;
      };

    let reactiveEffect = new ReactiveEffect(
      deepFlag ? () => traverse(fn()) : () => fn(),
      () => void 0,
      options
    );

    const _options = {
      ...options,
      flush: hasOwn(options, "flush")
        ? options.flush
        : options.sync
          ? "sync"
          : options.post
            ? "post"
            : "pre",
    };
    if (deepFlag) {
      delete _options.deep;
    }
    if (versionFlag) {
      _options.onTrigger = _options.onTrack = function ({ effect }) {
        reactiveEffect.effect = effect;
      };
    }
    patchWatchOptions(_options, "flush");
    const args = [reactiveEffect.run.bind(reactiveEffect), cb, _options];
    let stopReactiveEffect = { stop: watchFn.apply(proxyVm, args) };
    reactiveEffect.teardownInstance = stopReactiveEffect;
    if (this && this instanceof vueDefaultHandlers.default) {
      reactiveEffect.instanceEffects = setInstanceEffects(this, reactiveEffect);
    }
    return reactiveEffect;
  }
}

function watch(fn, cb, options) {
  return createReactiveEffect.apply(this, arguments).stop;
}

function setInstanceEffects(instance, effect) {
  if (instance._scope && !instance._watchers) {
    if (instance._scope.effects) {
      instance._scope.effects.push(effect);
      return instance._scope.effects
    }
  } else if (instance._watchers) {
    instance._watchers.push(effect);
    return instance._watchers;
  }
}

function triggerComputedRef(target, newValue, oldValue) {
  if (hasChanged(newValue, oldValue)) {
    triggerRefValue(target, newValue, oldValue);
  }
  return newValue;
}

function validateObserverDep(target) {
  if (!isObject(target)) return false;
  if (hasOwn(target, "deps") && target.deps.size) {
    return true;
  }
  if (hasOwn(target, __v_ob) && target[__v_ob].dep.subs.length) {
    return true;
  }
  return validateObserverDep(target._value);
}

function triggerComputedEffectTrigger(cref, newValue, oldValue) {
  const cv = reactiveProxyMap.get(cref).proxyObserver;
  if (cv.value && cv.value.deps) {
    for (let dep of cv.value.deps.keys()) {
      if (dep.onTrigger) {
        dep.onTrigger({
          type: "set",
          key: "value",
          newValue,
          oldValue,
          target: cref,
          effect: dep.effect || dep
        })
      }
    }
  }
}

function createComputed2(getter, setter, { onTrack, onTrigger }) {
  let _value, _oldValue, prevEffect;
  const vm = this;
  const proxyComputed = {
    get deps() {
      return (
        proxyCtx &&
        proxyCtx.proxyObserver.value &&
        proxyCtx.proxyObserver.value.deps
      );
    },
    get effect() {
      return proxyCtx.effect;
    },
    get value() {
      trackRefValue(proxyComputed);
      if (!proxyCtx.effect) {
        proxyCtx.effect = createReactiveEffect.apply(vm, [
          () => {
            if (proxyCtx.effect) {
              prevEffect = proxyCtx.effect
              proxyCtx.effect.stop();
              proxyCtx.effect = null;
              triggerComputedRef(this, _value, _oldValue);
              return;
            }
            _oldValue = _value;
            return (_value = getter());
          },
          () => void 0,
          {
            onTrigger: onTrigger,
            onTrack: onTrack,
            sync: true,
          },
        ]);
        if (prevEffect) {
          triggerComputedEffectTrigger(this, _value, _oldValue)
        }
      }
      return _value;
    },
    set value(v) {
      return setter(v);
    },
  };
  const proxyCtx = setReactiveProxyMap(proxyComputed);
  def(proxyComputed, __v_isReadonly, !setter);
  def(proxyComputed, __v_isRef, true);
  def(proxyCtx, __v_isSpecial, true);
  setter = setter || (() => warn("computed setter is not define"));
  return proxyComputed;
}

/* squalor */
function computed(target, options = {}) {
  if (validate()) {
    const done = isObject(target);
    const getter = done ? target.get : target;
    const setter = done ? target.set : null;
    return createComputed2.apply(this, [getter, setter, options]);
  }
}

function ref(target) {
  if (validate()) {
    return new RefImpl(target);
  }
}

function toValue(target, ...args) {
  if (isFunction(target)) {
    if (
      toString(target).startsWith("class " + target.name) ||
      /[A-Z]+/.test(target.name)
    ) {
      return new target(...args);
    }
    return target();
  }
  if (isRef(target)) {
    return target.value;
  }
  return target;
}

function toRefs(target) {
  const object = {};
  if (isRef(target)) {
    target = toValue(target);
  }
  if (isObject(target)) {
    for (let k in target) {
      object[k] = new ObjectRefImpl(target, k, void 0, false);
    }
  } else {
    warn("toRefs argument( target ->", target, " ) for an object");
  }
  return object;
}

function toRef(target, key, defaultValue, shallow) {
  if (validate()) {
    return new ObjectRefImpl(target, key, defaultValue, !!shallow);
  }
}

function toRaw(observed) {
  const raw = observed && observed[__v_raw];
  return raw ? toRaw(raw) : observed;
}

function shallowRef(value) {
  if (validate()) {
    return new RefImpl(value, true);
  }
}

function customRef(factory) {
  if (validate()) {
    return new CustomRef(factory);
  }
}

function useObserverHandle() {
  const handlers = createReactiveHandler();
  return [handlers.useTrack, handlers.useTrigger];
}

const reactiveProxyMap = new WeakMap();

const shallowReadonlyMap = new WeakMap();

const shallowReactiveMap = new WeakMap();

const readonlyMap = new WeakMap();

function hasOwnProperty(key) {
  if (!isSymbol(key)) key = String(key);
  const obj = toRaw(this);
  track(obj, "has", key);
  return obj.hasOwnProperty(key);
}

function makeMap(str, expectsLowerCase) {
  const map = Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? (val) => !!map[val.toLowerCase()]
    : (val) => !!map[val];
}

const isNonTrackableKeys = /* @__PURE__ */ makeMap(
  `__proto__,__v_isRef,__isVue`
);

const builtInSymbols = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol)
    .filter((key) => key !== "arguments" && key !== "caller")
    .map((key) => Symbol[key])
    .filter(isSymbol)
);

const isIntegerKey = (key) =>
  isString(key) &&
  key !== "NaN" &&
  key[0] !== "-" &&
  "" + parseInt(key, 10) === key;

const arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();

let shouldTrack = true;
let pauseScheduleStack = 0;
let trackStack = [];
let queueEffectSchedulers = [];

function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function pauseScheduling() {
  pauseScheduleStack++;
}
function resetScheduling() {
  pauseScheduleStack--;
  while (!pauseScheduleStack && queueEffectSchedulers.length) {
    queueEffectSchedulers.shift()();
  }
}

function createArrayInstrumentations() {
  const instrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    instrumentations[key] = function (...args) {
      const arr = toRaw(this);
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, "get", i + "");
      }
      const res = arr[key](...args);
      if (res === -1 || res === false) {
        return arr[key](...args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
    instrumentations[key] = function (...args) {
      pauseTracking();
      pauseScheduling();
      const res = toRaw(this)[key].apply(this, args);
      resetScheduling();
      resetTracking();
      return res;
    };
  });
  return instrumentations;
}

const observableValue = [{}, {}].map(Object.freeze);

function isSpecialRef(target) {
  if (target) {
    return hasOwn(target, __v_isSpecial);
  }
  return !!target;
}

function setVue2ObserverTargetReactive(reactiveProxyMap, key) {
  const proxyObserver = reactiveProxyMap.proxyObserver;
  let observableValue2 = observableValue;
  let flag = false
  if ((flag = isSpecialRef(reactiveProxyMap))) {
    observableValue2 = [{}, {}];
  }
  if (!hasOwn(proxyObserver, key)) {
    const row = (proxyObserver[key] = observable({
      value: observableValue2[0],
    }));
    row._value = observableValue2[0];
    row._index = 0;
    row._notice = () => {
      row._value = row.value = observableValue2[(row._index = +!row._index)];
    };
    return false;
  }
  return true;
}

class BaseReactiveHandler {
  constructor(_isReadonly = false, _isShallow = false) {
    this[__v_isReadonly] = _isReadonly;
    this[__v_isShallow] = _isShallow;
  }

  get(target, key, receiver) {
    const isReadonly2 = this[__v_isReadonly],
      isShallow2 = this[__v_isShallow];
    if (key === __v_isReactive) {
      return !isReadonly2;
    } else if (key === __v_isReadonly) {
      return isReadonly2;
    } else if (key === __v_isShallow) {
      return isShallow2;
    } else if (key === __v_raw) {
      if (
        receiver ===
        (isReadonly2
          ? isShallow2
            ? shallowReadonlyMap
            : readonlyMap
          : isShallow2
            ? shallowReactiveMap
            : reactiveProxyMap
        ).get(target) ||
        Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)
      ) {
        return target;
      }
      return;
    }
    const targetIsArray = isArray(target);
    if (!isReadonly2) {
      if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      if (key === "hasOwnProperty") {
        return hasOwnProperty;
      }
    }
    const res = Reflect.get(target, key, receiver);
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get", key);
    }
    if (isShallow2) {
      return res;
    }
    if (isRef(res)) {
      return targetIsArray && isIntegerKey(key) ? res : res.value;
    }
    if (isObject(res)) {
      return isReadonly2 ? readonly(res) : reactive(res);
    }
    return res;
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(_isShallow) {
    super(false, _isShallow);
  }

  set(target, key, value, receiver) {
    let oldValue = target[key];
    if (!this[__v_isShallow]) {
      const isOldValueReadonly = isReadonly(oldValue);
      if (!isShallow(value) && !isReadonly(value)) {
        oldValue = toRaw(oldValue);
        value = toRaw(value);
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        if (isOldValueReadonly) {
          return false;
        } else {
          oldValue.value = value;
          return true;
        }
      }
    }
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key, value, oldValue);
      }
    }
    return result;
  }

  deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0, oldValue);
    }
    return result;
  }

  has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }

  ownKeys(target) {
    track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
}

function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}

function getTargetType(value) {
  return value[__v_skip] || !Object.isExtensible(value)
    ? 0
    : targetTypeMap(toRawType(value));
}

function createReactiveObject(
  target,
  isReadonly2,
  baseHandlers,
  collectionHandlers,
  proxyMap
) {
  if (!validate()) {
    return target;
  }
  if (!isObject(target)) {
    warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }
  if (target[__v_raw] && !(isReadonly2 && target[__v_isReactive])) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy.proxyTarget;
  }
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const proxyTarget = new Proxy(
    target,
    targetType === 2 ? collectionHandlers : baseHandlers
  );
  setReactiveProxyMap(target, proxyTarget);
  return proxyTarget;
}

const toReactive = (value) => (isObject(value) ? reactive(value) : value);

const toReadonly = (value) => (isObject(value) ? readonly(value) : value);

const toShallow = (value) => value;

function get(target, key, isReadonly = false, isShallow = false) {
  target = target[__v_raw];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key);
  if (!isReadonly) {
    if (hasChanged(key, rawKey)) {
      track(rawTarget, "get", key);
    }
    track(rawTarget, "get", rawKey);
  }
  const { has: has2 } = getProto(rawTarget);
  const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
  if (has2.call(rawTarget, key)) {
    return wrap(target.get(key));
  } else if (has2.call(rawTarget, rawKey)) {
    return wrap(target.get(rawKey));
  } else if (target !== rawTarget) {
    target.get(key);
  }
}

function has(key, isReadonly = false) {
  const target = this[__v_raw];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key);
  if (!isReadonly) {
    if (hasChanged(key, rawKey)) {
      track(rawTarget, "has", key);
    }
    track(rawTarget, "has", rawKey);
  }
  return key === rawKey
    ? target.has(key)
    : target.has(key) || target.has(rawKey);
}

function size(target, isReadonly = false) {
  target = target[__v_raw];
  !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
  return Reflect.get(target, "size", target);
}

function add(value) {
  value = toRaw(value);
  const target = toRaw(this);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, value);
  if (!hadKey) {
    target.add(value);
    trigger(target, "add", value, value);
  }
  return this;
}

function set(key, value) {
  value = toRaw(value);
  const target = toRaw(this);
  const { has: has2, get: get2 } = getProto(target);
  let hadKey = has2.call(target, key);
  if (!hadKey) {
    key = toRaw(key);
    hadKey = has2.call(target, key);
  } else {
    checkIdentityKeys(target, has2, key);
  }
  const oldValue = get2.call(target, key);
  target.set(key, value);
  if (!hadKey) {
    trigger(target, "add", key, value);
  } else if (hasChanged(value, oldValue)) {
    trigger(target, "set", key, value, oldValue);
  }
  return this;
}

function deleteEntry(key) {
  const target = toRaw(this);
  const { has: has2, get: get2 } = getProto(target);
  let hadKey = has2.call(target, key);
  if (!hadKey) {
    key = toRaw(key);
    hadKey = has2.call(target, key);
  } else {
    checkIdentityKeys(target, has2, key);
  }
  const oldValue = get2 ? get2.call(target, key) : void 0;
  const result = target.delete(key);
  if (hadKey) {
    trigger(target, "delete", key, void 0, oldValue);
  }
  return result;
}

function clear() {
  const target = toRaw(this);
  const hadItems = target.size !== 0;
  const oldTarget = isMap(target) ? new Map(target) : new Set(target);
  const result = target.clear();
  if (hadItems) {
    trigger(target, "clear", void 0, void 0, oldTarget);
  }
  return result;
}

function createForEach(isReadonly, isShallow) {
  return function forEach(callback, thisArg) {
    const observed = this;
    const target = observed[__v_raw];
    const rawTarget = toRaw(target);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
    return target.forEach((value, key) => {
      return callback.call(thisArg, wrap(value), wrap(key), observed);
    });
  };
}

function createIterableMethod(method, isReadonly, isShallow) {
  return function (...args) {
    const target = this[__v_raw];
    const rawTarget = toRaw(target);
    const targetIsMap = isMap(rawTarget);
    const isPair =
      method === "entries" || (method === Symbol.iterator && targetIsMap);
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    !isReadonly &&
      track(
        rawTarget,
        "iterate",
        isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
      );
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next();
        return done
          ? { value, done }
          : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done,
          };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      },
    };
  };
}

const cacheStringFunction = (fn) => {
  const cache = Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};

const capitalize = cacheStringFunction((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

function createReadonlyMethod(type) {
  return function (...args) {
    {
      const key = args[0] ? `on key "${args[0]}" ` : ``;
      warn(
        `${capitalize(type)} operation ${key}failed: target is readonly.`,
        toRaw(this)
      );
    }
    return type === "delete" ? false : type === "clear" ? void 0 : this;
  };
}

function createInstrumentations() {
  const mutableInstrumentations2 = {
    get(key) {
      return get(this, key);
    },
    get size() {
      return size(this);
    },
    has,
    add,
    set,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false),
  };
  const shallowInstrumentations2 = {
    get(key) {
      return get(this, key, false, true);
    },
    get size() {
      return size(this);
    },
    has,
    add,
    set,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true),
  };
  const readonlyInstrumentations2 = {
    get(key) {
      return get(this, key, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, false),
  };
  const shallowReadonlyInstrumentations2 = {
    get(key) {
      return get(this, key, true, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, true),
  };
  const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations2[method] = createIterableMethod(
      method,
      false,
      false
    );
    readonlyInstrumentations2[method] = createIterableMethod(
      method,
      true,
      false
    );
    shallowInstrumentations2[method] = createIterableMethod(
      method,
      false,
      true
    );
    shallowReadonlyInstrumentations2[method] = createIterableMethod(
      method,
      true,
      true
    );
  });
  return [
    mutableInstrumentations2,
    readonlyInstrumentations2,
    shallowInstrumentations2,
    shallowReadonlyInstrumentations2,
  ];
}

const [
  mutableInstrumentations,
  readonlyInstrumentations,
  shallowInstrumentations,
  shallowReadonlyInstrumentations,
] = createInstrumentations();

function createInstrumentationGetter(isReadonly, shallow) {
  const instrumentations = shallow
    ? isReadonly
      ? shallowReadonlyInstrumentations
      : shallowInstrumentations
    : isReadonly
      ? readonlyInstrumentations
      : mutableInstrumentations;
  return (target, key, receiver) => {
    if (key === __v_isReactive) {
      return !isReadonly;
    } else if (key === __v_isReadonly) {
      return isReadonly;
    } else if (key === __v_raw) {
      return target;
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target
        ? instrumentations
        : target,
      key,
      receiver
    );
  };
}

const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false),
};
const shallowCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, true),
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false),
};
const shallowReadonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, true),
};

function checkIdentityKeys(target, has2, key) {
  const rawKey = toRaw(key);
  if (rawKey !== key && has2.call(target, rawKey)) {
    const type = toRawType(target);
    warn(
      `Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``
      }, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
    );
  }
}

class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow2 = false) {
    super(true, isShallow2);
  }

  set(target, key) {
    if (process.env.NODE_ENV !== "production") {
      warn(
        `Set operation on key "${String(key)}" failed: target is readonly.`,
        target
      );
    }
    return true;
  }

  deleteProperty(target, key) {
    if (process.env.NODE_ENV !== "production") {
      warn(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target
      );
    }
    return true;
  }
}

const readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();

const shallowReactiveHandlers = /* @__PURE__ */ new MutableReactiveHandler(
  true
);
const shallowReadonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler(
  true
);

const mutableReactiveHandler = /* @__PURE__ */ new MutableReactiveHandler();

function isReactive(value) {
  if (isReadonly(value)) {
    return isReactive(value[__v_raw]);
  }
  return !!(value && value[__v_isReactive]);
}

function isReadonly(value) {
  return !!(value && value[__v_isReadonly]);
}

function isShallow(value) {
  return !!(value && value[__v_isShallow]);
}

function isProxy(value) {
  return value ? !!value[__v_raw] : false;
}

function markRaw(value) {
  if (Object.isExtensible(value)) {
    def(value, __v_skip, true);
    def(value, __v_skip, true);
  }
  return value;
}

function reactive(target) {
  return createReactiveObject(
    target,
    false,
    mutableReactiveHandler,
    mutableCollectionHandlers,
    reactiveProxyMap
  );
}

function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowCollectionHandlers,
    shallowReactiveMap
  );
}

function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyCollectionHandlers,
    readonlyMap
  );
}

function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    shallowReadonlyCollectionHandlers,
    shallowReadonlyMap
  );
}

function unref(ref2) {
  return isRef(ref2) ? ref2.value : ref2;
}

const shallowUnwrapHandlers = {
  get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  },
};

function proxyRefs(objectWithRefs) {
  return isReactive(objectWithRefs)
    ? objectWithRefs
    : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

let currentTriggerRefFlag = false;

function triggerRef(ref2) {
  currentTriggerRefFlag = false;
  if (isRef(ref2)) {
    currentTriggerRefFlag = true;
    triggerRefValue(ref2, ref2.value, ref2.value);
  }
}

function triggerReactive(ref2) {
  triggerRef(ref2);
  if (currentTriggerRefFlag) {
    currentTriggerRefFlag = false;
    return;
  }
  if (isProxy(ref2)) {
    const raw = toRaw(ref2);
    if (isObject2(raw) || isArray(raw)) {
      for (let k in raw) {
        trigger(raw, "set", k, raw[k], raw[k]);
      }
      if (isArray(raw)) {
        trigger(raw, "set", "length", void 0, raw.length);
      }
    } else {
      for (let [w, v] of raw) {
        trigger(raw, "set", w, v, v);
      }
      trigger(raw, "set", MAP_KEY_ITERATE_KEY, void 0, true);
    }
    trigger(raw, "set", ITERATE_KEY, void 0, true);
  }
}

function toVRef(target) {
  if (!isObject(target)) {
    warn(`toVRef(target) can only be used on objects.`);
    return target;
  }
  return extend(target, {
    [__v_isRef]: true,
  });
}

function defineReactive(proxyTarget, target, key) {
  if (!hasOwn(proxyTarget, key)) {
    proxyTarget[key] = void 0;
  }
  Object.defineProperty(proxyTarget, key, {
    get: function reactiveGetter() {
      const value = target[key];
      return toReactive(isRef(value) ? toValue(value) : value);
    },
    set: function reactiveSetter(newValue) {
      const value = target[key];
      if (isRef(value)) {
        value.value = newValue;
      } else {
        target[key] = newValue;
      }
    },
  });
}

function useState(target, vm) {
  if (!isObject(vm) && !this) {
    warn(
      "useState(",
      target,
      ", vm?:object ) (vm || this) is can only be used on objects"
    );
    return;
  }
  if (!isObject2(target)) {
    warn("useState(target->", target, ") can only be used on objects");
    return;
  }
  target = toReactive(target);
  const _vm = vm || this;
  for (let k in target) {
    defineReactive(_vm, target, k);
  }

  function set(newTarget, callback) {
    Object.assign(target, newTarget);
    for (let key in target) {
      if (!hasOwn(_vm, key)) {
        defineReactive(_vm, target, key);
      }
    }
    callback();
  }

  return [
    target,
    function (newTarget, callback) {
      callback = callback || (() => void 0);
      if (isFunction(newTarget)) {
        set(newTarget(), callback);
      } else if (isPromise(newTarget)) {
        newTarget.then((res) => {
          set(res, callback);
        });
      } else if (isObject(newTarget)) {
        set(newTarget, callback);
      }
    },
  ];
}

const expose = {
  ref,
  customRef,
  toRefs,
  toRef,
  watch,
  reactive,
  shallowReactive,
  shallowReadonly,
  readonly,
  computed,
  markRaw,
  shallowRef,
  useState,
  nextTick,
};

const VuePrototype = vueDefaultHandlers.default.prototype;
let installInit = false,
  vueUtil = null;

TransformReactive.install = function (_app, _options = {}) {
  app = _app;
  proxyVm = _options.proxyVm;
  observable = _app.observable;
  vueUtil = _app.util;
  if (!installInit) {
    const oldProto = Reflect.getPrototypeOf(VuePrototype);
    Reflect.setPrototypeOf(VuePrototype, expose);
    Reflect.setPrototypeOf(expose, oldProto);
    installInit = true;
  }
};

if (versionFlag) {
  const ref2 = getVueDefaultHandler("ref");
  TransformReactive.install(
    {
      observable: function (value) {
        return ref2(value).value;
      },
      delete: getVueDefaultHandler("del"),
      set: getVueDefaultHandler("set"),
      util: vueDefaultHandlers.default.util,
    },
    {
      proxyVm: {
        $watch: getVueDefaultHandler("watch"),
        [__v_cut_skip]: true,
        [__v_skip]: true,
      },
    }
  );
}

export {
  EffectScope,
  toRaw,
  ref,
  toRefs,
  toRef,
  watch,
  reactive,
  shallowReactive,
  shallowReadonly,
  readonly,
  isProxy,
  isReactive,
  isRef,
  toValue,
  isReadonly,
  computed,
  isShallow,
  markRaw,
  proxyRefs,
  shallowRef,
  customRef,
  unref,
  track,
  trigger,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  effectScope,
  triggerRef,
  nextTick,
  triggerReactive,
  useObserverHandle,
  toVRef,
  useState,
};

export default TransformReactive;
