<template>
  <v-dialog v-model="modalVisible" max-width="290">
    <v-card>
      <v-card-title class="headline">Inhalt zurücksetzen</v-card-title>
      <v-card-text>Möchtest du die Wort-Wolke wirklich zurücksetzen?</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn flat @click.native="$emit('ok')">Ja</v-btn>
        <v-btn flat @click.native="$emit('cancel')">Nein</v-btn>
      </v-card-actions>
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
          this.$emit('cancel');
        }
      }
    }
  }
</script>

