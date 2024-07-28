import html from '../../html.mjs';

class LcSettings extends HTMLElement
{
    static #attributeToPropMap = {
        'player-id': 'playerId',
        'player-name': 'playerName',
        'player-colour': 'playerColour',
        'panel-rotation': 'panelRotation',
    };

    static observedAttributes = [
        ...Object.keys(LcSettings.#attributeToPropMap),
    ];

    static #COLOURS = Object.freeze([
        'white',
        'blue',
        'black',
        'red',
        'green',
        'grey',
    ]);

    /** @type {string} */
    #playerId;

    /** @type {string} */
    #playerName = 'Player';

    /** @type {(typeof LcSettings.##COLOURS)[number]} */
    #playerColour = 'black';

    /** @type {number} */
    #panelRotation = 0;

    constructor ()
    {
        super();

        Object.entries(LcSettings.#attributeToPropMap).forEach(
            ([attr, prop]) => {
                if (this.hasAttribute(attr))
                {
                    this[prop] = this.getAttribute(attr);
                }
            },
        );
    }

    connectedCallback ()
    {
        if (!this.playerId)
        {
            throw new TypeError('lc-settings MUST have a player-id.');
        }

        this.innerHTML = html`
            <button type=button class="o-Player__openSettings" data-component=settings-button>
                Settings
            </button>

            <dialog class="o-Settings" aria-label="Settings">
                <form>
                    <input
                        name=name
                        type=text
                        data-1p-ignore
                        data-lpignore="true"
                    >

                    <fieldset class="m-Options">
                        <p class="m-Options__item">
                            <label for=mainColour_white-${this.playerId}>
                                <input id=mainColour_white-${this.playerId} name="mainColour" type=radio value="white" class="m-Options__checkbox">
                                <span class="m-Options__icon">☀️</span>
                                <span class="m-Options__label">White</span>
                            </label>
                        </p>
                        <p class="m-Options__item">
                            <label for=mainColour_blue-${this.playerId}>
                                <input id=mainColour_blue-${this.playerId} name="mainColour" type=radio value="blue" class="m-Options__checkbox">
                                <span class="m-Options__icon">💧</span>
                                <span class="m-Options__label">Blue</span>
                            </label>
                        </p>
                        <p class="m-Options__item">
                            <label for=mainColour_black-${this.playerId}>
                                <input id=mainColour_black-${this.playerId} name="mainColour" type=radio value="black" class="m-Options__checkbox">
                                <span class="m-Options__icon">💀</span>
                                <span class="m-Options__label">Black</span>
                            </label>
                        </p>
                        <p class="m-Options__item">
                            <label for=mainColour_red-${this.playerId}>
                                <input id=mainColour_red-${this.playerId} name="mainColour" type=radio value="red" class="m-Options__checkbox" checked>
                                <span class="m-Options__icon">🔥</span>
                                <span class="m-Options__label">Red</span>
                            </label>
                        </p>
                        <p class="m-Options__item">
                            <label for=mainColour_green-${this.playerId}>
                                <input id=mainColour_green-${this.playerId} name="mainColour" type=radio value="green" class="m-Options__checkbox">
                                <span class="m-Options__icon">🌳</span>
                                <span class="m-Options__label">Green</span>
                            </label>
                        </p>
                        <p class="m-Options__item">
                            <label for=mainColour_grey-${this.playerId}>
                                <input id=mainColour_grey-${this.playerId} name="mainColour" type=radio value="grey" class="m-Options__checkbox">
                                <span class="m-Options__icon">🤖</span>
                                <span class="m-Options__label">Colourless</span>
                            </label>
                        </p>
                    </fieldset>
                </form>
            </dialog>
        `;

        this.addEventListener('click', this);
        this.addEventListener('change', this);
        this.addEventListener('focus', this);
        this.addEventListener('blur', this);
        window.addEventListener('resize', this);

        // Re–set properties will update stuff in the DOM
        Object.values(LcSettings.#attributeToPropMap)
            .forEach((prop) => {
                // eslint-disable-next-line no-self-assign
                this[prop] = this[prop];
            });
    }

    attributeChangedCallback (attr, oldValue, newValue)
    {
        if (newValue !== oldValue)
        {
            const prop = LcSettings.#attributeToPropMap[attr];
            this[prop] = newValue;
        }
    }

    handleEvent (event)
    {
        if (event.target !== this)
        {
            ({
                click: this.handleClickEvent,
                change: this.handleChangeEvent,
                submit: this.handleSubmitEvent,
                focus: this.handleFocusEvent,
                blur: this.handleBlurEvent,
                resize: this.handleResieEvent,
            })[event.type]?.call(this, event);
        }
    }

    /**
     * @param {PointerEvent} event
     */
    handleClickEvent (event)
    {
        if (event.target.dataset.component === 'settings-button')
        {
            this.toggle();
        }
    }

    /**
     * @param {Event} event
     */
    handleChangeEvent (event)
    {
        const data = Object.fromEntries(
            new FormData(event.target.form).entries(),
        );
        const customEvent = new CustomEvent('lc-change', {
            target: this,
            bubbles: true,
            detail: data,
        });
        this.dispatchEvent(customEvent);
    }

    toggle ()
    {
        const dialog = this.querySelector('dialog');

        if (dialog.open)
        {
            this.close();
        }
        else
        {
            this.show();
        }
    }

    show ()
    {
        const dialog = this.querySelector('dialog');
        const button = this.querySelector('[data-component=settings-button]');

        button.setAttribute('aria-selected', 'true');
        dialog.show();
        dialog.focus();

        this.setAttribute('open', 'open');
    }

    close ()
    {
        const dialog = this.querySelector('dialog');
        const button = this.querySelector('[data-component=settings-button]');

        button.setAttribute('aria-selected', 'false');
        dialog.close();

        this.removeAttribute('open');
    }

    get playerId ()
    {
        return this.#playerId;
    }

    /** @param {string} */
    set playerId (newValue)
    {
        this.#playerId = String(newValue);
    }

    get playerName ()
    {
        return this.#playerName;
    }

    /** @param {string} */
    set playerName (newValue)
    {
        this.#playerName = String(newValue);

        const nameInput = this.querySelector('[name=name]');
        if (nameInput)
        {
            nameInput.value = this.playerName;
        }
    }

    get playerColour ()
    {
        return this.#playerColour;
    }

    /** @param {(typeof LcSettings.##COLOURS)[number]} */
    set playerColour (newValue)
    {
        const colourName = String(newValue);
        if (!LcSettings.#COLOURS.includes(colourName))
        {
            throw new TypeError(`lc-settings[player-colour] MUST be one of: ${LcSettings.#COLOURS.join(', ')}. Got: ${newValue}.`);
        }
        this.#playerColour = colourName;

        const selectedColourInput = this.querySelector(`[name=mainColour][value=${this.#playerColour}]`);
        if (selectedColourInput)
        {
            selectedColourInput.checked = true;
        }
    }

    get panelRotation ()
    {
        return this.#panelRotation;
    }

    /** @param {number|string} */
    set panelRotation (newValue)
    {
        const numberValue = Number(newValue);
        if (!Number.isInteger(numberValue))
        {
            throw new TypeError(`lc-settings[panel-rotation] MUST be an integer. Got: ${newValue}.`);
        }

        const clampedValue = numberValue % 360;
        if (clampedValue % 90 !== 0)
        {
            throw new TypeError(`lc-settings[panel-rotation] MUST be a multiple of 90. Got: ${newValue}.`);
        }

        this.#panelRotation = clampedValue;

        this.style.setProperty('--rotation', `${this.#panelRotation}deg`);
    }
}

customElements.define('lc-settings', LcSettings);
