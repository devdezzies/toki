// Entry for the skill's tools (turn-bench, turn-check --fidelity): exports T and P for the core scene.
import { build, follow as apartFollow } from "./build.mjs";
import { P } from "./scene.mjs";
const S = build("core");
export const T = S.T;
export { P };
export const follow = (values) => apartFollow({ apart: 0, ...values });
