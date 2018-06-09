<template>
  <div id="app">
    <v-app>
      <v-toolbar
        color="blue darken-3"
        dark
        app
        :clipped-left="$vuetify.breakpoint.mdAndUp"
        fixed>
        <v-toolbar-title>
          Interaktive Umfrage
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon>
          <v-icon>info</v-icon>
        </v-btn>
      </v-toolbar>
      <v-content>
        <v-layout column fill-height>
          <h1 class="title mt-5 text-xs-center">Wo war deine geilste Party?</h1>
          <v-layout column fill-height>
            <v-flex fill-height ref="canvasContainer">
              <canvas :id="CANVAS_ID"
                      v-show="canvasVisible"
                      :width="canvasWidth"
                      :height="canvasHeight">
                <ul>
                  <li v-for="word in cloudWords">
                    <a :id="word.text"
                       href="#"
                       :data-weight="word.count"
                       @click="bringTagToFront(word.text)">
                      {{word.text}}
                    </a>
                  </li>
                </ul>
              </canvas>
            </v-flex>
            <v-layout row wrap align-center mt-3 mb-3>
              <v-flex xs5 offset-xs3>
                <v-text-field
                  ref="inputField"
                  name="new-word"
                  label="Füge einen Ort oder eine Location hinzu"
                  v-model="userInput"
                  @keyup.enter="addUserInputToCloud"
                  @blur="userInput = ''">
                </v-text-field>
              </v-flex>
              <v-flex xs1>
                <v-btn ref="canvas"
                  @click.native="addUserInputToCloud">
                  Hinzufügen
                </v-btn>
              </v-flex>
            </v-layout>
          </v-layout>
        </v-layout>
      </v-content>
    </v-app>
  </div>
</template>

<script>
  import Vue from 'vue';
  import Vuetify from 'vuetify';
  import { TagCanvas } from './vendor/tagcanvas';
  import { map } from 'lodash';

  import INITIAL_WORDS from './initialWords';

  Vue.use(Vuetify);

  const CANVAS_ID = 'cloudCanvas';
  const INITIAL_MOVEMENT = [0.1,-0.1];
  const INITIAL_WEIGHT = 3;
  const ROTATION_DURATION = 750;
  const ROTATION_INTERVAL = 10000;

  export default {
    name: 'app',
    data () {
      return {
        CANVAS_ID,
        canvasVisible: true,
        canvasWidth: 0,
        canvasHeight: 0,
        initialWords: INITIAL_WORDS,
        wordsInCloud: {},
        userInput: '',
        highlightTimer: null,
        randomRotationTimer: null
      };
    },
    computed: {
      cloudWords() {
        return map(this.wordsInCloud, (count, word) => ({ text: word, count: count }));
      }
    },
    created() {
      window.addEventListener('resize', this.updateCanvasAndCreateCloud);
      window.addEventListener('mousemove', this.initializeRandomRotation);
    },
    mounted() {
      this.wordsInCloud = this.initialWords;
      this.updateCanvasAndCreateCloud();
      this.initializeRandomRotation();
    },
    beforeDestroy() {
      window.TagCanvas.Delete(CANVAS_ID);
      window.addEventListener('mousemove', this.initializeRandomRotation);
      window.removeEventListener('resize', this.updateCanvasAndCreateCloud);
    },
    methods: {
      addUserInputToCloud() {
        const input = this.userInput.trim();
        if (input === '')
          return;

        const currentCount = this.wordsInCloud[input];
        Vue.set(this.wordsInCloud, input, currentCount ? (currentCount + 1) : INITIAL_WEIGHT);

        this.userInput = '';
        Vue.nextTick(() => {
          this.updateWordCloud();
          this.bringTagToFront(input);
        });
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
          textFont: 'Raleway',
          minSpeed: 0.005,
          initial: INITIAL_MOVEMENT,
          fadeIn: 800,
          dragControl: true
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
      resumeWordCloud(random = false) {
        let movement = INITIAL_MOVEMENT;
        if (random) {
          movement = [
            Math.random() / 2 * (this.getRandomInt(0, 1) ? 1 : -1),
            Math.random() / 2 * (this.getRandomInt(0, 1) ? 1 : -1)
          ];
        }

        window.TagCanvas.SetSpeed(CANVAS_ID, movement);
      },
      bringTagToFront(tagId) {
        window.TagCanvas
          .TagToFront(
            CANVAS_ID,
            {
              id: tagId,
              time: ROTATION_DURATION,
              callback: () => this.resumeAfter()
            }
          );
      },
      updateCanvasAndCreateCloud() {
        this.canvasWidth = this.$refs.canvasContainer.offsetWidth;
        this.canvasHeight = this.$refs.canvasContainer.offsetHeight - 32;

        Vue.nextTick(this.createWordCloud);
      },
      resumeAfter(delay = 3000) {
        clearTimeout(this.highlightTimer);
        this.highlightTimer = setTimeout(() => this.resumeWordCloud(), delay);
      },
      initializeRandomRotation() {
        clearInterval(this.randomRotationTimer);
        this.randomRotationTimer = setInterval(() => {
          const randomIndex = this.getRandomInt(0, this.cloudWords.length - 1);
          window.TagCanvas
            .RotateTag(
              CANVAS_ID,
              {
                index: randomIndex,
                lat: this.getRandomInt(-90, 90),
                lng: this.getRandomInt(-180, 180),
                time: ROTATION_DURATION,
                callback: () => setTimeout(() => this.resumeWordCloud(true), 1500)
              }
            );
        }, ROTATION_INTERVAL);
      },
      getRandomInt(min, max) {
        return Math.floor(Math.random() * Math.floor(max - min)) + min;
      }
    }
  }
</script>

<style lang="scss">
  html {
    overflow-y: auto;
  }
  #app {
    font-family: 'Raleway', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #fff;
  }
  .title {
    font-size: 4em !important;
  }
</style>
