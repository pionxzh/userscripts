/* eslint-disable */

declare const __VERSION__: string;

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            __VERSION__: string;
        }
    }
}