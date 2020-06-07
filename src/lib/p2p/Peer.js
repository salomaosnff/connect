import { Room } from "./Room";

export class Peer {
  /**
   * Cria uma conexão P2P
   * @typedef PeerOptions
   * @property {String} id
   * @property {String} name
   * @param {PeerOptions} param0
   * @param {Room} room
   */
  constructor(id) {
    /** @type {String} */
    this.id = id;

    /** @type {RTCPeerConnection} */
    this.rtc = new RTCPeerConnection(Peer.CONFIG);

    this.remoteStreams = []

    this.rtc.addEventListener('track', (e) => {
      this.remoteStreams = e.streams
    })
  }

  /**
   * Cria uma oferta de video e/ou audio
   * @param {*} param0 
   */
  async offerMedia({ audio = true, video = false } = {}) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio,
      video,
    });

    stream.getTracks().forEach(track => this.rtc.addTrack(track, stream))

    return stream
  }

  /**
   * Cria uma oferta
   * @returns {Promise<RTCSessionDescription>}
   */
  async createOffer() {
    return this.rtc
      .createOffer()
      .then((offer) => this.rtc.setLocalDescription(offer))
      .then(() => this.rtc.localDescription);
  }

  /**
   * Cria uma resposta para uma oferta
   * @param {RTCSessionDescription} offer
   * @returns {Promise<RTCSessionDescription>}
   */
  async createAnswer(offer) {
    return this.rtc
      .setRemoteDescription(offer)
      .then(() => this.rtc.createAnswer())
      .then((answer) => this.rtc.setLocalDescription(answer))
      .then(() => this.rtc.localDescription);
  }

  /**
   * Define a resposta da oferta
   * @param {RTCSessionDescription} answer
   * @returns {Promise<void>}
   */
  async setAnswer(answer) {
    return this.rtc.setRemoteDescription(answer);
  }

  /**
   * Disconecta do par
   */
  disconnect() {
    if (this.connection && this.rtc.connectionState != "disconnected") {
      this.connection.close();
    }
  }
}

/**
 * Configuação padrão para criação da conexão P2P
 * @type {RTCConfiguration}
 * */
Peer.CONFIG = {
  iceServers: [
    { url: "stun:stun01.sipphone.com" },
    { url: "stun:stun.ekiga.net" },
    { url: "stun:stun.fwdnet.net" },
    { url: "stun:stun.ideasip.com" },
    { url: "stun:stun.iptel.org" },
    { url: "stun:stun.rixtelecom.se" },
    { url: "stun:stun.schlund.de" },
    { url: "stun:stun.l.google.com:19302" },
    { url: "stun:stun1.l.google.com:19302" },
    { url: "stun:stun2.l.google.com:19302" },
    { url: "stun:stun3.l.google.com:19302" },
    { url: "stun:stun4.l.google.com:19302" },
    { url: "stun:stunserver.org" },
    { url: "stun:stun.softjoys.com" },
    { url: "stun:stun.voiparound.com" },
    { url: "stun:stun.voipbuster.com" },
    { url: "stun:stun.voipstunt.com" },
    { url: "stun:stun.voxgratia.org" },
    { url: "stun:stun.xten.com" },
    {
      url: "turn:numb.viagenie.ca",
      credential: "muazkh",
      username: "webrtc@live.com",
    },
    {
      url: "turn:192.158.29.39:3478?transport=udp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },
    {
      url: "turn:192.158.29.39:3478?transport=tcp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },
  ],
};
