import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
    // https://github.com/lisonge/vite-plugin-monkey/issues/10#issuecomment-1207264978
    esbuild: {
        charset: 'utf8',
    },
    plugins: [
        monkey({
            entry: 'src/main.ts',
            userscript: {
                'name': packageJson.title,
                'author': packageJson.author,
                'namespace': packageJson.author,
                'description': packageJson.description,
                'license': packageJson.license,
                'match': [
                    '*://myppt.cc/*',
                    '*://*.myppt.cc/*',
                    '*://lurl.cc/*',
                    '*://*.lurl.cc/*',
                ],
                // GM_download / GM_xmlhttpRequest 下載原始檔用（跨到媒體子網域）
                'connect': ['myppt.cc', 'lurl.cc'],
                'run-at': 'document-start',
            },
            build: {
                fileName: 'myppt.user.js',
            },
            server: {
                open: false,
            },
        }),
    ],
    build: {
        cssMinify: false,
    },
})
