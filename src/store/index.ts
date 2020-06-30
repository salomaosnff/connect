import Vue from "vue";
import Vuex, { Store } from "vuex";
import chat from "./modules/chat";

import chatActions from "./modules/chat/actions";

Vue.use(Vuex);

export default new Store({
  modules: {
    chat,
  },
});
