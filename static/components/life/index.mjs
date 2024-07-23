import html from '../../html.mjs';

class LcLife extends HTMLElement
{
    static observedAttributes = [
        'value',
    ];

    static #CHANGE_VISIBLE_TIME_MS = 2_000;

    /** @type {number} */
    #value = 0;

    /** @type {number} */
    #changeValue = 0;

    /** @type {number} */
    #changeTimeoutId;

    constructor ()
    {
        super();

        if (this.hasAttribute('value'))
        {
            this.value = this.getAttribute('value');
        }
    }

    connectedCallback ()
    {
        this.innerHTML = html`
            <output
                hidden
                class="o-Player__message"
                data-component=message
                aria-life="polite"
            ></output>

            <form>
                <input
                    class="m-Life__value"
                    type="number"
                    name="life"
                    value="${this.value}"
                />
                <button
                    class="m-Life__button m-Life__button--decrease"
                    type="button"
                    data-step="-1"
                    aria-label="Decreate life by one"
                >
                    <span class="m-Life__button-icon">−</span>
                </button>
                <button
                    class="m-Life__button m-Life__button--increase"
                    type="button"
                    data-step="+1"
                    aria-label="Increase life by one"
                >
                    <span class="m-Life__button-icon">+</span>
                </button>
            </form>
        `;

        this.addEventListener('click', this);
        this.addEventListener('submit', this);
        this.addEventListener('change', this);
    }

    attributeChangedCallback (name, oldValue, newValue)
    {
        if (newValue !== oldValue)
        {
            switch (name)
            {
                case 'value': {
                    this.value = newValue;
                    break;
                }
                default:
            }
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
            })[event.type]?.call(this, event);
        }
    }

    /**
     * @param {PointerEvent} event
     */
    handleClickEvent (event)
    {
        const step = Number(event.target.dataset.step);
        if (!Number.isNaN(step))
        {
            this.value += step;
        }
    }

    /**
     * @param {Event} event
     */
    handleChangeEvent (event)
    {
        this.value = event.target.value;
    }

    /**
     * @param {SubmitEvent} event
     */
    // eslint-disable-next-line class-methods-use-this
    handleSubmitEvent (event)
    {
        event.preventDefault();
    }

    /**
     * @param {string|number} value
     */
    set value (newValue)
    {
        const numberValue = Number(newValue);
        if (!Number.isInteger(numberValue))
        {
            throw new TypeError(`lc-life[value] MUST be an integer. Got: ${newValue}.`);
        }

        const oldValue = this.#value;
        this.#value = numberValue;

        const input = this.querySelector('input[type=number]');
        if (input)
        {
            if (input.value !== String(this.#value))
            {
                input.value = this.#value;
                this.#change += this.#value - oldValue;
            }
        }

        const event = new Event('change', {
            target: this,
        });
        this.dispatchEvent(event);
    }

    get value ()
    {
        return this.#value;
    }

    /**
     * @param {number}
    */
    set #change (value)
    {
        this.#changeValue = value;

        const change = this.querySelector('output');
        if (value === 0)
        {
            change.hidden = true;
        }
        else
        {
            change.hidden = false;
            change.textContent = `${value > 0 ? '+' : ''}${value}`;
        }

        clearTimeout(this.#changeTimeoutId);
        this.#changeTimeoutId = setTimeout(() => {
            this.#change = 0;
        }, LcLife.#CHANGE_VISIBLE_TIME_MS);
    }

    get #change ()
    {
        return this.#changeValue;
    }
}

customElements.define('lc-life', LcLife);
