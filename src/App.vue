<template>
  <router-view />
</template>

<script>
import { Peer, PeerManager } from "./lib/p2p";

export default {
  async created() {
    window.addEventListener("click", () => this.connect());
  },
  methods: {
    async connect() {
      const userA = new PeerManager()
      const userB = new PeerManager()

      userB.signaling = userA.signaling
      
      const p1 = new Peer('p1')

      await p1.offerMedia({ audio: true, video: true })

      userA.add(p1)
      debugger
    }
  }
};
</script>
<style lang="stylus">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  position: relative;
  font-family: 'Noto Sans', sans-serif;
}
</style>