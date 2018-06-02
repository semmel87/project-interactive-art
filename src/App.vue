<template>
  <div id="app">
    <v-app>
      <v-container fluid>
        <v-layout column fill-height>
          <v-flex fill-height mb-3>
            <div class="cloud-container fill-height" ref="cloudContainer"></div>
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
  import WordCloud from 'wordcloud';
  import { map } from 'lodash';

  Vue.use(Vuetify);

  export default {
    name: 'app',
    data () {
      return {
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
        return map(this.wordsInCloud, (count, word) => [word, count]);
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
        Vue.nextTick(this.createWordCloud);
      },
      resetUserInput() {
        this.userInput = '';
      },
      createWordCloud() {
        const config = {
          weightFactor: 30,
          wait: 550,
          rotationSteps: 2,
          minRotation: -1.5708,
          maxRotation: 1.5708,
          rotateRatio: 0.5,
          classes: 'fadeInLeft animated',
          list: this.cloudWords
        };
        WordCloud(this.$refs.cloudContainer, config);
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
