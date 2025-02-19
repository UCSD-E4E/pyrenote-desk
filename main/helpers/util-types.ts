import { IpcMainInvokeEvent } from "electron";

// Source: https://stackoverflow.com/questions/58764853/typescript-remove-first-argument-from-a-function
export type OmitEventArg<F> = F extends (
  e: IpcMainInvokeEvent,
  ...args: infer P
) => infer R
  ? (...args: P) => R
  : never;
