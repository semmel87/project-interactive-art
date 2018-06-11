import Vue from 'vue';
import INITIAL_WORDS from './InitialWords';

const STORAGE_KEY = 'word_store';
const INITIAL_WEIGHT = 3;

export default {
  data() {
    return {
      words: {},
      previousWords: []
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
    resetPreviousState() {
      this.words = this.previousWords[this.previousWords.length - 1];
      this.previousWords.splice(this.previousWords.length - 1, 1);
    },
    addCurrentStateToHistory() {
      this.previousWords[this.previousWords.length] = Object.assign({}, this.words); // to make it possible to track changes
    },
    addWord(wordToAdd) {
      this.addCurrentStateToHistory();
      const currentCount = this.words[wordToAdd];
      Vue.set(this.words, wordToAdd, currentCount ? (currentCount + 1) : INITIAL_WEIGHT);
    },
    removeWord(wordToRemove) {
      this.addCurrentStateToHistory();
      Vue.delete(this.words, wordToRemove);
    }
  }
}
