import Vue from "vue";
import io from "socket.io-client";
import { Peer } from "./Peer";

export const Room = Vue.extend({
  props: {
    roomId: {
      type: String,
      required: true
    },
    signalingUrl: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      io: io(this.signalingUrl, { autoConnect: false }),
      connected: false,
      peers: {}
    };
  },
  created() {
    this.io.on("connect", () => {
      this.connected = true;
    });
    this.io.on("disconnect", () => {
      this.connected = false;
    });
    this.io.on("offer", ({ from, data }) => this.acceptOffer(from, data));
    this.io.on("answer", ({ from, data }) => this.receiveAnswer(from, data));
    this.io.on("icecandidates", ({ from, data }) =>
      this.setCandidates(from, data)
    );
  },
  methods: {
    async connect() {
      return new Promise(resolve => {
        this.io.once("connect", async () => {
          this.io.emit(
            "join",
            { room: this.roomId, name: this.username },
            ({ users = [] }) => {
              users.forEach(p => this.createPeer(p));
              resolve();
            }
          );
        });

        this.io.connect();
      });
    },
    getPeer(id, name) {
      let peer = this.peers[id];

      if (!peer) {
        peer = new Peer({ id, name }, this);
        this.$set(this.peers, id, peer);
      }

      return peer;
    },
    removePeer(id) {
      if (this.peers[id]) {
        this.peers[id].disconnect();
        this.$delete(this.peers, id);
      }
    },
    async acceptOffer(from, offer) {
      const peer = this.getPeer(from.id, from.name);
      if (!peer.connection) peer.initConnection();
      return peer
        .createAnswer(offer)
        .then(answer => this.sendUserSignal(from.id, "answer", answer));
    },
    async receiveAnswer(from, answer) {
      console.log("ANSWER RECEIVED", from, answer);

      const peer = this.getPeer(from.id, from.name);

      return peer.setAnswer(answer);
    },
    sendRoomSignal(event, data) {
      this.io.emit("signal", { event, data });
    },
    sendUserSignal(userId, event, data) {
      this.io.emit("user-signal", { userId, event, data });
    },
    async getUserMedia(constraints) {
      const stream = navigator.mediaDevices.getUserMedia(constraints);
      this.peers[this.io.id] = (this.peers[this.io.id] || []).filter(
        s => s.enabled
      );
      this.peers[this.io.id].push(stream);
      return stream;
    },
    async getDisplayMedia() {
      const stream = navigator.mediaDevices.getDisplayMedia();
      this.peers[this.io.id] = (this.peers[this.io.id] || []).filter(
        s => s.enabled
      );
      this.peers[this.io.id].push(stream);
      return stream;
    },
    async createPeer({ id, name }) {
      console.log("CREATE PEER", id);
      const peer = this.getPeer(id, name);
      peer.initConnection(...(this.streams[this.io.id] || []));
    }
  },
  computed: {
    streams() {
      return Object.entries(this.peers).reduce(
        (obj, [k, p]) => ({
          ...obj,
          [k]: p.streams
        }),
        {}
      );
    }
  },
  render(h) {
    return this.$scopedSlots.default(this);
  }
});
