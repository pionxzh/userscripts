import pionxzh from '@pionxzh/eslint-config'

export default pionxzh(
    {
        typescript: true,
        react: false,
        vue: false,
        yaml: false,
    },
    {
        rules: {
            'no-console': 'off',
        },
    },
)
