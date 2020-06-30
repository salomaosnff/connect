import Vue from "vue";
import Router from "vue-router";
import VueRouter from "vue-router";
import CallScreen from "./views/Call.vue";

Vue.use(VueRouter);

function encode(num: number, target: string[]): string {
  const base = target.length;
  let encoded = "";

  while (num !== 0) {
    encoded = target[num % base] + encoded;
    num = Math.floor(num / base);
  }
  return encoded;
}

const targetBase = ([] as string[]).concat(
  new Array(10)
    .fill(null)
    .map((_: any, i: number) => String.fromCharCode(48 + i)),
  new Array(26)
    .fill(null)
    .map((_: any, i: number) => String.fromCharCode(65 + i)),
  new Array(26)
    .fill(null)
    .map((_: any, i: number) => String.fromCharCode(97 + i))
);

function genUID(): string {
  return (
    encode(Date.now(), targetBase) +
    encode(Math.floor(Math.random() * 1000), targetBase)
  );
}

export const router = new Router({
  routes: [
    {
      name: "index",
      path: "/",
      redirect: `/${genUID()}`,
    },
    {
      name: "call",
      path: "/:id",
      component: () => import("./views/Call.vue"),
    },
  ],
});
