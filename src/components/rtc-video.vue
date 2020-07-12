<template>
  <video
    v-show="isVideo"
    :srcObject.prop="stream"
    autoplay
    playsinline
    :muted="muted"
    :volume.prop="muted ? 0 : 100"
  />
</template>

<script>
export default {
  props: {
    stream: {
      type: MediaStream,
      required: false,
    },
    muted: Boolean,
  },
  computed: {
    isVideo: {
      cache: false,
      get() {
        return this.stream && this.stream.getVideoTracks().length > 0;
      },
    },
  },
};
</script>
