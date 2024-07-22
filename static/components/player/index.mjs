import html from '../../html.mjs';

class LcPlayer extends HTMLElement
{
    static #attributeToPropMap = {
        'player-name': 'playerName',
        'player-colour': 'playerColour',
        'panel-rotation': 'panelRotation',
    };

    static observedAttributes = [
        'id',
        ...Object.keys(LcPlayer.#attributeToPropMap),
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
    #playerName = 'Player';

    /** @type {(typeof LcPlayer.##COLOURS)[number]} */
    #playerColour = 'black';

    /** @type {number} */
    #panelRotation = 0;

    constructor ()
    {
        super();

        Object.entries(LcPlayer.#attributeToPropMap).forEach(
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
        this.dataset.player = this.id;
        this.classList.add('o-Player');

        this.innerHTML = html`
            <div class="o-Player__content">
                <h2 class="o-Player__nameHeading">
                    <span class="o-Player__name" data-component=name></span>
                </h2>

                <lc-life value="20"></lc-life>

                <button type=button class="o-Player__openSettings" data-component=settings-button>
                    Settings
                </button>

                <section class="o-Settings" aria-label="Settings" hidden data-component="settings">
                    <form>
                        <input
                            name=name
                            type=text
                            data-1p-ignore
                            data-lpignore="true"
                        >

                        <fieldset class="m-Options">
                            <p class="m-Options__item">
                                <label for=mainColour_white-${this.id}>
                                    <input id=mainColour_white-${this.id} name="mainColour" type=radio value="white" class="m-Options__checkbox">
                                    <span class="m-Options__icon">☀️</span>
                                    <span class="m-Options__label">White</span>
                                </label>
                            </p>
                            <p class="m-Options__item">
                                <label for=mainColour_blue-${this.id}>
                                    <input id=mainColour_blue-${this.id} name="mainColour" type=radio value="blue" class="m-Options__checkbox">
                                    <span class="m-Options__icon">💧</span>
                                    <span class="m-Options__label">Blue</span>
                                </label>
                            </p>
                            <p class="m-Options__item">
                                <label for=mainColour_black-${this.id}>
                                    <input id=mainColour_black-${this.id} name="mainColour" type=radio value="black" class="m-Options__checkbox">
                                    <span class="m-Options__icon">💀</span>
                                    <span class="m-Options__label">Black</span>
                                </label>
                            </p>
                            <p class="m-Options__item">
                                <label for=mainColour_red-${this.id}>
                                    <input id=mainColour_red-${this.id} name="mainColour" type=radio value="red" class="m-Options__checkbox" checked>
                                    <span class="m-Options__icon">🔥</span>
                                    <span class="m-Options__label">Red</span>
                                </label>
                            </p>
                            <p class="m-Options__item">
                                <label for=mainColour_green-${this.id}>
                                    <input id=mainColour_green-${this.id} name="mainColour" type=radio value="green" class="m-Options__checkbox">
                                    <span class="m-Options__icon">🌳</span>
                                    <span class="m-Options__label">Green</span>
                                </label>
                            </p>
                            <p class="m-Options__item">
                                <label for=mainColour_grey-${this.id}>
                                    <input id=mainColour_grey-${this.id} name="mainColour" type=radio value="grey" class="m-Options__checkbox">
                                    <span class="m-Options__icon">🤖</span>
                                    <span class="m-Options__label">Colourless</span>
                                </label>
                            </p>
                        </fieldset>
                    </form>
                </section>
            </div>
        `;

        // Re–set properties will update stuff in the DOM
        Object.values(LcPlayer.#attributeToPropMap).forEach((prop) => {
            // eslint-disable-next-line no-self-assign
            this[prop] = this[prop];
        });
    }

    attributeChangedCallback (attr, oldValue, newValue)
    {
        if (newValue !== oldValue)
        {
            const prop = LcPlayer.#attributeToPropMap[attr];
            this[prop] = newValue;
        }
    }

    get playerName ()
    {
        return this.#playerName;
    }

    /** @param {string} */
    set playerName (newValue)
    {
        this.#playerName = String(newValue);

        const nameElement = this.querySelector('[data-component=name]');
        if (nameElement)
        {
            nameElement.dataset.default = this.playerName;
            nameElement.textContent = this.playerName;
        }

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

    /** @param {(typeof LcPlayer.##COLOURS)[number]} */
    set playerColour (newValue)
    {
        const colourName = String(newValue);
        if (!LcPlayer.#COLOURS.includes(colourName))
        {
            throw new TypeError(`lc-player[player-colour] MUST be one of: ${LcPlayer.#COLOURS.join(', ')}. Got: ${newValue}.`);
        }
        this.#playerColour = colourName;

        this.dataset.mainColour = this.playerColour;
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
            throw new TypeError(`lc-player[panel-rotation] MUST be an integer. Got: ${newValue}.`);
        }

        const clampedValue = numberValue % 360;
        if (clampedValue % 90 !== 0)
        {
            throw new TypeError(`lc-player[panel-rotation] MUST be a multiple of 90. Got: ${newValue}.`);
        }

        this.#panelRotation = clampedValue;

        this.style.setProperty('--rotation', `${this.#panelRotation}deg`);
    }
}

customElements.define('lc-player', LcPlayer);
