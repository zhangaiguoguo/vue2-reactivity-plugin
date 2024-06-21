const __v_isRef = "__v_isRef"
const __v_isSpecial = "__v_isSpecial"
const __v_isShallow = "__v_isShallow"
const __v_isReadonly = "__v_isReadonly"
const __v_raw = "__v_raw"
const __v_isReactive = "__v_isReactive"
const __v_skip = "__v_skip"
const __v_dep = "dep";
const __v_ob = "__ob__"
const __v_cut_skip = "__v_cut_skip"
const ITERATE_KEY = Symbol("iterate");
const MAP_KEY_ITERATE_KEY = Symbol("Map key iterate");
const promiseThen = Promise.resolve()

const NOOP = () => { }
const isArray = Array.isArray
const hasOwnProperty2 = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty2.call(val, key);
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const isMap = (val) => toRawType(val) === 'Map';
const isSet = (val) => toRawType(val) === 'Set';
const isObject2 = (val) => toRawType(val) === 'Object';
const isDate = (val) => toRawType(val) === 'Date';
const extend = Object.assign;
const def = (obj, key, value, writable = false) => {
    Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: false,
        writable,
        value
    });
};
const getProto = (v) => Reflect.getPrototypeOf(v);

const toString2 = Object.prototype.toString

function toRawType(target) {
    return toString2.call(target).slice(8, -1)
}

function isFunction(target) {
    return typeof target === "function"
}

export function isPromise(target) {
    return 'then' in target && isFunction(target.then);
}

function isObject(target) {
    return typeof target === "object" && target !== null
}

function toString(target) {
    return target.toString()
}

export {
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
    hasOwnProperty2,
    hasOwn,
    isString,
    isSymbol,
    hasChanged,
    isMap,
    isSet,
    isObject2,
    isDate,
    def, getProto, toRawType, isFunction, isObject, toString, extend, MAP_KEY_ITERATE_KEY, NOOP, __v_isSpecial
}