function onloadSafe(fn: () => void) {
    if (document.readyState === 'complete') {
        fn()
    }
    else {
        window.addEventListener('load', fn)
    }
}

onloadSafe(() => {
    const authButton = document.querySelector<HTMLButtonElement>('.push-label button.auth-button')
    if (authButton) authButton.click()
})

export {}
