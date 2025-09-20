import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type WeightUnit = "kg" | "lbs";
export type DistanceUnit = "km" | "miles";

export interface UnitsConfig {
  weight: WeightUnit;
  distance: DistanceUnit;
}

export const weightUnitAtom = atomWithStorage<WeightUnit>("weightUnit", "kg");
export const distanceUnitAtom = atomWithStorage<DistanceUnit>(
  "distanceUnit",
  "km",
);

export const unitsConfigAtom = atom<UnitsConfig>((get) => ({
  weight: get(weightUnitAtom),
  distance: get(distanceUnitAtom),
}));

export const setWeightUnitAction = atom(null, (get, set, unit: WeightUnit) => {
  set(weightUnitAtom, unit);
});

export const setDistanceUnitAction = atom(
  null,
  (get, set, unit: DistanceUnit) => {
    set(distanceUnitAtom, unit);
  },
);
