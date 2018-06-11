import Vue from 'vue';
import INITIAL_WORDS from './InitialWords';

const STORAGE_KEY = 'word_store';
const INITIAL_WEIGHT = 3;

export default {
  data() {
    return {
      words: {}
    };
  },
  watch: {
    words: {
      handler: 'saveToStorage',
      deep: true
    }
  },
  created() {
    this.words = this.loadFromStorage();
  },
  methods: {
    loadFromStorage() {
      let words = window.localStorage.getItem(STORAGE_KEY);

      if (words) {
        try {
          return JSON.parse(words);
        }
        catch (e) {}
      }

      return this.getInitialWords();
    },
    saveToStorage(words) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    },
    getInitialWords() {
      return INITIAL_WORDS;
    },
    resetInitialWords() {
      this.words = this.getInitialWords();
    },
    addWord(wordToAdd) {
      const currentCount = this.words[wordToAdd];
      Vue.set(this.words, wordToAdd, currentCount ? (currentCount + 1) : INITIAL_WEIGHT);
    },
    removeWord(wordToRemove) {
      Vue.delete(this.words, wordToRemove);
    }
  }
}
