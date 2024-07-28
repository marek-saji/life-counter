class LcScreenLock extends HTMLElement
{
    /** @type {{ enable(): Promise<void> }} */
    #noSleep;

    /** @type {HTMLElement} */
    #messageElement;

    connectedCallback ()
    {
        this.#setUpMessageElement();
        this.#setUpScreenLock();
    }

    async #setUpMessageElement ()
    {
        if (!this.#messageElement)
        {
            const template =
                this.ownerDocument.createElement('template');
            template.innerHTML = `
                <div class="lc-ScreenLock__message" aria-live="polite"></div>
            `;
            this.#messageElement = template.content.firstElementChild;
        }
        this.appendChild(this.#messageElement);
    }

    async #setUpScreenLock ()
    {
        if (LcScreenLock.#supportsNativeScreenLock())
        {
            this.#setUpNativeScreenLock();
        }
        else
        {
            this.#requestPolyfilledScreenLock();
        }
    }

    static #supportsNativeScreenLock ()
    {
        return 'wakeLock' in navigator;
    }

    async #setUpNativeScreenLock ()
    {
        this.ownerDocument.addEventListener('visibilitychange', this);

        LcScreenLock.#requestNativeScreenLock();
    }

    async handleEvent (event)
    {
        if (event.target !== this)
        {
            ({
                visibilitychange: this.handleVisibilityChangeEvent,
                click: this.handleClickEvent,
            })[event.type]?.call(this, event);
        }
    }

    async handleVisibilityChangeEvent ()
    {
        if (this.ownerDocument.visibilityState === 'visible')
        {
            await navigator.wakeLock.request('screen');
        }
    }

    async handleClickEvent ()
    {
        await this.#noSleep.enable();
        this.#messageElement.dataset.outgoing = 'true';
        this.#messageElement.addEventListener('transitionend', () => {
            this.#messageElement.textContent = '';
        });
    }

    static async #requestNativeScreenLock ()
    {
        await navigator.wakeLock.request('screen');
    }

    async #requestPolyfilledScreenLock ()
    {
        const looksMobile = matchMedia?.('(hover: none)').matches;

        if (looksMobile)
        {
            await this.#loadScript('https://unpkg.com/nosleep.js');

            this.#noSleep = new window.NoSleep();

            // NoSleep plays an invisible video to keep the screen
            // awake. In most browsers playing video requires user
            // interaction, so first .enable() will most probably fail.
            try
            {
                await this.#noSleep.enable();
            }
            catch (_error)
            {
                this.#messageElement.textContent = 'Tap to keep the screen awake';
                this.ownerDocument.addEventListener('click', this, { once: true });
            }
        }
    }

    async #loadScript (src)
    {
        return new Promise((resolve, reject) => {
            const script = this.ownerDocument.createElement('script');
            script.onload = resolve;
            script.onerror = reject;
            script.crossOrigin = 'anonymous';
            script.src = src;
            this.ownerDocument.head.appendChild(script);
        });
    }
}

customElements.define('lc-screen-lock', LcScreenLock);
