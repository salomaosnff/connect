<template>
  <div id="call">
    <section class="left">
      <div class="side-buttons">
        <div class="title" tabindex="0">
          <i class="mdi mdi-chat icon-large"></i>
          <span>Mensagens</span>
          <i class="arrow mdi mdi-chevron-down"></i>

          <ul class="title-dropdown">
            <li tabindex="-1">
              <i class="mdi mdi-chat icon-large"></i>
              <span>Mensagens</span>
            </li>
            <li tabindex="-1">
              <i class="mdi mdi-attachment icon-large"></i>
              <span>Arquivos</span>
            </li>
            <li tabindex="-1">
              <i class="mdi mdi-account-group icon-large"></i>
              <span>Pessoas</span>
            </li>
          </ul>
        </div>
      </div>
      <ul class="messages-list scrollbar" ref="chat">
        <li
          v-for="(message, i) in $store.state.chat.messages"
          :key="i"
          :class="{ me: message.user.username === userInfo.username }"
        >
          <strong class="username">{{ message.user.username }}</strong>
          <p class="text" v-html="message.text"></p>
          <time class="time">{{ message.date }}</time>
        </li>
      </ul>
      <form @submit.prevent class="composer">
        <textarea
          v-model="chat.message"
          rows="2"
          placeholder="Escreva aqui..."
          @keyup.enter.stop="sendChatMessage"
        ></textarea>
      </form>
    </section>
    <div class="main-video" ref="mainVideo">
      <c-rtc-video
        :stream="activeStream"
        playsinline
        autoplay
        muted
      ></c-rtc-video>
      <div class="action-buttons">
        <button class="action-button" @click="toggleScreenStream()">
          <i class="mdi mdi-monitor-screenshot"></i>
        </button>

        <button class="action-button" @click="toggleAudioStream()">
          <i :class="`mdi mdi-microphone${media.microphone ? '' : '-off'}`"></i>
        </button>
        <button
          :class="{ 'action-button': true, call: true, hangup: connected }"
          @click="() => (connected ? hangup() : call())"
        >
          <i class="mdi mdi-phone-hangup"></i>
        </button>
        <button class="action-button" @click="toggleCameraStream()">
          <i :class="`mdi mdi-video${media.camera ? '' : '-off'}`"></i>
        </button>
        <button class="action-button" @click="toggleFullScreen()">
          <i :class="`mdi mdi-fullscreen${fullscreen ? '-exit' : ''}`"></i>
        </button>
      </div>
    </div>
    <div class="remote-medias scrollbar">
      <div class="remote-media" v-for="(peer, id) in peers" :key="id">
        <c-rtc-video
          v-for="stream in peer.streams"
          :key="stream.id"
          :stream="stream"
          @click.native="activeStream = stream"
          autoplay
          playsinline
        ></c-rtc-video>

        <strong class="username">{{ peer.info.username }}</strong>
      </div>
    </div>

    <iframe
     src="https://codesandbox.io/embed/twilight-field-eh1v2?fontsize=14&hidenavigation=1&theme=dark&view=preview"
     style="display: none;width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="twilight-field-eh1v2"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Peer, SocketIOSignaling, RTCVideo } from "../lib/p2p";

export default Vue.extend({
  components: {
    CRtcVideo: RTCVideo,
  },
  data() {
    return {
      // @ts-ignore
      room: this.$route.params.id,
      signaling: new SocketIOSignaling("https://eh1v2.sse.codesandbox.io/"),
      peers: {} as Record<string, Peer>,
      fullscreen: false,
      userInfo: {
        username:
          localStorage.getItem("username") || prompt("Digite seu nome:"),
      },
      media: {
        screen: false,
        microphone: false,
        camera: false,
      },
      streams: {
        media: null as MediaStream | null,
        screen: null as MediaStream | null,
      },
      activeStream: null as MediaStream | null,
      chat: {
        message: "",
      },
    };
  },
  created() {
    this.call().then(() => {
      console.log("Connection stabilished.");
    });
  },
  watch: {
    ["$store.state.chat.messages"](value) {
      const chat = this.$refs.chat as HTMLElement;
      const needScroll =
        chat.scrollTop >= chat.scrollHeight - chat.offsetHeight - 64;

      this.$nextTick(() => {
        if (this.$refs.chat) {
          if (needScroll) {
            chat.scrollTop = chat.scrollHeight;
          }
        }
      });
    },
  },
  computed: {
    connected(): boolean {
      return this.signaling && this.signaling.io.connected;
    },
  },
  methods: {
    async call() {
      console.log("Calling...");

      if (this.signaling && !this.signaling.io.connected) {
        this.signaling.io.connect();
      }

      //@ts-ignore
      this.streams.media = await this.getUserMedia();

      const connectedPeers = await this.signaling.join(
        this.room,
        this.userInfo
      );

      if (this.userInfo.username)
        localStorage.setItem("username", this.userInfo.username);

      this.peers = connectedPeers.reduce(
        (acc: Record<string, Peer>, { id, info }) => {
          acc[id] = this.createPeer(id, info);
          return acc;
        },
        {}
      );

      // When someone join
      this.signaling.io.on(
        "joined",
        (peerId: string, info: Record<string, any>) => {
          this.peers[peerId] = this.createPeer(peerId, info, false);

          console.log(`${peerId} entrou!`);
        }
      );

      // When someone hangup
      this.signaling.io.on("hangup", (peerId: string) => {
        console.log(`${peerId} saiu!`);
        if (this.peers[peerId]) {
          this.peers[peerId].dispose();
          Vue.delete(this.peers, peerId);
        }
      });
    },
    hangup() {
      console.log("Disconnecting...");

      this.signaling.hangup();
      this.signaling.dispose();
      Object.values(this.peers).forEach((peer) => peer.dispose());
      this.peers = {};
      console.log("Disconnected!");
    },
    createPeer(
      peerId: string,
      info: Record<string, any> = {},
      canOffer = true
    ) {
      const peer = new Peer(peerId, this.signaling, info, canOffer);

      Object.entries(this.streams).forEach(([name, stream]) => {
        console.log(
          `Sending stream to ${peerId}. Name: ${name}; Stream: `,
          stream
        );
        if (stream) {
          peer.addStream(stream);
        }
      });

      if (!this.activeStream) this.activeStream = peer.streams[0];

      // @ts-ignore
      peer.on("disconnected", () => {
        this.$delete(this.peers, peerId);
      });

      this.$set(this.peers, peerId, Vue.observable(peer));
      return peer;
    },
    async toggleScreenStream() {
      if (!this.media.screen) {
        console.log("Enabling screen sharing!");

        this.streams.screen = await this.getDisplayMedia();
        this.addStream(this.streams.screen as MediaStream);
      } else {
        console.log("Disabling screen sharing!");

        this.streams.screen?.getVideoTracks().forEach((track) => track.stop());
        this.removeStream(this.streams.screen as MediaStream);
        this.streams.screen = null;
      }

      this.media.screen = !!this.streams.screen;
    },
    async toggleAudioStream() {
      if (this.streams.media) {
        console.log(
          (this.media.microphone ? "Disabling" : "Enabling") + " microphone!"
        );

        this.media.microphone = !this.media.microphone;

        this.streams.media
          .getAudioTracks()
          .forEach((track) => (track.enabled = this.media.microphone));
      }
    },
    async toggleCameraStream() {
      if (this.streams.media) {
        if (this.media.camera) {
          console.log("Disabling camera!");

          this.streams.media
            .getVideoTracks()
            .forEach((track: MediaStreamTrack) => {
              track.stop();
              this.streams.media?.removeTrack(track);

              Object.values(this.peers).forEach((p: Peer) => {
                const sender = p.senders.find((s) => s.track?.id === track.id);

                if (sender) {
                  p.rtc.removeTrack(sender);
                }
              });
            });
        } else {
          console.log("Enabling camera!");

          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });

          cameraStream.getVideoTracks().forEach((track) => {
            this.streams.media?.addTrack(track);

            Object.values(this.peers).forEach((p: Peer) => {
              p.senders.push(
                p.rtc.addTrack(track, this.streams.media as MediaStream)
              );
            });
          });
        }
      }
    },
    toggleFullScreen() {
      if (
        /// @ts-ignore
        window.fullScreen ||
        (window.innerWidth == screen.width &&
          window.innerHeight == screen.height)
      ) {
        document.exitFullscreen();
        this.fullscreen = false;
      } else {
        // @ts-ignore
        this.fullscreen = this.$refs.mainVideo.requestFullscreen();
      }
    },
    addStream(stream: MediaStream) {
      Object.values(this.peers).forEach((peer) => {
        console.log(`Adding stream to ${peer.id}.`, stream);
        peer.addStream(stream);
      });
    },
    removeStream(stream: MediaStream) {
      Object.values(this.peers).forEach((peer) => {
        console.log(`Removing stream from ${peer.id}.`, stream);
        peer.removeStream(stream);
      });
    },
    async getDisplayMedia() {
      this.media.screen = true;
      // @ts-ignore
      return navigator.mediaDevices.getDisplayMedia();
    },
    async getUserMedia(
      options: MediaStreamConstraints = {
        audio: true,
        video: false,
      }
    ) {
      this.media.microphone = options.audio as boolean;
      this.media.camera = options.video as boolean;
      return await navigator.mediaDevices.getUserMedia(options);
    },
    sendChannelData(channelLabel: string, data: any) {
      Object.values(this.peers).forEach((peer) => {
        if (peer.channels[channelLabel]) {
          const channel = peer.channels[channelLabel];

          if (channel.readyState === "open") {
            channel.send(data);
          }
        }
      });
    },
    normalizeMessage(msg: string): string {
      return msg
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(
          /https?:\/\/(?:www.)?(?:youtube.com\/watch\?v=|youtu.be\/)(\w+)/g,
          "yt($1)"
        )
        .replace(
          /(https?:\/\/[^\s]+\.(?:png|jpe?g|gif|svg|webp)[^\s]*)/g,
          "[$1]"
        )
        .replace(/(https?:\/\/[^\s]+\.(?:mp4)[^\s]*)/g, "video($1)")
        .replace(
          /(?<!\[)(?<!video\()(https?\:\/\/[^\s]+)/g,
          `<a href="$1" title="$1" target="_blank">$1</a>`
        )
        .replace(
          /yt\(([^\]]+)\)/g,
          ` <div class="media">
              <iframe frameborder="0" src="https://youtube.com/embed/$1" class="img-link" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              <a href="https://youtube.com/watch?v=$1" target="_blank" title="https://youtube.com/watch?v=$1">https://youtube.com/watch?v=$1</a>
            </div>`
        )
        .replace(/video\(([^\]]+)\)/g, `<video src="$1" controls />`)
        .replace(
          /\[(https?\:\/\/[^\s]+)\]/g,
          `<a href="$1" title="$1" class="img-link" target="_blank"><img src="$1"/></a>`
        )
        .replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`)
        .replace(/\~([^~]+)\~/g, `<strike>$1</strike>`)
        .replace(/__([^_]+)__/g, `<em>$1</em>`);
    },
    sendChatMessage() {
      const messageText = this.normalizeMessage(this.chat.message.trim());

      if (messageText) {
        const message = {
          user: this.userInfo,
          text: messageText,
          date: new Date(),
        };
        this.$store.dispatch("addMessage", message);
        this.sendChannelData("chat", JSON.stringify(message));

        this.chat.message = "";
      }
    },
  },
  beforeDestroy() {
    console.log("beforeDestroy()");
    this.hangup();
  },
});
</script>

<style lang="stylus">
.scrollbar {
  &::-webkit-scrollbar {
    background: none;
    width: 0.5em;
  }

  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 0.809em;

    &:hover {
      background: #444;
    }

    &:active {
      background: #FFF;
    }
  }
}

#call {
  width: 100%;
  height: 100%;
  display: grid;
  background: #1b1b1b;
  grid-template-areas: 'chat video' 'chat users';
  grid-template-rows: minmax(320px, 1fr) 140px;
  grid-template-columns: 390px 1fr;

  .left {
    grid-area: chat;
    color: #FFF;
    display: flex;
    flex-flow: column;

    .side-buttons {
      .icon-large {
        font-size: 1.618em;
        vertical-align: middle;
      }

      .title {
        display: flex;
        align-items: center;
        cursor: pointer;
        position: relative;
        outline: none;
        padding: 0.5em 0 0.25em 0;

        .mdi {
          margin: 0 0.25em 0 0.5em;
        }

        .arrow {
          margin-left: 0.25em;
        }

        &-dropdown {
          position: absolute;
          top: 100%;
          list-style: none;
          background: #444;
          width: 100%;
          display: none;
          box-shadow: 0 8px 8px rgba(0, 0, 0, 0.25);
          border: 1px solid #333;
          border-radius: 1em;
          overflow: auto;
          max-height: 320px;

          li {
            display: flex;
            align-items: center;
            padding: 0.25em 0;

            &:hover {
              background: #333;
            }
          }
        }

        &:focus {
          .title-dropdown {
            display: block;
          }
        }
      }
    }

    .messages-list {
      flex: 1;
      list-style: none;
      overflow: auto;
      margin-left: 0.809em;
      margin-right: 0.25em;

      li {
        background: #333;
        margin: 0.25em 0.5em 0.5em 0;
        padding: 0.809em 0.809em 0.5em 0.809em;
        border-radius: 0 1em 1em 1em;
        font-size: 0.9375em;
        color: #E0E0E0;
        word-break: break-word;

        &.me {
          border-radius: 1em 0 1em 1em;
          background: #263238;
        }

        .username {
          display: block;
          margin: 0 0 0.25em 0;
          color: #FFF;
        }

        .time {
          display: block;
          text-align: right;
          font-size: 0.8em;
          color: #AAA;
        }

        .img-link {
          display: block;
          overflow: hidden;
          margin: .4rem;
        }

        img, video {
          max-width: 100%;
          width: 100%;
          border-radius: .4rem;
          margin: 0;
        }
      }
    }

    .composer {
      display: flex;
      margin: 0.25em 0.5em 0 0.809em;

      textarea {
        flex: 1;
        border: none;
        background: none;
        border-radius: 0.809em;
        padding: 0.809em;
        color: #FFF;
        outline: none;
        resize: none;

        &:focus {
          background: #333;
        }
      }
    }
  }

  .main-video {
    display: block;
    grid-area: video;
    background: black;
    position: relative;
    margin: 1.4rem;

    video {
      width: 100%;
      height: 100%;
    }

    .action-buttons {
      position: absolute;
      bottom: 1em;
      left: 50%;
      transform: translate(-50%, 0);

      .action-button {
        border: none;
        font-size: 1.3em;
        color: #FFF;
        width: 48px;
        height: 48px;
        cursor: pointer;
        border-radius: 64px;
        background: rgba(0, 0, 0, 0.25);

        &:hover {
          background: rgba(0, 0, 0, 0.5);
        }

        &.disabled {
          background: #F00;
        }

        &.call {
          width: 54px;
          height: 54px;
          font-size: 1.618em;
          background: #0F0;

          &.hangup {
            background: #F00;
          }
        }
      }
    }
  }

  .remote-medias {
    grid-area: users;
    overflow: hidden;
    overflow-x: auto;
    white-space: nowrap;
    padding: 0.809em;
    direction: rtl;

    .remote-media {
      display: inline-block;
      font-size: 0.809em;
      color: #e0e0e0;
      width: 180px;
      margin-right: 0.5em;
      border: 1px solid #eee;

      video {
        background: #333;
        width: 100%;
        height: 80px;
        margin: 0 auto;
        object-fit: cover;
      }

      strong {
        display: block;
        text-align: center;
        text-overflow: ellipsis;
        overflow: hidden;
        width: 100%;
      }
    }
  }
}
</style>
