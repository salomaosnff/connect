import Vue from "vue";
import { ISignaling, SignalingEvent } from "./Signaling.interface";
import { EventEmitter } from "events";
import store from "../../store";

export type PeerInfo = Record<string, any>;

export class Peer extends EventEmitter {
  public rtc: RTCPeerConnection;
  public streams: Record<string, MediaStream> = {};

  public readonly channels: Record<string, RTCDataChannel> = {};

  private senders: RTCRtpSender[] = [];
  private socketListeners: Record<SignalingEvent, Function>;

  constructor(
    public readonly id: string,
    private readonly signaling: ISignaling,
    public info: PeerInfo = {},
    private offer = true
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

    /**
     * Event listeners
     */
    this.rtc.addEventListener("negotiationneeded", () => {
      this.log("Negotiation needed", `Offer: ${this.offer}`);
      if (this.offer || this.isConnected()) this.createOffer();
    });

    // Data channel received event
    this.rtc.addEventListener("datachannel", (e) => {
      const { label } = e.channel;
      e.channel.addEventListener("message", (e) => {
        this.emit(`channel`, label, e);
      });
      this.channels[label] = e.channel;
    });

    // Ice candidate event
    this.rtc.addEventListener("icecandidate", (e) => {
      if (e.candidate) {
        this.signaling.candidate(e.candidate, this);
      }
    });

    // Connection state change event
    this.rtc.addEventListener("connectionstatechange", () => {
      const { connectionState } = this.rtc;

      if (new Set(["closed", "disconnected", "failed"]).has(connectionState)) {
        this.emit("disconnected");
      }

      if (connectionState === "connected") {
        this.offer = true;
      }

      if (!new Set(["connected", "connecting"]).has(connectionState)) {
        this.dispose();
      }
    });

    // Track event
    this.rtc.addEventListener("track", (e) => {
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

    /**
     * Socket listeners
     */
    this.socketListeners = {
      candidate: signaling.on(
        "candidate",
        this,
        (candidate: RTCIceCandidate) =>
          candidate && this.rtc.addIceCandidate(candidate)
      ),
      offer: signaling.on("offer", this, (offer: RTCSessionDescription) => {
        this.createAnswer(offer);
      }),
      answer: signaling.on(
        "answer",
        this,
        (answer: RTCSessionDescriptionInit) => {
          this.rtc.setRemoteDescription(answer);
        }
      ),
    };
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

  /**
   * Return true if the RTCPeerConnection is connected
   */
  isConnected(): boolean {
    return this.rtc.connectionState == "connected";
  }

  /**
   * Adds a track to the PeerConnection
   * @param track Track to be added
   * @param stream Stream of the track
   */
  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    this.senders.push(this.rtc.addTrack(track, stream));
  }

  /**
   * Removes a track from the PeerConnection
   * @param track Track to be removed
   */
  removeTrack(track: MediaStreamTrack) {
    const sender = this.senders.find(
      (s: RTCRtpSender) => s.track?.id === track.id
    );
    if (sender) {
      this.rtc.removeTrack(sender);
    }
  }

  addStream(stream: MediaStream): Peer {
    stream.getTracks().forEach((track) => this.addTrack(track, stream));
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
    return this;
  }

  createChannel(label: string): RTCDataChannel {
    if (!this.channels[label] && (this.offer || this.isConnected())) {
      this.channels[label] = this.rtc.createDataChannel(label);
      this.channels[label].addEventListener("message", (e) => {
        this.emit(`channel`, label, e);
      });
    }
    return this.channels[label];
  }

  removeChannel(label: string) {
    if (this.channels[label]) {
      try {
        this.channels[label].close();
      } catch (e) {}

      Vue.delete(this.channels, label);
    }
  }

  dispose() {
    Object.values(this.socketListeners).forEach((listener) => listener());

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
