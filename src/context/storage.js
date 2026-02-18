import { STORAGE_KEY } from "../constants/deck";

export async function loadGame() {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (result && result.value) {
      return JSON.parse(result.value);
    }
  } catch {
    // No saved game
  }
  return null;
}

export async function persistGame(game) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(game));
  } catch (e) {
    console.error("Save failed:", e);
  }
}
