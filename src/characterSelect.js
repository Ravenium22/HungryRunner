// src/characterSelect.js
export function setupCharacterSelection() {
  const characterOptions = document.querySelectorAll('.character-option');
  let selectedCharacter = null;

  characterOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Visual highlight
      characterOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      selectedCharacter = option.dataset.character;
    });
  });

  const startGameBtn = document.getElementById('start-game-btn');
  startGameBtn.addEventListener('click', () => {
    if (!selectedCharacter) {
      alert('Please select a character first!');
      return;
    }
    // Store selection in localStorage
    localStorage.setItem('selectedCharacter', selectedCharacter);
    // Navigate to the game page
    window.location.href = './game.html';
  });
}
