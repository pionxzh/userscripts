import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        monkey({
            entry: 'src/main.ts',
            userscript: {
                name: packageJson.scriptName,
                description: packageJson.scriptDescription,
                author: packageJson.author,
                namespace: packageJson.author,
                license: packageJson.license,
                match: [
                    'https://*.duosecurity.com/frame/prompt?sid=*',
                    'https://*.duosecurity.com/frame/web/v1/auth?',
                ],
                icon: 'https://www.google.com/s2/favicons?sz=64&domain=duosecurity.com',
            },
            build: {
                fileName: 'duo.user.js',
            },
            server: {
                open: true,
            },
        }),
    ],
    build: {
        cssMinify: false,
    },
})
