<template>
  <video ref="video" playsinline />
</template>

<script>
export default {
  props: {
    stream: {
      type: MediaStream,
      required: false
    }
  },
  watch: {
    stream() {
      this.$refs.video.srcObject = this.stream;
    }
  },
  mounted() {
    this.$refs.video.srcObject = this.stream;
  },
  methods: {
    play() {
      this.$refs.video.play();
    }
  }
};
</script>