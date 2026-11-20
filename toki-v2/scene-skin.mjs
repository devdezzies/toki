// Entry for the skill's tools (turn-bench, turn-check --fidelity): exports T and P for the skin scene.
import { build } from "./build.mjs";
import { P } from "./scene.mjs";
const S = build("skin");
export const T = S.T;
export { P };
export const follow = (values) => values;
