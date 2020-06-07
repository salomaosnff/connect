<template>
  <c-room
    :room-id="$route.params.id"
    :username="username"
    signaling-url="https://btlyh.sse.codesandbox.io"
    ref="room"
  >
    <template #default="{connected, peers, streams}">
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
          <ul class="messages-list scrollbar">
            <li v-for="i in 10" :key="i">
              <strong class="username">Salomão Neto</strong>
              <p
                class="text"
              >Lorem ipsum dolor, sit amet consectetur adipisicing elit. Porro quis exercitationem, deserunt nihil odit suscipit! Amet laborum dolorem sequi. Nesciunt eveniet molestiae iste sit recusandae quo dignissimos placeat dolorum delectus?</p>
              <time class="time">11:00</time>
            </li>
          </ul>
          <form @submit.prevent class="composer">
            <textarea rows="2" placeholder="Escreva aqui..."></textarea>
          </form>
        </section>
        <div class="main-video">
          <video ref="currentVideo" class="main-video" playsinline autoplay muted></video>
          <div class="action-buttons">
            <button class="action-button" @click="$refs.room.getDisplayMedia()">
              <i class="mdi mdi-monitor-screenshot"></i>
            </button>

            <button class="action-button">
              <i class="mdi mdi-microphone"></i>
            </button>
            <button class="action-button hangup">
              <i class="mdi mdi-phone-hangup"></i>
            </button>
            <button class="action-button" @click="$refs.room.getUserMedia({ audio: true, video: false })">
              <i class="mdi mdi-video"></i>
            </button>
            <button class="action-button">
              <i class="mdi mdi-fullscreen"></i>
            </button>
          </div>
        </div>
        <div class="remote-medias scrollbar">
          <button v-if="!connected" @click="connect()">Conectar</button>

          <div class="remote-media" v-for="(peer, id) in peers" :key="id">
            <c-rtc-video
              v-for="stream in streams[id]"
              :key="stream.id"
              :stream="stream"
              autoplay
              muted
              playsinline
            />
            <strong class="username">{{ peer.name }}</strong>
          </div>
        </div>
      </div>
    </template>
  </c-room>
</template>

<script>
import Vue from "vue";
import { Room } from "../lib/p2p";
import RTCVideo from "../lib/p2p/rtc-video";

export default {
  components: {
    CRoom: Room,
    CRtcVideo: RTCVideo
  },
  data() {
    return {
      connected: false,
      username: ""
    };
  },
  watch: {
    "$refs.room.streams"() {
      console.log('Stream updated!')
      this.$refs.currentVideo.srcObject = this.$refs.room.streams[0];
    }
  },
  methods: {
    connect() {
      this.username = String(Math.random()) || prompt("Qual o seu nome?");
      this.$nextTick(() => this.$refs.room.connect());
    }
  }
};
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
  grid-template-rows: 1fr 140px;
  grid-template-columns: 320px 1fr;

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
    background: blue;
    position: relative;

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

        &.hangup {
          background: #F00;
          width: 54px;
          height: 54px;
          font-size: 1.618em;
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
      width: 80px;
      margin-right: 0.5em;

      video {
        background: red;
        width: 100%;
        height: 80px;
        margin: 0 auto;
      }

      strong {
        display: block;
        text-align: center;
        text-overflow: ellipsis;
        overflow: hidden;
        width: 100%;
        height: 3em;
      }
    }
  }
}
</style>