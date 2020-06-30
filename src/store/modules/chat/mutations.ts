import chatState from "./state";

export default {
  SET_STATE(state: typeof chatState, payload: Partial<typeof chatState>) {
    Object.assign(state, payload);
  },
};
