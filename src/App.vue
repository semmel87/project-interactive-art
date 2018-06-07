<template>
  <div id="app">
    <v-app>
      <v-container fluid>
        <v-layout column fill-height>
          <v-flex fill-height mb-3>
            <canvas :id="CANVAS_ID" v-show="canvasVisible" :width="canvasWidth" :height="canvasHeight">
              <ul>
                <li v-for="word in cloudWords">
                  <a href="#" :data-weight="word.count">{{word.text}}</a>
                </li>
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

  const CANVAS_ID = 'cloudCanvas';

  export default {
    name: 'app',
    data () {
      return {
        CANVAS_ID,
        canvasVisible: true,
        canvasWidth: 0,
        canvasHeight: 0,
        initialWords: {
          Samu: 1,
          Anni: 2,
          Liebe: 3
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
    created() {
      window.addEventListener('resize', this.updateCanvasAndCreateCloud);
    },
    mounted() {
      this.wordsInCloud = this.initialWords;
      this.updateCanvasAndCreateCloud();
    },
    beforeDestroy() {
      window.TagCanvas.Delete(CANVAS_ID);
      window.removeEventListener('resize', this.updateCanvasAndCreateCloud);
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
          weightMode: 'both',
          weightSize: 10,
          weightGradient: {
            0: '#3f2b96',
            1: '#a8c0ff'
          },
          outlineColour: 'transparent',
          minSpeed: 0.005,
          initial: [0.1,-0.1],
          fadeIn: 800,
          clickToFront: 1000
        };
        try {
          window.TagCanvas.Start(CANVAS_ID, '', config);
        } catch (e) {
          this.canvasVisible = false;
        }
      },
      updateWordCloud() {
        window.TagCanvas.Update(CANVAS_ID);
      },
      updateCanvasAndCreateCloud() {
        this.canvasWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        this.canvasHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 130;

        Vue.nextTick(this.createWordCloud);
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
    background-color: #fff;
  }
</style>
