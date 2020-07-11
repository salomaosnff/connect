import Vue from "vue";
import { ISignaling } from "../p2p/Signaling.interface";
import { PeerInfo, Peer } from "../p2p/Peer";
import { EventEmitter } from "events";
import { SocketIOSignaling } from "./SocketIOSignaling";
import { Chat } from "./Chat";

export type RoomClient = {
  id: string;
  info: PeerInfo;
};

export class Room extends EventEmitter {
  public signaling!: SocketIOSignaling;
  public connections = {} as Record<string, Peer>;
  public streams = {} as Record<string, MediaStream>;

  private channels = new Set() as Set<string>;

  public client?: RoomClient;

  public chat = {} as Chat;

  constructor(public readonly id: string, url: string) {
    super();
    this.signaling = new SocketIOSignaling(url);

    this.chat = new Chat(this);
  }

  async join(info: PeerInfo): Promise<Room> {
    // Check if signaling server is set
    if (!this.signaling) {
      throw new Error("Signaling server must be set");
    }

    // Try to connect to the signaling server if disconnected
    if (!this.signaling.io.connected) {
      await this.signaling.connect();
    }

    // Set current client
    this.client = {
      id: this.signaling.io.id,
      info,
    };

    // Create connections for current connected clients
    this.connections = {};
    (await this.signaling.join(this.id, this.client.info)).forEach((c) => {
      this.addClient(c.id, c.info);
    });

    // When someone join
    this.signaling.io.on("joined", (client: RoomClient) => {
      this.addClient(client.id, client.info, false);
      this.emit("client:connected");
    });

    // When someone hangup
    this.signaling.io.on("hangup", (id: string) => {
      this.removeClient(id);
    });

    return this;
  }

  async hangup(): Promise<Room> {
    this.signaling.hangup();
    this.signaling.dispose();
    Object.values(this.connections).forEach((peer) => peer.dispose());
    this.connections = {};
    return this;
  }

  private addClient(id: string, info: Record<string, any> = {}, offer = true) {
    const peer = new Peer(id, this.signaling, info, offer);

    // Add local room streams to each peer
    Object.values(this.streams).forEach((stream) => {
      if (stream) peer.addStream(stream);
    });

    // Create channels
    this.channels.forEach((label) => peer.createChannel(label));

    peer.on("disconnected", () => {
      this.emit("client:disconnected", id);
      peer.dispose();
      Vue.delete(this.connections, id);
    });

    peer.on("channel", (label: string, event: MessageEvent) => {
      const { data } = event;
      const name = `channel:${label}`;

      if (typeof data === "string") {
        this.emit(name + ".text", data, event);
      } else if (data instanceof ArrayBuffer) {
        this.emit(name + ".buffer", data, event);
      }

      this.emit(`channel:${label}`, event);
    });

    Vue.set(this.connections, id, Vue.observable(peer));
    return peer;
  }

  private removeClient(id: string): Room {
    if (this.connections[id]) {
      this.connections[id].dispose();
      Vue.delete(this.connections, id);
    }

    return this;
  }

  send(label: string, data: any): Room {
    Object.values(this.connections).forEach((peer) => {
      if (peer.channels[label]) {
        const channel = peer.channels[label];

        // Check if channel is open before send data
        if (channel.readyState === "open") {
          channel.send(data);
        }
      }
    });

    return this;
  }

  addStream(stream: MediaStream): Room {
    const { id } = stream;

    if (this.streams[id]) {
      stream.getTracks().forEach((track) => {
        // this.streams[id].removeTrack(track);
        this.streams[id].addTrack(track);
      });
    } else {
      this.streams[id] = stream;
    }

    Object.values(this.connections).forEach((peer) => {
      peer.addStream(stream);
    });

    return this;
  }

  removeStream(stream: MediaStream): Room {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {}
    });

    Object.values(this.connections).forEach((peer) => {
      peer.removeStream(stream);
    });

    if (this.streams[stream.id]) {
      Vue.delete(this.streams, stream.id);
    }

    return this;
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream): Room {
    Object.values(this.connections).forEach((peer) => {
      peer.addTrack(track, stream);
    });

    if (!this.streams[stream.id]) {
      this.addStream(stream);
    } else {
      this.streams[stream.id].addTrack(track);
    }

    return this;
  }

  removeTrack(track: MediaStreamTrack): Room {
    try {
      track.stop();
    } catch (e) {}

    Object.values(this.connections).forEach((peer) => {
      peer.removeTrack(track);
    });

    Object.entries(this.streams).forEach(([name, stream]) => {
      stream.removeTrack(track);

      if (!stream.getTracks().length) Vue.delete(this.streams, name);
    });

    return this;
  }

  createChannel(label: string): Room {
    this.channels.add(label);

    // Create channel to connected peers
    Object.values(this.connections).forEach((peer) => {
      peer.createChannel(label);
    });

    return this;
  }

  removeChannel(label: string): Room {
    this.channels.delete(label);

    Object.values(this.connections).forEach((peer) => {
      peer.removeChannel(label);
    });

    return this;
  }

  dispose() {
    try {
      this.hangup();
    } catch (e) {}

    Object.values(this.connections).forEach((peer) => {
      peer.dispose();
    });

    Object.values(this.streams).forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    this.streams = {};

    this.client = undefined;
  }
}
