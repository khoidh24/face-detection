import { create } from "zustand";

type State = {
  x: number;
  y: number;
  setHeadPosition: (x: number, y: number) => void;
};

export const usePositionStore = create<State>((set, get) => ({
  x: 0.5,
  y: 0.5,
  setHeadPosition: (x, y) => {
    const { x: currentX, y: currentY } = get();
    if (Math.abs(x - currentX) < 0.001 && Math.abs(y - currentY) < 0.001) return;
    set({ x, y });
  },
}));