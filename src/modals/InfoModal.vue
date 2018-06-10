<template>
  <v-dialog v-model="modalVisible" max-width="290">
    <v-card>
      <v-card-title class="headline">Interaktive Umfrage</v-card-title>
      <v-card-text>Ein Projekt von Annika Rehm</v-card-text>
      <v-card-text>Entstanden im Rahmen des Kurses
        <span class="course">Interaktive Kunst</span>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
  export default {
    props: {
      visible: {
        type: Boolean,
        default: false,
        required: true
      }
    },
    computed: {
      modalVisible: {
        get() {
          return this.visible;
        },
        set() {
          this.$emit('ok');
        }
      }
    },
    data() {
      return {
        closeTimer: null
      };
    },
    mounted() {
      this.closeTimer = setTimeout(() => this.$emit('ok'), 4000);
    },
    beforeDestroy() {
      clearTimeout(this.closeTimer);
    }
  }
</script>

<style lang="scss" scoped>
  .course {
    font-size: 1.5em;
    text-transform: uppercase;
  }
</style>
