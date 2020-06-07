import io from "socket.io-client";
import { Peer } from "./Peer";
import { MemorySignaling } from "./in-memory-signaling";
import { SignallingClient } from "./SignallingClient";

export class PeerManager {
  constructor() {
    /** @type {Record<string,Peer>} */
    this.peers = {};

    /** @type {SignallingClient} */
    this.signaling = new MemorySignaling();

    this.signaling.on("offer", (data, id) => {
      const peer = this.peers[id] || new Peer(id);

      peer
        .createAnswer(offer)
        .then((answer) => this.signaling.emit("answer", answer, peer.id));
      
        this.peers[id] = peer;
    });
  }

  /**
   * Adiciona um par no manager
   * @param {Peer} peer
   */
  async add(peer) {
    this.peers[peer.id] = peer;

    const offer = await peer.createOffer();

    this.signaling
      .emit("offer", offer, peer.id)
      .on("answer", (data, from) => peer.setAnswer(data), peer.id)
      .on("icecandidate", (candidate) => peer.rtc.addIceCandidate(candidate));
  }
}

const p = new PeerManager();
