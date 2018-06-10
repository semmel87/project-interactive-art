<template>
  <div id="app">
    <v-app>
      <v-toolbar
        color="red lighten-3"
        dark
        app
        :clipped-left="$vuetify.breakpoint.mdAndUp"
        fixed>
        <v-toolbar-title>
          Interaktive Umfrage
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click.native.stop="resetModalVisible = true">
          <v-icon>replay</v-icon>
        </v-btn>
        <v-btn icon @click.native.stop="infoModalVisible = true">
          <v-icon>feedback</v-icon>
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
      <reset-modal
        v-if="resetModalVisible"
        :visible="resetModalVisible"
        @cancel="resetModalVisible = false"
        @ok="resetWordCloud">
      </reset-modal>
      <info-modal
        v-if="infoModalVisible"
        :visible="infoModalVisible"
        @ok="infoModalVisible = false">
      </info-modal>
    </v-app>
  </div>
</template>

<script>
  import Vue from 'vue';
  import Vuetify from 'vuetify';
  import { TagCanvas } from './vendor/tagcanvas';
  import { map } from 'lodash';
  import WordStorage from './storage/WordStorage';
  import ResetModal from './modals/ResetModal';
  import InfoModal from './modals/InfoModal';

  Vue.use(Vuetify);

  const CANVAS_ID = 'cloudCanvas';
  const INITIAL_MOVEMENT = [0.1,-0.1];
  const ROTATION_DURATION = 750;
  const ROTATION_INTERVAL = 10000;

  export default {
    name: 'app',
    mixins: [
      WordStorage
    ],
    components: {
      ResetModal,
      InfoModal
    },
    data () {
      return {
        CANVAS_ID,
        canvasVisible: true,
        canvasWidth: 0,
        canvasHeight: 0,
        userInput: '',
        highlightTimer: null,
        randomRotationTimer: null,
        shakeCounter: 0,
        resetModalVisible: false,
        infoModalVisible: false
      };
    },
    computed: {
      cloudWords() {
        return map(this.words, (count, word) => ({ text: word, count: count }));
      }
    },
    created() {
      window.addEventListener('resize', this.updateCanvasAndRecreateCloud);
      ['mousemove', 'touchmove', 'touchend', 'keyup'].map((e) => {
        window.addEventListener(e, this.initializeRandomRotation);
      });
    },
    mounted() {
      this.updateCanvasAndCreateCloud();
      this.initializeRandomRotation();
    },
    beforeDestroy() {
      window.TagCanvas.Delete(CANVAS_ID);
      ['mousemove', 'touchmove', 'touchend', 'keyup'].map((e) => {
        window.removeEventListener(e, this.initializeRandomRotation);
      });
      window.removeEventListener('resize', this.updateCanvasAndRecreateCloud);
    },
    methods: {
      setCanvasDimensions() {
        this.canvasWidth = this.$refs.canvasContainer.offsetWidth;
        this.canvasHeight = this.$refs.canvasContainer.offsetHeight - 32;
      },
      updateCanvasAndCreateCloud() {
        if (!window.onload) {
          this.setCanvasDimensions();
          window.onload = () => {
            this.loaded = true;
            this.createWordCloud();
          };
        } else {
          this.updateCanvasAndRecreateCloud();
        }
      },
      updateCanvasAndRecreateCloud() {
        this.setCanvasDimensions();
        window.TagCanvas.Delete(CANVAS_ID);
        Vue.nextTick(this.createWordCloud);
      },
      createWordCloud() {
        const config = {
          weight: true,
          weightFrom: 'data-weight',
          weightMode: 'both',
          weightSize: 10,
          weightGradient: {
            0: '#b11743',
            0.5: '#febd2e',
            1: '#90fefb'
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
      addUserInputToCloud() {
        const input = this.userInput.trim();
        if (input === '')
          return;

        this.addWord(input);

        this.userInput = '';
        Vue.nextTick(() => {
          this.updateWordCloud();
          this.bringTagToFront(input, false);
        });
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
      resetWordCloud() {
        this.resetModalVisible = false;
        this.resetInitialWords();

        Vue.nextTick(this.createWordCloud);
      },
      bringTagToFront(tagId, shake = true) {
        window.TagCanvas
          .TagToFront(
            CANVAS_ID,
            {
              id: tagId,
              time: ROTATION_DURATION,
              callback: () => shake
                ? this.shake(tagId)
                : this.resumeAfter()
            }
          );
      },
      resumeAfter(delay = 2000) {
        clearTimeout(this.highlightTimer);
        this.highlightTimer = setTimeout(() => this.resumeWordCloud(), delay);
      },
      shake(tagId) {
        this.shakeCounter = 0;
        const shakeDefinedTimes = () => {
          if (this.shakeCounter < 5) {
            this.shakeCounter++;
            this.doSingleShake(tagId, shakeDefinedTimes);
          } else {
            this.shakeCounter = 0;
            this.resumeWordCloud();
          }
        };

        this.doSingleShake(tagId, shakeDefinedTimes);
      },
      doSingleShake(tagId, callback) {
        window.TagCanvas
          .RotateTag(
            CANVAS_ID,
            {
              id: tagId,
              lat: this.getRandomInt(-10, 10),
              lng: this.getRandomInt(-20, 20),
              time: 100,
              callback: callback
            }
          );
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
    color: palevioletred;
  }
</style>
