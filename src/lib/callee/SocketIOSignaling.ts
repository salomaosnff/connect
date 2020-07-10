import {
  ISignaling,
  SignalingSDPListener,
  SignalingCandidateListener,
  SignalingEvent,
} from "../p2p/Signaling.interface";
import SocketIO from "socket.io-client";
import { Peer } from "../p2p/Peer";

export class SocketIOSignaling implements ISignaling {
  public readonly io: SocketIOClient.Socket;

  constructor(url: string, options?: SocketIOClient.ConnectOpts) {
    this.io = SocketIO(url, options);
    this.io
      .on("connect", () => console.log("Socket.io connected: ", this.io.id))
      .on("error", console.error);
  }

  offer(offer: RTCSessionDescription, peer: Peer): void {
    this.io.emit("offer", offer, peer.id);
  }

  answer(answer: RTCSessionDescription, peer: Peer): void {
    this.io.emit("answer", answer, peer.id);
  }

  candidate(candidate: RTCIceCandidate, peer: Peer): void {
    this.io.emit("candidate", candidate, peer.id);
  }

  join(
    roomId: string,
    info: Record<string, any>
  ): Promise<{ id: string; info: Record<string, any> }[]> {
    return new Promise((resolve) =>
      this.io.emit("join", roomId, info, resolve)
    );
  }

  hangup() {
    this.io.emit("hangup");
  }

  connect() {
    return new Promise((resolve) => {
      resolve();
      this.io.connect().on("connect", resolve);
    });
  }

  disconnect(): SocketIOClient.Socket {
    return this.io.disconnect();
  }

  on(
    event: SignalingEvent,
    to: Peer,
    listener: SignalingSDPListener | SignalingCandidateListener
  ): Function {
    const middleware = (data: any, peerId: string) => {
      if (peerId === to.id) listener(data);
    };
    this.io.on(event, middleware);
    return () => this.io.off(event, middleware);
  }

  off(
    event: SignalingEvent,
    listener: SignalingSDPListener | SignalingCandidateListener
  ) {
    this.io.off(event, listener);
  }

  dispose() {
    try {
      this.io.close();
      this.io.removeAllListeners();
    } catch (e) {}
  }
}
