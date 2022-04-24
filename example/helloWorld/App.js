import {
  h,
  ref
} from "../../lib/mini-vue.esm.js";

const count = ref(0);

const HelloWorld = {
  name: "HelloWorld",
  setup() {},
  // TODO 第一个小目标
  // 可以在使用 template 只需要有一个插值表达式即
  // 可以解析 tag 标签
  // template: `
  //   <div>hi {{msg}}</div>
  //   需要编译成 render 函数
  // `,
  render() {
    return h(
      "div", {
        tId: "helloWorld"
      },
      [
        h('div', {}, `hello world: count: ${count.value}`),
        h('button', {
          onClick: function () {
            count.value++
          }
        }, '增加')
      ]
    );
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