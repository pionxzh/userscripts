import { envDefinePlugin } from '@pionxzh/vite-plugin-define-env'
import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
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
                match: 'https://juejin.cn/*',
                exclude: [
                    'https://juejin.cn/oauth-result/*',
                ],
                // https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web//static/favicons/favicon-32x32.png
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAByFBMVEUAAAAegP8fgP8egf8eev8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP8egP////9x6/jYAAAAlnRSTlMAAAAAAAZdWwUQhvTzhA8lq/ypJHH5C3PsBAJO2dghl2AqYZg7yBGIe/itJq96CGrozkMBRdDnaQwDaAfPN7ZwCfaUlnK3OGPeGP4Z8rww4+JeMr3xWt/aUjzHU9tYw+55IKSiHw3vwjYdn/qhCh6eHHfEOsbtdVDg4ddPL7qDhbkuF/cjrJMWbOnR0mtGKLD9JxKK9Ym9ME1eAAAAAWJLR0SX5m4brwAAAAd0SU1FB+UGEgMGHcgXPyMAAAHTSURBVDjLrVNpV1JRFH1bk55AISFPAVEQQXEgFTWQVDBDUsws5yErc8rU5tGZyjFNsvt7PfcBLizAtVqeD3fdu+9+5+6z3zmCcMkBioz3OYqrIjJ8nqtUqa9dT5cE0ORpGdPe0KVhAPl6RqHPT0uQCgoZKyyQUhAAgxECjKYis0neGM6TgOISC8kHrFa6gVhqK05mAGV2plY6YhjgKFcxe1kSA8YKJ8mv1HAMqKqmYpw1xuQUrpu1pL+u3g24Gxpp23TLhUR6j5dejcPNPp9MvU1UAQYPF9TS2uZHInGg/U4g8Rj8HXeDEDpDzFlyj/8kLo11dbGYXKDb5mShTqE8TGjPfbk4Sy938kGfXPDDR8TtVwriwCCBQ8NcCEbsjI3y+uAdGyc4NCEKyGp5TNvJJx5kA0+fTT3n6acrZgicnYvVPf9igbGFl/P8Rlrk69IUIfrlV3GvIL2eJP6b4JW4k2/f0fH9B+nMKXg/mgn6JHcTRMVnOnz5es5JrKyS5vBaLnXVuprq2tj8+3dutUfIobxvuu/kV+TH9j89AdfOLmXe26el9sCVoqfg/rnH5GhscKfsOeDw6Bc9U32cvq2jv09Uf6IZZocGR5GTebQuGL3/iVNGTHdSXGp/KgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMS0wNi0xOFQwMzowNjoyOSswMDowMBW0AwoAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjEtMDYtMThUMDM6MDY6MjkrMDA6MDBk6bu2AAAAV3pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHic4/IMCHFWKCjKT8vMSeVSAAMjCy5jCxMjE0uTFAMTIESANMNkAyOzVCDL2NTIxMzEHMQHy4BIoEouAOoXEXTyQjWVAAAAAElFTkSuQmCC',
            },
            build: {
                fileName: 'juejin.user.js',
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
