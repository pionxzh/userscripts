import { envDefinePlugin } from '@pionxzh/vite-plugin-define-env'
import { defineConfig } from 'vite'
import monkey, { cdn } from 'vite-plugin-monkey'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
    // https://github.com/lisonge/vite-plugin-monkey/issues/10#issuecomment-1207264978
    esbuild: {
        charset: 'utf8',
    },
    plugins: [
        envDefinePlugin({
            interfacePath: './src/env.d.ts',
            customize: () => ({
                __VERSION__: packageJson.version,
            }),
        }),
        monkey({
            entry: 'src/main.ts',
            userscript: {
                name: packageJson.title,
                author: packageJson.author,
                namespace: packageJson.author,
                description: packageJson.description,
                license: packageJson.license,
                match: '*.zhihu.com/*',
                icon: 'https://static.zhihu.com/heifetz/favicon.ico',
            },
            build: {
                fileName: 'zhihu.user.js',
                minifyCss: false,
                externalGlobals: {
                    'sentinel-js': cdn.cdnjs('sentinel', '/sentinel.min.js'),
                },
            },
            server: {
                open: true,
            },
        }),
    ],
})
