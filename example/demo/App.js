import {
  computed,
  h,
  ref,
  watch
} from "../../lib/mini-vue.esm.js";

const log = ref([])
const count = ref(0);


const HelloWorld = {
  name: "HelloWorld",
  setup() {

    const plusOne = computed(() => {
      debugger
      console.log(Object.assign({}, count))
      console.log("computed", new Date().valueOf())
      return count.value + 1
    })

    watch(count, (newVal, oldVal) => {
      debugger
      console.log(newVal, oldVal)
      log.value.push(`watch count: ${count.value}`)
      // Here `computed` is not get the lastest value
      log.value.push(`watch plusOne: ${plusOne.value}`)
      console.log("watch", new Date().valueOf())
    })

    // Here `computed` is get the lastest value
    log.value.push(`before inc plusOne: ${plusOne.value}`)
    count.value++
    // Here `computed` is get the lastest value
    log.value.push(`after inc plusOne: ${plusOne.value}`)
    // return {
    //   log,
    //   count,
    //   plusOne
    // }
  },
  // TODO 第一个小目标
  // 可以在使用 template 只需要有一个插值表达式即
  // 可以解析 tag 标签
  // template: `
  //   <div>hi {{msg}}</div>
  //   需要编译成 render 函数
  // `,
  render() {
    // return h(
    //   "div", {
    //     tId: "helloWorld"
    //   },
    //   `hello world: count: ${count.value}`
    // );
    return h("div", null, log.value.map(item =>
      h("div", null, item)
    ))
  },
};

export default {
  name: "App",
  setup() {},

  render() {
    return h("div", {
      tId: 1
    }, [h("p", {}, "主页"), h(HelloWorld)]);
  },
};