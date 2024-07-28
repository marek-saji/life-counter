import html from '../../html.mjs';

class LcPlayer extends HTMLElement
{
    static #attributeToPropMap = {
        'player-name': 'playerName',
        'player-life': 'playerLife',
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

    /** @type {number} */
    #playerLife = 20;

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
        if (!this.id)
        {
            throw new TypeError('lc-player MUST have an id.');
        }

        this.classList.add('o-Player');

        this.innerHTML = html`
            <div class="o-Player__content">
                <h2 class="o-Player__nameHeading">
                    <span class="o-Player__name" data-component=name></span>
                </h2>

                <lc-life></lc-life>

                <lc-settings player-id=${this.id}></lc-settings>
            </div>
        `;

        // Re–set properties will update stuff in the DOM
        Object.values(LcPlayer.#attributeToPropMap).forEach((prop) => {
            // eslint-disable-next-line no-self-assign
            this[prop] = this[prop];
        });

        const lifeElement = this.querySelector('lc-life');
        lifeElement.addEventListener('change', this);
    }

    attributeChangedCallback (attr, oldValue, newValue)
    {
        if (newValue !== oldValue)
        {
            const prop = LcPlayer.#attributeToPropMap[attr];
            this[prop] = newValue;
        }
    }

    handleEvent (event)
    {
        if (event.target.matches('lc-life'))
        {
            this.handleLifeChangeEvent(event);
        }
    }

    handleLifeChangeEvent (event)
    {
        const lifeElement = event.target;

        this.dataset.dead = lifeElement.value <= 0 ? 'true' : 'false';
    }

    get playerName ()
    {
        return this.#playerName;
    }

    /** @param {string} */
    set playerName (newValue)
    {
        this.#playerName = String(newValue);

        // Update DOM

        const nameElement = this.querySelector('[data-component=name]');
        if (nameElement)
        {
            nameElement.textContent = this.#playerName;
        }

        const settingsElement = this.querySelector('lc-settings');
        if (settingsElement)
        {
            settingsElement.playerName = this.#playerName;
        }
    }

    get playerLife ()
    {
        return this.#playerLife;
    }

    set playerLife (newValue)
    {
        const numberValue = Number(newValue);
        if (!Number.isInteger(numberValue))
        {
            throw new TypeError(`lc-player[player-life] MUST be an integer. Got: ${newValue}.`);
        }

        this.#playerLife = numberValue;

        const lifeElement = this.querySelector('lc-life');
        if (lifeElement)
        {
            lifeElement.value = this.#playerLife;
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

        // Update DOM

        this.dataset.mainColour = this.#playerColour;

        const settingsElement = this.querySelector('lc-settings');
        if (settingsElement)
        {
            settingsElement.playerColour = this.#playerColour;
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

        // Update DOM

        switch (this.#panelRotation)
        {
            case 0: {
                this.style.setProperty('--rotation', '0deg');
                this.style.setProperty('--writing-mode', 'horizontal-tb');
                break;
            }
            case 90: {
                this.style.setProperty('--rotation', '0deg');
                this.style.setProperty('--writing-mode', 'vertical-rl');
                break;
            }
            case 180: {
                this.style.setProperty('--rotation', '180deg');
                this.style.setProperty('--writing-mode', 'horizontal-tb');
                break;
            }
            case 270: {
                this.style.setProperty('--rotation', '180deg');
                this.style.setProperty('--writing-mode', 'vertical-rl');
                break;
            }
            default:
        }

        const settingsElement = this.querySelector('lc-settings');
        if (settingsElement)
        {
            settingsElement.panelRotation = this.#panelRotation;
        }
    }
}

customElements.define('lc-player', LcPlayer);
