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
          v-model="chat.text"
          rows="2"
          placeholder="Escreva aqui..."
          @keyup.enter.stop="sendMessage"
        ></textarea>
      </form>
    </section>
    <div class="main-video" ref="mainVideo">
      <div v-show="!activeStream.stream" class="client-grid">
        <div v-for="(peer, id) in room.connections" :key="id" class="client">
          <div class="streams">
            <c-rtc-video
              v-for="stream in peer.streams"
              :key="stream.id"
              :stream="stream"
              @click.native="toggleActiveStream(stream, peer)"
              playsinline
              autoplay
              muted
            ></c-rtc-video>
          </div>
          <h4 class="name">{{ peer.info.username }}</h4>
        </div>
      </div>

      <c-rtc-video
        v-show="activeStream.stream"
        :stream="activeStream.stream"
        @click.native="toggleActiveStream(activeStream.stream)"
        playsinline
        autoplay
        muted
      ></c-rtc-video>

      <div class="action-buttons">
        <button
          :class="{
            'action-button': true,
            streamer: true,
            active: enable.screen,
          }"
          @click="toggleUserScreen"
        >
          <i class="mdi mdi-monitor-screenshot"></i>
        </button>

        <button class="action-button" @click="toggleUserMic">
          <i :class="`mdi mdi-microphone${enable.audio ? '' : '-off'}`"></i>
        </button>
        <button
          :class="{
            'action-button': true,
            call: true,
            connected,
          }"
          @click="() => (connected ? room.hangup() : room.join(userInfo))"
        >
          <i class="mdi mdi-phone-hangup"></i>
        </button>
        <button
          :class="{
            'action-button': true,
            streamer: true,
            active: enable.video,
          }"
          @click="toggleUserCamera"
        >
          <i :class="`mdi mdi-video${enable.video ? '' : '-off'}`"></i>
        </button>
        <button class="action-button">
          <i :class="`mdi mdi-fullscreen`"></i>
        </button>
      </div>
    </div>
    <div class="remote-medias scrollbar">
      <div class="remote-media local">
        <div class="stream local-stream" v-show="enable.video">
          <c-rtc-video
            v-if="media.camera"
            :stream="media.camera"
            autoplay
            playsinline
            muted
          ></c-rtc-video>

          <button class="close" @click="toggleUserCamera">
            <span>Interromper</span>
            <i class="mdi mdi-stop"></i>
          </button>
        </div>

        <div class="local-stream" v-show="enable.screen">
          <c-rtc-video
            v-if="media.screen"
            :stream="media.screen"
            @click.native="toggleActiveStream(media.screen)"
            autoplay
            playsinline
            muted
          ></c-rtc-video>

          <button class="close" @click="toggleUserScreen">
            <span>Interromper</span>
            <i class="mdi mdi-stop"></i>
          </button>
        </div>

        <strong class="username">{{ userInfo.username }}</strong>
      </div>

      <div
        class="remote-media"
        v-for="(peer, id) in room.connections"
        :key="id"
      >
        <c-rtc-video
          v-for="stream in peer.streams"
          :key="stream.id"
          :stream="stream"
          @click.native="toggleActiveStream(stream, peer)"
          autoplay
          playsinline
        ></c-rtc-video>

        <strong class="username">{{ peer.info.username }}</strong>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { RTCVideo } from "../components";
import { Room, Chat } from "../lib/callee";
import { Peer } from "../lib/p2p";

export default Vue.extend({
  components: {
    CRtcVideo: RTCVideo,
  },
  data() {
    return {
      room: {} as Room,
      signalServer: "https://connect-api.pubby.club",
      fullscreen: false,
      activeStream: {
        stream: null as MediaStream | null,
        peer: null as Peer | null,
      },
      enable: {
        audio: true,
        video: false,
        screen: false,
      },
      media: {
        camera: null as MediaStream | null,
        screen: null as MediaStream | null,
      },
      userInfo: {
        id: "",
        username:
          localStorage.getItem("username") || prompt("Digite seu nome:"),
      },
      chat: {
        text: "",
      },
    };
  },
  async created() {
    this.room = new Room(this.$route.params?.id, this.signalServer);
    await this.room.join(this.userInfo);

    this.requestUserMedia({
      audio: this.enable.audio,
      video: this.enable.video,
    });

    // Check for screen sharing at start
    if (this.enable.screen) {
      this.requestUserScreen();
    }

    this.room.chat.on("message", (msg) => {
      this.$store.dispatch("addMessage", msg);
    });

    this.room.on("client_connected", (id) => {
      console.log("Client connected: ", id);
    });
  },
  computed: {
    connected(): boolean {
      return this.room.signaling.io.connected;
    },
  },
  watch: {
    /**
     * Remove active stream
     */
    "activeStream.peer.streams": {
      deep: true,
      handler(streams: Record<string, MediaStream>) {
        if (this.activeStream.stream) {
          if (!(this.activeStream.stream.id in streams)) {
            this.toggleActiveStream(null);
          }
        }
      },
    },
  },
  methods: {
    requestUserMedia(
      options: {
        audio?: boolean;
        video?: boolean;
      } = {
        video: false,
        audio: false,
      }
    ) {
      return navigator.mediaDevices
        .getUserMedia(options)
        .then((media) => {
          this.media.camera = media;
          this.room.addStream(this.media.camera);

          if (options.audio) this.enable.audio = true;
          if (options.video) this.enable.video = true;
          return this.media.camera;
        })
        .catch((err) => {
          if (err.name !== "NotAllowedError") {
            console.error(err);
          }

          this.media.camera = null;
          if (options.audio) this.enable.audio = false;
          if (options.video) this.enable.video = false;
          return err;
        });
    },
    requestUserScreen() {
      return (
        navigator.mediaDevices
          // @ts-ignore
          .getDisplayMedia({
            audio: false,
            video: true,
          })
          .then((media: MediaStream) => {
            // Adds on ended event listener
            media.getVideoTracks()[0].onended = () => {
              this.toggleUserScreen();
            };

            this.media.screen = media;
            this.room.addStream(this.media.screen);
            this.enable.screen = true;
            return this.media.screen;
          })
          .catch((err: DOMException) => {
            if (err.name !== "NotAllowedError") {
              console.error(err);
            }

            this.enable.screen = false;
            this.media.screen = null;
            return err;
          })
      );
    },
    toggleUserMic() {
      if (!this.media.camera) {
        this.requestUserMedia({
          audio: true,
          video: this.enable.video,
        });
      }

      if (this.media.camera) {
        if (this.enable.audio) {
          this.media.camera
            .getAudioTracks()
            .forEach((track) => (track.enabled = false));
        } else {
          this.media.camera
            .getAudioTracks()
            .forEach((track) => (track.enabled = true));
        }

        this.enable.audio = !this.enable.audio;
      }
    },
    toggleUserCamera() {
      if (!this.media.camera) {
        this.requestUserMedia({
          video: true,
          audio: this.enable.audio,
        });
      }

      if (this.media.camera) {
        if (this.enable.video) {
          this.media.camera.getVideoTracks().forEach((track) => {
            track.stop();
            this.media.camera?.removeTrack(track);
            this.room.removeTrack(track);
          });
          this.media = {
            ...this.media,
            camera: this.media.camera,
          };

          this.enable.video = false;
        } else {
          this.requestUserMedia({ video: true, audio: false });
        }
      }
    },
    toggleUserScreen() {
      if (this.enable.screen) {
        if (this.media.screen) {
          this.room.removeStream(this.media.screen);
          this.media.screen = null;
          this.enable.screen = false;
        }
      } else {
        this.requestUserScreen();
      }
    },
    toggleActiveStream(stream: MediaStream | null, peer: Peer | null = null) {
      if (!stream) {
        this.activeStream.stream = null;
        this.activeStream.peer = null;
      } else if (this.activeStream.stream === stream) {
        this.activeStream.stream = null;
      } else {
        this.activeStream.stream = stream;
        this.activeStream.peer = peer;
      }
    },
    sendMessage(e: KeyboardEvent) {
      if (e.shiftKey) return false;
      const msg = this.chat.text.trim();

      if (msg) {
        this.room.chat.sendMessage(msg);
        this.$store.dispatch(
          "addMessage",
          this.room.chat.createMessage(msg, true)
        );

        this.chat.text = "";
      }
    },
  },
  destroyed() {
    this.room.dispose();
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

    .client-grid {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr 1fr 1fr;

      .client {
        position: relative;
        text-align: center;
        background: #333;
        color: #fff;
        margin: .4rem;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;

        .streams {
          width: 100%;
          height: auto;

          video {
            max-width: 100%;
            max-height: 100%;
          }
        }
        .name {
          width: 100%;
          padding: .4rem .6rem;
        }
      }
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
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.25);
        margin: 0 .6rem;
        outline: 0;

        &:hover {
          background: rgba(0, 0, 0, 0.5);
        }

        &.disabled {
          background: #F00;
        }

        &.streamer {
          position: relative;

          &.active:before {
            content: "";
            display: block;
            position: absolute;
            right: 90%;
            top: 0;
            width: .5rem;
            height: .5rem;
            border-radius: 50%;
            background-color: #dd0000;
            animation: blinker 1.6s ease-out infinite
          }
        }

        &.call {
          width: 54px;
          height: 54px;
          font-size: 1.618em;
          background: #0F0;

          &.connected {
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
      width: auto;
      min-width: 180px;
      margin-right: 0.5em;
      background-color: #0f0f0f;

      video {
        background: inherit;
        width: 180px;
        height: 80px;
        margin: 0 auto;
        object-fit: cover;
        padding: .2rem;
      }

      strong {
        display: block;
        text-align: center;
        text-overflow: ellipsis;
        overflow: hidden;
        width: 100%;
        padding: .4rem .6rem;
      }

      &.local {
        margin-left: 2.4rem;

        &, & > vide {
          background-color: #333;
        }
      }

      .local-stream {
        position: relative;
        display: inline-block;

        &:hover > .close {
          opacity: 1;
        }
        .close {
          opacity: 0;
          transition: .2s ease-in-out;
          position: absolute;
          padding: .4rem .6rem;
          text-align: center;
          bottom: 0;
          left: 0;
          width: 100%;
          background: rgba(255, 255, 255, .8);
          border: none;
          outline: 0;
          color: #111;
          cursor: pointer;
          vertical-align: middle;

          & > i.mdi {
            margin-right: .4rem;
            color: #dd0000;
            font-size: 1.1rem;
          }

          & > span {
            font-size: 1rem;
          }
        }
      }
    }
  }
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>
