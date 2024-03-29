import path from 'node:path'
import process from 'node:process'
import chalk from 'chalk'
import dotenv from 'dotenv'
import fg from 'fast-glob'
import fse from 'fs-extra'
import type { Plugin } from 'vite'

interface EnvDefinePluginConfig {
    mode: string
    include: string[]
    exclude: string[]
    metaPath: string
    interfacePath: string
    customize: (env: Record<string, any>) => Record<string, any>
}

type EnvConfigInput = Partial<EnvDefinePluginConfig>

const defaultConfig: EnvDefinePluginConfig = {
    mode: 'development',
    include: ['.env.*'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    metaPath: '',
    interfacePath: '',
    customize: () => ({}),
}

const resolve = (...args: string[]) => path.resolve(process.cwd(), ...args)

export function envDefinePlugin(config: EnvConfigInput = {}): Plugin {
    const pluginConfig: EnvDefinePluginConfig = { ...defaultConfig, ...config }
    const { mode } = pluginConfig
    const envFilePath = resolve(`.env.${mode}`)
    const customizedEnvConfig = loadEnv(envFilePath, pluginConfig)

    return {
        name: 'env-define',
        config(_config) {
            _config.define = envToDefine(customizedEnvConfig)
            generateFile(pluginConfig, customizedEnvConfig)

            return _config
        },
        configureServer(server) {
            return () => {
                const envFiles = fg.sync(pluginConfig.include, {
                    cwd: process.cwd(),
                    onlyFiles: true,
                    ignore: pluginConfig.exclude,
                })

                const environments = envFiles.map(env => resolve(env))
                environments.forEach((file) => {
                    server.watcher.add(file)
                })

                server.watcher.on('change', (file) => {
                    if (!environments.includes(file)) return

                    server.config.logger.info(chalk.green('hmr update ') + chalk.dim(`.env.${mode}`), {
                        clear: true,
                        timestamp: true,
                    })

                    if (file === envFilePath) {
                        const _customizedEnvConfig = loadEnv(envFilePath, pluginConfig)
                        // @ts-expect-error this is a readonly api, but we need to update the config
                        server.config.define = envToDefine(_customizedEnvConfig)
                        generateFile(pluginConfig, _customizedEnvConfig)

                        // invalidate env.mjs to trigger rebuild
                        const { idToModuleMap } = server.moduleGraph
                        const envMjsId = [...idToModuleMap.keys()].find(x => x.endsWith('env.mjs')) || ''
                        const envMjsModule = idToModuleMap.get(envMjsId)
                        if (envMjsModule) {
                            server.moduleGraph.invalidateModule(envMjsModule)
                            server.ws.send({
                                type: 'full-reload',
                                path: '*',
                            })
                        }
                    }
                })
            }
        },
    }
}

function loadEnv(filePath: string, config: EnvDefinePluginConfig) {
    const envConfig = fse.existsSync(filePath) ? dotenv.parse(fse.readFileSync(filePath)) : {}
    const result = { ...preprocessEnv(envConfig), ...config.customize(envConfig) }

    for (const [key, value] of Object.entries(result)) process.env[key] = value

    return result
}

function preprocessEnv(env: Record<string, any>) {
    return Object.entries(env).reduce((acc, [key, value]) => {
        if (value.match(/^\d+$/)) acc[key] = Number(value)

        else if (value === 'true') acc[key] = true

        else if (value === 'false') acc[key] = false

        else acc[key] = value

        return acc
    }, {} as Record<string, any>)
}

function envToDefine(env: Record<string, any>) {
    // eslint-disable-next-line unused-imports/no-unused-vars
    const { NODE_ENV, ...rest } = env
    return Object.entries(rest).reduce((acc, [key, value]) => {
        const val = typeof value === 'string' ? JSON.stringify(value) : value
        return { ...acc, [key]: val }
    }, {})
}

function generateFile(pluginConfig: EnvDefinePluginConfig, customizedConfig: Record<string, any>) {
    if (pluginConfig.metaPath) {
        const metaResult = Object.keys(customizedConfig).reduce((acc, key) => ({ ...acc, [key]: true }), {})
        const metaText = JSON.stringify(metaResult, null, 2)
        fse.outputFileSync(resolve(pluginConfig.metaPath), metaText)
    }

    if (pluginConfig.interfacePath) {
        const interfacePath = resolve(pluginConfig.interfacePath)
        const originalInterfaceContent = fse.existsSync(interfacePath) ? fse.readFileSync(interfacePath, 'utf8') : ''
        const newInterfaceContent = `/* eslint-disable */

${Object.entries(customizedConfig).map(([key, value]) => `declare const ${key}: ${typeof value};`).join('\n')}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
${Object.entries(customizedConfig).map(([key, value]) => `            ${key}: ${typeof value};`).join('\n')}
        }
    }
}`

        if (originalInterfaceContent !== newInterfaceContent) {
            fse.outputFileSync(resolve(pluginConfig.interfacePath), newInterfaceContent)
        }
    }
}
