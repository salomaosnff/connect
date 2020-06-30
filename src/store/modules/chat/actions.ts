import { Store, ActionTree } from "vuex";
import chatState from "./state";
import { IChatMessage } from "./types";

export default {
  addMessage(store: any, message: IChatMessage) {
    store.commit("SET_STATE", {
      messages: store.state.messages.concat(message),
    });
  },
};
