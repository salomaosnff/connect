import Vue from "vue";
import { ISignaling, SignalingEvent } from "./Signaling.interface";
import { EventEmitter } from "events";
import store from "../../store";

export class Peer extends EventEmitter {
  public rtc: RTCPeerConnection;
  public streams: Record<string, MediaStream> = {};
  public senders: RTCRtpSender[] = [];

  public readonly channels: Record<string, RTCDataChannel> = {};

  private socketListeners: Record<SignalingEvent, Function>;

  constructor(
    public readonly id: string,
    private readonly signaling: ISignaling,
    public info: Record<string, any> = {},
    private canOffer = true
  ) {
    super();

    /**
     * Peer Connection Instance
     */
    this.rtc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        {
          urls: "turn:numb.viagenie.ca",
          credential: "muazkh",
          username: "webrtc@live.com",
        },
        {
          urls: "turn:192.158.29.39:3478?transport=udp",
          credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          username: "28224511:1379330808",
        },
        {
          urls: "turn:192.158.29.39:3478?transport=tcp",
          credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          username: "28224511:1379330808",
        },
      ],
    });

    this.registerListeners();
    this.createDataChannels();

    this.socketListeners = {
      candidate: signaling.on(
        "candidate",
        this,
        (candidate: RTCIceCandidate) =>
          candidate && this.rtc.addIceCandidate(candidate)
      ),
      offer: signaling.on("offer", this, (offer: RTCSessionDescription) => {
        this.log("Received offer");
        this.createAnswer(offer);
      }),
      answer: signaling.on(
        "answer",
        this,
        (answer: RTCSessionDescriptionInit) => {
          this.log("Received answer", answer);
          this.rtc.setRemoteDescription(answer);
        }
      ),
    };
  }

  private registerListeners() {
    this.rtc.addEventListener("icecandidate", (e) => {
      if (e.candidate) {
        this.signaling.candidate(e.candidate, this);
      }
    });

    this.rtc.addEventListener("negotiationneeded", () => {
      console.log("Negotiation needed", `Can offer: ${this.canOffer}`);
      if (this.canOffer) this.createOffer();
    });

    this.rtc.addEventListener("connectionstatechange", () => {
      const { connectionState } = this.rtc;

      if (new Set(["closed", "disconnected", "failed"]).has(connectionState)) {
        this.emit("disconnected");
      }

      if (connectionState === "connected") {
        this.canOffer = true;
      }

      this.log(`Connection State Changed => ${connectionState}`);

      // Verifica se o status atual não for conectado ou conectado e remove
      // os listeners
      if (!new Set(["connected", "connecting"]).has(connectionState)) {
        this.dispose();
      }
    });

    this.rtc.addEventListener("track", (e) => {
      console.log("Track event. Streams: ", e.streams);

      e.streams.forEach((stream) => {
        if (!this.streams[stream.id]) {
          stream.addEventListener("removetrack", (e) => {
            if (stream.getTracks().length === 0) {
              Vue.delete(this.streams, stream.id);
            }
          });
        }

        this.streams = {
          ...this.streams,
          [stream.id]: stream,
        };
      });
    });
  }

  private createDataChannels() {
    const chatListener = (e: MessageEvent) => {
      const message = JSON.parse(e.data);
      store.dispatch("addMessage", message);
    };

    if (this.canOffer) {
      this.channels["chat"] = this.rtc.createDataChannel("chat");
      this.channels.chat?.addEventListener("message", chatListener);
    }

    this.rtc.addEventListener("datachannel", (e) => {
      this.channels[e.channel.label] = e.channel;
      e.channel.addEventListener("message", chatListener);
    });
  }

  addStream(stream: MediaStream): Peer {
    console.log(`addStream(${stream.getTracks()[0]?.kind}): Peer(${this.id})`);
    stream
      .getTracks()
      .forEach((track) => this.senders.push(this.rtc.addTrack(track, stream)));
    return this;
  }

  removeStream(stream: MediaStream): Peer {
    stream.getTracks().forEach((track) => {
      this.senders.forEach((sender, senderIdx) => {
        if (sender.track?.id === track.id) {
          this.rtc.removeTrack(sender);
          this.senders.splice(senderIdx, 1);
        }
      });
    });

    Vue.delete(this.streams, stream.id);
    console.log("DELETE: ", stream.id);
    return this;
  }

  private createOffer() {
    this.log("Creating offer");
    return this.rtc
      .createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        voiceActivityDetection: true,
      })
      .then((offer) => this.rtc.setLocalDescription(offer))
      .then(() =>
        this.signaling.offer(
          this.rtc.localDescription as RTCSessionDescription,
          this
        )
      );
  }

  public createAnswer(offer: RTCSessionDescription) {
    this.log("Creating answer");
    return this.rtc
      .setRemoteDescription(offer)
      .then(() => this.rtc.createAnswer())
      .then((answer) => this.rtc.setLocalDescription(answer))
      .then(() =>
        this.signaling.answer(
          this.rtc.localDescription as RTCSessionDescription,
          this
        )
      );
  }

  dispose() {
    this.socketListeners.candidate();
    this.socketListeners.offer();
    this.socketListeners.answer();

    delete this.streams;
    delete this.socketListeners;

    try {
      this.rtc.close();
    } catch (e) {}
  }

  log(...args: any[]) {
    console.log(`Peer(${this.id})`, ...args);
  }
}
