import * as vueDefaultHandlers from "vue"
class TransformReactive {
  constructor() {
  }
}

let app, observable, proxyVm;

const __v_isRef = "__v_isRef"
const __v_isShallow = "__v_isShallow"
const __v_isReadonly = "__v_isReadonly"
const __v_isReactive = "__v_isReactive"
const __v_raw = "__v_raw"
const __v_skip = "__v_skip"
const __v_dep = "dep";
const __v_ob = "__ob__"
const ITERATE_KEY = Symbol("iterate");
const __v_proxyRef = "value"
const reactiveMps = new WeakMap()

TransformReactive.install = function (_app, _options = {}) {
  app = _app
  proxyVm = _options.proxyVm
  observable = _app.observable
}

const version = vueDefaultHandlers.version

let versionFlag = false

function validateVersion() {
  const symbolRef = "."
  return versionFlag = +version.slice(version.indexOf(symbolRef) + 1, version.indexOf(symbolRef, 2)) > 6
}

validateVersion()

function getVueDefaultHandler(key, customHandle) {
  if (key in vueDefaultHandlers) {
    return vueDefaultHandlers[key]
  }
  return customHandle
}

if (versionFlag) {
  const ref2 = getVueDefaultHandler("ref")
  const patchProxyKeys = ["value"]
  const patchProxyKey = (target, key) => {
    if (patchProxyKeys.indexOf(key) > -1) {
      return target[key]
    }
    return target
  }
  TransformReactive.install({
    observable: function (value) {
      return new Proxy(ref2(value), {
        get(target, key, receiver) {
          target = patchProxyKey(target, key)
          return Reflect.get(target, key, receiver)
        },
        set(target, key, value, receiver) {
          target = patchProxyKey(target, key)
          return Reflect.set(target, key, value, receiver)
        }
      })
    },
    delete: getVueDefaultHandler("del"),
    set: getVueDefaultHandler("set")
  }, {
    proxyVm: {
      $watch: getVueDefaultHandler("watch")
    }
  })
}

const watchEffect = getVueDefaultHandler("watchEffect", function (effect, options) {
  return createDoWatchEffect(effect, options)
})

const watchPostEffect = getVueDefaultHandler("watchPostEffect", function (effect, options) {
  return createDoWatchEffect(effect, options, "post")
})

const watchSyncEffect = getVueDefaultHandler("watchSyncEffect", function (effect, options) {
  return createDoWatchEffect(effect, options, "sync")
})

function createDoWatchEffect(effect, options, flush) {
  return watch(effect, {
    ...options,
    immediate: true,
    flush: flush || "pre"
  })
}

console.log(vueDefaultHandlers);

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
      this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
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

const effectScope = getVueDefaultHandler('effectScope2', function () {
  return new EffectScope(false)
})

function recordEffectScope(effect, scope = activeEffectScope) {
  if (scope && scope.active) {
    scope.effects.push(effect);
  }
}

const aaa = effectScope()

aaa.run(() => {
  watchSyncEffect(() => {
    return vueDefaultHandlers.ref(1).value
  })
})

console.log(aaa);

function validate() {
  if (!app && !observable) {
    console.warn("error")
    return false
  }
  return true
}

function createReactive(value) {
  return observable({ value: value })
}

function addReactive(target, value) {
  reactiveMps.set(target, {
    proxyTarget: createReactive(value)
  })
  return reactiveMps.get(target)
}

function getReactiveRaw(target) {
  return reactiveMps.get(target)
}

function createReactiveHandler(target) {
  const reactiveTarget = addReactive(target, {})

  return {
    useTrigger(value) {
      reactiveTarget.proxyTarget.value = arguments.length ? value : {}
    }, useTrack() {
      reactiveTarget.proxyTarget.value
    }
  }
}

class RefImplComment {
  constructor(shallow) {
    this[__v_isShallow] = !!shallow
    this[__v_isRef] = true
  }

}

class RefImpl extends RefImplComment {
  constructor(value, shallow) {
    super(shallow)
    this._rawValue = value
    this._value = value
    addReactive(this, 0)
  }

  get value() {
    const { proxyTarget } = getReactiveRaw(this)
    proxyTarget.value
    return this[__v_isShallow] ? toRaw(this._value) : toReactive(this._value)
  }

  set value(v) {
    if (!hasChanged(v, this._value)) {
      return false
    }
    this._value = v
    const { proxyTarget } = getReactiveRaw(this)
    proxyTarget.value++
    return v
  }

  get [__v_dep]() {
    const { proxyTarget } = getReactiveRaw(this)
    return getTargetObserverDep(proxyTarget)
  }
}

function getTargetObserverDep(target) {
  if (target[__v_isRef]) {
    return target[__v_dep]
  }
  return target[__v_ob] && target[__v_ob].dep
}

class ObjectRefImpl extends RefImplComment {
  constructor(object, key, defaultValue, shallow) {
    super(shallow)
    this._object = object
    this._key = key
    this._value = Reflect.get(object, key)
    this._defaultValue = defaultValue
  }

  get value() {
    const value = this._object[this._key]
    return value === void 0 ? this._defaultValue : value
  }

  set value(v) {
    this._object[this._key] = v
  }
}

class CustomRef extends RefImplComment {
  constructor(factory) {
    super(false);
    const hooks = createReactiveHandler(this)
    const result = factory(hooks.useTrack, hooks.useTrigger)
    const getter = result && result.get
    const setter = result && result.set
    if (!isFunction(getter) || !isFunction(setter)) {
      warn("CustomRef factory = {get:Function,set:Function}")
      return {}
    }
    this._getter = getter
    this._setter = setter
  }

  get value() {
    return this._getter()
  }

  set value(v) {
    this._setter(v)
  }
}

function warn(...args) {
  console.warn(`[Vue warn]:`, ...args);
}

function getProxyVmOptions(key) {
  if (!proxyVm) {
    warn("When installing plugins, it is necessary to configure proxyVm for proxy watcher Vue.use(TransformReactive, { proxyVm : VueComponent | VueApp })")
    return
  }
  return proxyVm[key]
}

function isFunction(target) {
  return typeof target === "function"
}

function isObject(target) {
  return typeof target === "object" && target
}

function toString(target) {
  return target.toString()
}

function isRef(target) {
  if (target) {
    try {
      return [__v_isRef] in target
    } catch {
    }
  }
  return false
}

function watch(fn, cb, options = {}) {
  const watchFn = getProxyVmOptions('$watch')
  if (watchFn) {
    const caches = [fn];
    const index = 1
    fn = isFunction(fn) ? fn : () => {
      const _target = caches[0]
      return (caches[index] === void 0 ? (caches[index] = isRef(_target)) : caches[index]) ? _target.value : _target
    }
    const _options = {
      ...options,
      flush: hasOwn(options, 'flush') ? options.flush : options.sync ? "sync" : options.post ? "post" : "pre"
    }
    const _r = watchFn.apply(proxyVm, [fn, cb, _options])
    recordEffectScope({
      stop: _r
    })
    return
  }
}

function createComputed2(getter, setter, options) {
  let _value = void 0
  const target = {
    get value() {
      const _target = getReactiveRaw(target)
      if (_target.watcher === null) {
        _target.watcher = watch(() => getter(), (v) => {
          _value = v
          _target.proxyTarget.value++
        }, {
          immediate: true,
          flush: "sync"
        })
        target.effect = _target.watcher
      }
      _target.proxyTarget.value;
      return _value
    },
    set value(v) {
      return setter(v)
    }
  }
  addReactive(target, 0)
  getReactiveRaw(target).watcher = null
  def(target, __v_isReadonly, !setter);
  def(target, __v_isRef, true);
  setter = setter || (() => warn('computed setter is not define'))
  return target
}


function computed(target, options) {
  if (validate()) {
    const done = isObject(target)
    const getter = done ? target.get : target
    const setter = done ? target.set : null
    return createComputed2(getter, setter, options)
  }
}

function ref(target) {
  if (validate()) {
    return new RefImpl(target)
  }
}

function toValue(target, ...args) {
  if (isFunction(target)) {
    if (toString(target).startsWith("class " + target.name) || /[A-Z]+/.test(target.name)) {
      return new target(...args)
    }
    return target()
  }
  if (isRef(target)) {
    return target.value
  }
  return target
}

function toRefs(target) {
  const object = []
  for (let k in target) {
    object[k] = new ObjectRefImpl(target, k, void 0, false)
  }
  return object
}

function toRef(target, key, defaultValue, shallow) {
  if (validate()) {
    return new ObjectRefImpl(target, key, defaultValue, !!shallow)
  }
}

function toRaw(observed) {
  if (isRef(observed)) {
    return toValue(observed)
  }
  const raw = observed && observed[__v_raw];
  return raw ? toRaw(raw) : observed;
}

function shallowRef(value) {
  if (validate()) {
    return new RefImpl(value, true)
  }
}

function customRef(factory) {
  if (validate()) {
    return new CustomRef(factory)
  }
}

function useReactiveHandle() {
  return createReactiveHandler()
}

const isArray = Array.isArray
const hasOwnProperty2 = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty2.call(val, key);
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const isMap = (val) => toString(val) === '[object Map]';
const isSet = (val) => toString(val) === '[object Set]';
const isDate = (val) => toString(val) === '[object Date]';
const def = (obj, key, value, writable = false) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable,
    value
  });
};

const reactiveProxyMap = new Map()

const reactiveProxyTargetMap = new Map()

const shallowReadonlyMap = new Map()

const shallowReactiveMap = new Map()

const readonlyMap = new Map()

function hasOwnProperty(key) {
  if (!isSymbol(key)) key = String(key);
  const obj = toRaw(this);
  track(obj, "has", key);
  return obj.hasOwnProperty(key);
}

function makeMap(str, expectsLowerCase) {
  const map = Object.create(null);
  const list = str.split(',');
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
}

const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);

const builtInSymbols = new Set(/* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol));

const isIntegerKey = (key) => isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key;

const arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
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
  return instrumentations;
}

function setVue2ObserverTargetReactive(vue2Observer, key) {
  if (!(key in vue2Observer)) {
    app.set(vue2Observer, key, 0)
    return false
  }
  return true
}

function setVue2ObserverTargetValue(vue2Observer, key) {
  if (setVue2ObserverTargetReactive(vue2Observer, key)) {
    vue2Observer[key]++
  }
}

function deleteVue2ObserverTargetValue(vue2Observer, key) {
  app.delete(vue2Observer, key)
}

function track(target, type, key) {
  if (reactiveProxyMap.has(target)) {
    let returnResult = null
    const ctx = reactiveProxyMap.get(target)
    const vue2Observer = ctx.proxyObs
    const proxyTarget = ctx.proxyTarget
    setVue2ObserverTargetReactive(vue2Observer, key)
    switch (type) {
      case "has":
        returnResult = (key in vue2Observer)
      case "get":
      case "iterate":
        returnResult = vue2Observer[key]
        break
    }
    return returnResult ? void 0 : void 0
  }
}

function trigger(target, type, key, newValue, oldValue) {
  if (reactiveProxyMap.has(target)) {
    const ctx = reactiveProxyMap.get(target)
    const vue2Observer = ctx.proxyObs
    const proxyTarget = ctx.proxyTarget
    const deps = [key]
    switch (type) {
      case "clear":
        deps.splice(0, 1, ITERATE_KEY)
        deps.splice("size")
        for (let w of oldValue) {
          deps.push(w[0])
        }
        oldValue.clear()
        break
      case "set":
        break;
      case "add":
        if (!isArray(target)) {
          if (isMap(target)) {
          } else {
          }
        } else if (isIntegerKey(key)) {
          deps.push("length")
        }
        if (ITERATE_KEY in vue2Observer) {
          deps.push(ITERATE_KEY)
        }
        break
      case "delete":
        break
    }
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        setVue2ObserverTargetValue(vue2Observer, deps[i])
      }
    }
  }
}

class BaseReactiveHandler {
  constructor(_isReadonly = false, _isShallow = false) {
    this[__v_isReadonly] = _isReadonly;
    this[__v_isShallow] = _isShallow;
  }

  get(target, key, receiver) {
    const isReadonly2 = this[__v_isReadonly], isShallow2 = this[__v_isShallow];
    if (key === __v_isReactive) {
      return !isReadonly2;
    } else if (key === __v_isReadonly) {
      return isReadonly2;
    } else if (key === __v_isShallow) {
      return isShallow2;
    } else if (key === __v_raw) {
      if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveProxyMap).get(target) || Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
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
    super(false, _isShallow)
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
    const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
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
    track(target, "iterate", ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
}

const toString2 = Object.prototype.toString

function toRawType(target) {
  return toString2.call(target).slice(8, -1)
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
  return value[__v_skip] || !Object.isExtensible(value) ? 0 /* INVALID */ : targetTypeMap(toRawType(value));
}

function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!validate()) {
    return target
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
  const proxyTarget = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers)
  proxyMap.set(target, {
    proxyTarget: proxyTarget, proxyObs: observable({})
  })
  return proxyTarget
}

const toReactive = (value) => isObject(value) ? reactive(value) : value;

const toReadonly = (value) => isObject(value) ? readonly(value) : value;

const toShallow = (value) => value;

const getProto = (v) => Reflect.getPrototypeOf(v);

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
  return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
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
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    !isReadonly && track(
      rawTarget,
      "iterate",
      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
    );
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next();
        return done ? { value, done } : {
          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
          done
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}

const cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
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
    forEach: createForEach(false, false)
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
    forEach: createForEach(false, true)
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
    forEach: createForEach(true, false)
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
    forEach: createForEach(true, true)
  };
  const iteratorMethods = [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations2[method] = createIterableMethod(method, false, false);
    readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
    shallowInstrumentations2[method] = createIterableMethod(method, false, true);
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
    shallowReadonlyInstrumentations2
  ];
}

const [
  mutableInstrumentations,
  readonlyInstrumentations,
  shallowInstrumentations,
  shallowReadonlyInstrumentations
] = createInstrumentations();

function createInstrumentationGetter(isReadonly, shallow) {
  const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
  return (target, key, receiver) => {
    if (key === __v_isReactive) {
      return !isReadonly;
    } else if (key === __v_isReadonly) {
      return isReadonly;
    } else if (key === __v_raw) {
      return target;
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target ? instrumentations : target,
      key,
      receiver
    );
  };
}

const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
const shallowCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, true)
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
const shallowReadonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, true)
};

function checkIdentityKeys(target, has2, key) {
  const rawKey = toRaw(key);
  if (rawKey !== key && has2.call(target, rawKey)) {
    const type = toRawType(target);
    warn(
      `Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
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
const shallowReadonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler(true);

const mutableReactiveHandler = /* @__PURE__ */ new MutableReactiveHandler()

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
    def(value, "__v_skip", true);
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
  )
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
  }
};

function proxyRefs(objectWithRefs) {
  return isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

function triggerRef(ref2) {

}

export {
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
  watchSyncEffect
}

export default TransformReactive