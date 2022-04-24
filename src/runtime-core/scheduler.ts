import { isArray } from "../shared";

const queue: any[] = [];

const p = Promise.resolve();
let isFlushPending = false;

export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
    // 执行所有的 job
    queueFlush();
  }
}

function queueFlush() {
  // 如果同时触发了两个组件的更新的话
  // 这里就会触发两次 then （微任务逻辑）
  // 但是着是没有必要的
  // 我们只需要触发一次即可处理完所有的 job 调用
  // 所以需要判断一下 如果已经触发过 nextTick 了
  // 那么后面就不需要再次触发一次 nextTick 逻辑了
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
}

function flushJobs(pendingQueue) {
  isFlushPending = false;
  let job;
  if (pendingQueue) {
    while ((job = pendingQueue.shift())) {
      if (job) {
        job();
      }
    }
  }
  while ((job = queue.shift())) {
    if (job) {
      job();
    }
  }
}

let activePreFlushCbs = null
const pendingPreFlushCbs = []
let preFlushIndex = 0

export function queuePreFlushCb(cb) {
  queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex)
}

function queueCb(
  cb,
  activeQueue,
  pendingQueue,
  index: number
) {
  if (!isArray(cb)) {
    if (
      !activeQueue ||
      !activeQueue.includes(cb, cb.allowRecurse ? index + 1 : index)
    ) {
      pendingQueue.push(cb)
    }
  } else {
    // if cb is an array, it is a component lifecycle hook which can only be
    // triggered by a job, which is already deduped in the main queue, so
    // we can skip duplicate check here to improve perf
    pendingQueue.push(...cb)
  }
  flushJobs(pendingQueue)
}

// function flushPreJobs(pendingQueue) {
//   // isFlushPending = false;
//   let job;
//   while ((job = pendingQueue.shift())) {
//     if (job) {
//       job();
//     }
//   }
// }