import { isRef } from '../reactivity/src'
import { ReactiveEffect } from '../reactivity/src/effect'
import { isReactive, isShallow } from '../reactivity/src/reactive'
import { hasChanged, isArray, isFunction, isMap, isObject, isPlainObject, isSet, NOOP, remove } from '../shared'
import {
    currentInstance,
} from './component'
import { queuePreFlushCb } from '../runtime-core/scheduler'

// initial value for watchers to trigger on undefined initial values
const INITIAL_WATCHER_VALUE = {}

export function watch<T = any, Immediate extends Readonly<boolean> = false>(
    source,
    cb: any,
    options?
) {
    return doWatch(source as any, cb, options)
}

function doWatch(
    source: any,
    cb: any,
    { immediate, deep, flush, onTrack, onTrigger }: any = {}
) {
    debugger
    const instance = currentInstance
    let getter: () => any
    let forceTrigger = false
    let isMultiSource = false

    if (isRef(source)) {
        getter = () => source.value
        forceTrigger = isShallow(source)
    } else if (isReactive(source)) {
        getter = () => source
        deep = true
    } else if (isArray(source)) {
        isMultiSource = true
        forceTrigger = source.some(isReactive)
        getter = () =>
            source.map(s => {
                if (isRef(s)) {
                    return s.value
                } else if (isReactive(s)) {
                    return traverse(s)
                } else if (isFunction(s)) {
                    debugger;
                    return s()
                    // return callWithErrorHandling(s, instance, ErrorCodes.WATCH_GETTER)
                } else {
                    debugger;
                    // __DEV__ && warnInvalidSource(s)
                }
            })
    } else if (isFunction(source)) {
        if (cb) {
            // getter with cb
            getter = () => source()
            // callWithErrorHandling(source, instance, ErrorCodes.WATCH_GETTER)
        } else {
            // no cb -> simple effect
            getter = () => {
                if (instance && instance.isUnmounted) {
                    return
                }
                if (cleanup) {
                    cleanup()
                }
                return source()
                // return callWithAsyncErrorHandling(
                //     source,
                //     instance,
                //     ErrorCodes.WATCH_CALLBACK,
                //     [onCleanup]
                // )
            }
        }
    } else {
        getter = NOOP
        // __DEV__ && warnInvalidSource(source)
    }



    if (cb && deep) {
        const baseGetter = getter
        getter = () => traverse(baseGetter())
    }


    let cleanup: () => void
    let onCleanup = (fn: () => void) => {
        cleanup = effect.onStop = () => {
            fn()
            // callWithErrorHandling(fn, instance, ErrorCodes.WATCH_CLEANUP)
        }
    }



    let oldValue = isMultiSource ? [] : INITIAL_WATCHER_VALUE
    const job = () => {
        if (!effect.active) {
            return
        }
        if (cb) {
            // watch(source, cb)
            const newValue = effect.run()
            if (
                deep ||
                forceTrigger ||
                (isMultiSource
                    ? (newValue as any[]).some((v, i) =>
                        hasChanged(v, (oldValue as any[])[i])
                    )
                    : hasChanged(newValue, oldValue))
                //  ||
                // (__COMPAT__ &&
                //     isArray(newValue) &&
                //     isCompatEnabled(DeprecationTypes.WATCH_ARRAY, instance))
            ) {
                // cleanup before running cb again
                if (cleanup) {
                    cleanup()
                }
                cb()
                // callWithAsyncErrorHandling(cb, instance, ErrorCodes.WATCH_CALLBACK, [
                //     newValue,
                //     // pass undefined as the old value when it's changed for the first time
                //     oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
                //     onCleanup
                // ])
                oldValue = newValue
            }
        } else {
            // watchEffect
            effect.run()
        }
    }


    // important: mark the job as a watcher callback so that scheduler knows
    // it is allowed to self-trigger (#1727)
    job.allowRecurse = !!cb

    let scheduler
    if (flush === 'sync') {
        scheduler = job as any // the scheduler function gets called directly
    } else if (flush === 'post') {
        debugger
        // scheduler = () => queuePostRenderEffect(job, instance && instance.suspense)
    } else {
        // default: 'pre'
        scheduler = () => queuePreFlushCb(job)
    }





    const effect = new ReactiveEffect(getter, scheduler)


    // initial run
    if (cb) {
        if (immediate) {
            job()
        } else {
            oldValue = effect.run()
        }
    } else if (flush === 'post') {
        debugger
        // queuePostRenderEffect(
        //     effect.run.bind(effect),
        //     instance && instance.suspense
        // )
    } else {
        effect.run()
    }

    return () => {
        effect.stop()
        if (instance && instance.scope) {
            remove(instance.scope.effects!, effect)
        }
    }

}

export function traverse(value: any, seen?: Set<unknown>) {
    if (!isObject(value) || (value as any)['__v_skip']) {
        return value
    }
    seen = seen || new Set()
    if (seen.has(value)) {
        return value
    }
    seen.add(value)
    if (isRef(value)) {
        traverse(value.value, seen)
    } else if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            traverse(value[i], seen)
        }
    } else if (isSet(value) || isMap(value)) {
        value.forEach((v: any) => {
            traverse(v, seen)
        })
    } else if (isPlainObject(value)) {
        for (const key in value) {
            traverse((value as any)[key], seen)
        }
    }
    return value
}