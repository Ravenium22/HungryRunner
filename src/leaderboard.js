// src/leaderboard.js

// Keep top N scores, for example 5
const MAX_SCORES = 5;

export function storeLocalScore(newScore) {
  // Get existing scores
  let scores = JSON.parse(localStorage.getItem('localHighScores')) || [];

  // Add new score
  scores.push(newScore);

  // Sort descending and keep top N
  scores.sort((a, b) => b - a);
  scores = scores.slice(0, MAX_SCORES);

  // Store back in localStorage
  localStorage.setItem('localHighScores', JSON.stringify(scores));
}

export function getLocalScores() {
  return JSON.parse(localStorage.getItem('localHighScores')) || [];
}
