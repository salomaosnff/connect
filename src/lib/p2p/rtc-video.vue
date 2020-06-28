<template>
  <video v-show="isVideo" :srcObject.prop="stream" autoplay playsinline />
</template>

<script>
export default {
  props: {
    stream: {
      type: MediaStream,
      required: false,
    },
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
