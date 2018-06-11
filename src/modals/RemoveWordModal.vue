<template>
  <v-dialog v-model="modalVisible" max-width="400">
    <v-card>
      <v-card-title class="headline">Wort löschen</v-card-title>
      <v-card-text>
      <v-form>
        <v-text-field
          name="delete-word"
          label="Welches Wort möchtest du löschen?"
          v-model="userInput"
          @keyup.enter="emitRemove">
        </v-text-field>
      </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn flat :disabled="!canDelete" @click.native="emitRemove">Löschen</v-btn>
        <v-btn flat @click.native="$emit('cancel')">Abbrechen</v-btn>
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
    data() {
      return {
        userInput: ''
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
      },
      canDelete() {
        const input = this.userInput.trim();
        return input !== '';
      }
    },
    methods: {
      emitRemove() {
        if(!this.canDelete)
          return;

        this.$emit('remove', this.userInput);
        this.userInput = '';
      }
    }
  }
</script>

