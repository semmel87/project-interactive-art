<template>
  <div id="app">
    <v-app>
      <v-container fluid>
        <v-layout column fill-height>
          <v-flex fill-height mb-3>
            <canvas id="cloudCanvas" v-show="canvasVisible" width="300" height="300">
              <ul>
                <li v-for="word in cloudWords"><a href="#" :data-weight="word.count">{{word.text}}</a></li>
              </ul>
            </canvas>
          </v-flex>
          <v-layout row wrap align-center>
            <v-flex xs5 offset-xs3>
              <v-text-field
                name="new-word"
                label="Füge ein Wort hinzu"
                v-model="userInput"
                @keyup.enter="addUserInputToCloud">
              </v-text-field>
            </v-flex>
            <v-flex xs1>
              <v-btn
                @click.native="addUserInputToCloud">
                Hinzufügen
              </v-btn>
            </v-flex>
          </v-layout>
        </v-layout>
      </v-container>
    </v-app>
  </div>
</template>

<script>
  import Vue from 'vue';
  import Vuetify from 'vuetify';
  import { TagCanvas } from './vendor/tagcanvas';
  import { map } from 'lodash';

  Vue.use(Vuetify);

  export default {
    name: 'app',
    data () {
      return {
        canvasVisible: true,
        initialWords: {
          //Samu: 1,
          //Anni: 2,
          //Liebe: 3
        }, // TODO: load some words from local storage for initial cloud
        wordsInCloud: {},
        userInput: ''
      };
    },
    computed: {
      cloudWords() {
        return map(this.wordsInCloud, (count, word) => ({ text: word, count: count }));
      }
    },
    mounted() {
      this.wordsInCloud = this.initialWords;
      this.createWordCloud();
    },
    methods: {
      addUserInputToCloud() {
        const currentCount = this.wordsInCloud[this.userInput];
        Vue.set(this.wordsInCloud, this.userInput, currentCount ? (currentCount + 1) : 1);

        this.resetUserInput();
        Vue.nextTick(this.updateWordCloud);
      },
      resetUserInput() {
        this.userInput = '';
      },
      createWordCloud() {
        const config = {
          weight: true,
          weightFrom: 'data-weight',
          weightSize: 5,
          weightGradient: {
            0: "#f00", 0.33: "#ff0", 0.66: "#0f0", 1: "#00f"
          },
          minSpeed: 0.005,
          clickToFront: 1000
        };
        try {
          window.TagCanvas.Start('cloudCanvas', '', config);
        } catch (e) {
          this.canvasVisible = false;
        }
      },
      updateWordCloud() {
        window.TagCanvas.Update('cloudCanvas');
      }
    }
}
</script>

<style lang="scss">
  html {
    overflow-y: auto;
  }
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
  }

  .animated {
    animation-duration: 0.5s;
  }
</style>
