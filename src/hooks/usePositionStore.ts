// hooks/usePositionStore.ts

import { create } from "zustand";

interface PoseState {
  headX: number;
  headY: number;
  setHeadPosition: (x: number, y: number) => void;
}

export const usePositionStore = create<PoseState>((set) => ({
  headX: 0,
  headY: 0,
  setHeadPosition: (x, y) => set({ headX: x, headY: y }),
}));

export const getPosition = () => usePositionStore.getState();
