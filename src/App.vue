<template>
  <div id="app" @click.ctrl="toolbarVisible = !toolbarVisible">
    <v-app dark>
      <v-toolbar
        dark
        v-show="toolbarVisible"
        :fixed="toolbarVisible"
        :app="toolbarVisible"
        :clipped-left="$vuetify.breakpoint.mdAndUp">
        <v-toolbar-title>
          Interaktive Umfrage
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn v-if="userMediaSupported" icon @click.native.stop="recording = !recording">
          <v-icon v-if="recording">mic_off</v-icon>
          <v-icon v-else>mic</v-icon>
        </v-btn>
        <v-slider label="Grenzwert" v-model="levelThreshold"
                  thumb-label step="0.1" ticks min="0.1" max="1.5">
        </v-slider>
        <v-spacer></v-spacer>
        <v-btn icon :disabled="previousWords.length === 0" @click.native.stop="undoLastOperation">
          <v-icon>undo</v-icon>
        </v-btn>
        <v-btn icon @click.native.stop="removeModalVisible = true">
          <v-icon>delete</v-icon>
        </v-btn>
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
            <v-layout row wrap align-center mb-3
              class="input-container">
              <v-flex xs5 offset-xs3>
                <v-text-field
                  label="Füge einen Ort oder eine Location hinzu"
                  v-model="userInput"
                  @keyup.enter="addUserInputToCloud">
                </v-text-field>
              </v-flex>
              <v-flex xs1>
                <v-btn @click.native="addUserInputToCloud">Hinzufügen</v-btn>
              </v-flex>
            </v-layout>
          </v-layout>
        </v-layout>
      </v-content>
      <remove-word-modal
        v-if="removeModalVisible"
        :visible="removeModalVisible"
        @cancel="removeModalVisible = false"
        @remove="removeWordFromCloud">
      </remove-word-modal>
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
  import { INITIAL_MOVEMENT, DEFAULT_CONFIG, getNextSpecialConfig } from './CloudConfigs';
  import WordStorage from './storage/WordStorage';
  import AudioStreamProcessor from './audio/AudioStreamProcessor';
  import RemoveWordModal from './modals/RemoveWordModal';
  import ResetModal from './modals/ResetModal';
  import InfoModal from './modals/InfoModal';

  Vue.use(Vuetify);

  const CANVAS_ID = 'cloudCanvas';
  const ROTATION_DURATION = 750;
  const ROTATION_INTERVAL = 10000;

  export default {
    name: 'app',
    mixins: [
      WordStorage,
      AudioStreamProcessor
    ],
    components: {
      RemoveWordModal,
      ResetModal,
      InfoModal
    },
    data () {
      return {
        CANVAS_ID,
        canvasVisible: true,
        canvasWidth: 0,
        canvasHeight: 0,
        cloudConfig: DEFAULT_CONFIG,
        userInput: '',
        highlightTimer: null,
        randomRotationTimer: null,
        shakeCounter: 0,
        toolbarVisible: false,
        removeModalVisible: false,
        resetModalVisible: false,
        infoModalVisible: false,
        recording: true,
        growing: true,
        levelThreshold: 0.2,
        belowThreshold: 0,
        animating: false,
        delayAnimationCounter: 0
      };
    },
    computed: {
      cloudWords() {
        return map(this.words, (count, word) => ({ text: word, count: count }));
      }
    },
    watch: {
      toolbarVisible() {
        Vue.nextTick(this.updateCanvasAndRecreateCloud);
      },
      recording(recording) {
        if (recording) {
          this.stopRandomRotation();
          this.startCapturingAudio();
        } else {
          this.stopCapturingAudio();
          this.resetZoom();
          this.initializeRandomRotation();
        }
      }
    },
    created() {
      window.addEventListener('resize', this.updateCanvasAndRecreateCloud);
      if (this.recording) {
        this.startCapturingAudio();
      } else {
        this.initializeRandomRotation();
      }
    },
    mounted() {
      this.updateCanvasAndCreateCloud();
    },
    beforeDestroy() {
      window.TagCanvas.Delete(CANVAS_ID);
      this.stopRandomRotation();
      this.stopCapturingAudio();
      window.removeEventListener('resize', this.updateCanvasAndRecreateCloud);
    },
    methods: {
      setCanvasDimensions() {
        this.canvasWidth = this.$refs.canvasContainer.offsetWidth;
        this.canvasHeight = this.$refs.canvasContainer.offsetHeight - 22;
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
        try {
          window.TagCanvas.Start(CANVAS_ID, '', this.cloudConfig);
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
      removeWordFromCloud(wordToRemove) {
        this.removeModalVisible = false;
        this.removeWord(wordToRemove);

        Vue.nextTick(this.updateWordCloud);
      },
      undoLastOperation() {
        this.resetPreviousState();

        Vue.nextTick(this.updateWordCloud);
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
          if (this.shakeCounter < 10) {
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
        ['mousemove', 'touchmove', 'touchend', 'keyup'].map((e) => {
          window.addEventListener(e, this.stopAndRestartRandomRotation);
        });
      },
      stopRandomRotation() {
        clearInterval(this.randomRotationTimer);
        ['mousemove', 'touchmove', 'touchend', 'keyup'].map((e) => {
          window.removeEventListener(e, this.stopAndRestartRandomRotation);
        });
      },
      stopAndRestartRandomRotation() {
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
      },
      respondToPeak(max) {
        if (this.animating)
          return;

        if (this.delayAnimationCounter < 3) {
          this.delayAnimationCounter++;
          return;
        } else {
          this.delayAnimationCounter = 0;
        }

        const currentZoom = window.TagCanvas.tc[CANVAS_ID].zoom;
        console.log(max);

        if (max > this.levelThreshold) {
          this.belowThreshold = 0;
          const zoomCount = Math.floor(max * 50);
          const nextZoom = currentZoom + DEFAULT_CONFIG.zoomStep * (this.growing ? 1 : -1);
          if (nextZoom < DEFAULT_CONFIG.zoomMin || nextZoom > DEFAULT_CONFIG.zoomMax) {
            this.growing = !this.growing;
          }
          this.zoom(zoomCount, this.growing);
        } else {
          this.belowThreshold++;
          if (this.belowThreshold > 3) {
            this.resetZoom();
          }
        }
      },
      zoom(steps, direction) {
        this.animating = true;
        let zooms = 0;
        const doSingleZoomStep = () => {
          window.TagCanvas.Zoom(CANVAS_ID, direction);
          zooms++;
          if (zooms < steps) {
            setTimeout(doSingleZoomStep, 20);
          } else {
            this.animating = false;
          }
        };
        doSingleZoomStep();
      },
      resetZoom() {
        const currentZoom = window.TagCanvas.tc[CANVAS_ID].zoom;
        const diffToNormal = Number.parseFloat((currentZoom < 1 ? 1 - currentZoom : currentZoom - 1).toFixed(4));
        if (diffToNormal >= DEFAULT_CONFIG.zoomStep)
          this.zoom(Math.floor(diffToNormal / DEFAULT_CONFIG.zoomStep), currentZoom < 1);
      }
    }
  }
</script>

<style lang="scss">
  html {
    overflow-y: auto;
  }
  #app {
    font-family: 'Raleway', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .toolbar {
    .input-group.input-group--slider {
      padding-top: 25px;
    }
  }
  .title {
    font-size: 4em !important;
  }
  .input-container {
    margin-top: -20px;
  }
  .input-group.input-group--focused {
    color: white !important;
    input {
      caret-color: white !important;
    }
  }
</style>
