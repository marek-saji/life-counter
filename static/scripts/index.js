const players = new Map();

const STARTING_LIFE = 20;
// FIXME Hang longer for accessibility?
const MESSAGE_HANG_TIME_MS = 2000;

const globalMessageElement = document.querySelector('[data-component=global-message]');

async function serialiseGame ()
{
    return {
        date: (new Date()).toISOString(),
        players: Array.from(players.entries())
            .map(([id, data]) => ({
                id,
                name: data.name,
                life: data.life,
                mainColour: data.mainColour,
                secondaryColour: data.secondaryColour || undefined,
            })),
    };
}

async function deserialiseGame (state)
{
    const playersState = Array.isArray(state) ? state : state.players;
    playersState.forEach((item) => {
        const player = players.get(item.id);
        player.name = item.name;
        player.life = item.life;
        player.mainColour =
            item.mainColour || player.mainColour;
        player.secondaryColour =
            item.secondaryColour || player.secondaryColour;

        player.nameElement.textContent = player.name;
        player.lifeElement.textContent = player.life;
        player.playerElement.dataset.dead = player.life <= 0 ? 'true' : 'false';
        player.playerElement.dataset.mainColour = player.mainColour;
        player.playerElement.dataset.secondaryColour =
            player.secondaryColour;
    });
}

async function getItem (name, fallback = null)
{
    const jsonValue = localStorage.getItem(name);
    if (jsonValue !== null)
    {
        try
        {
            return JSON.parse(jsonValue);
        }
        catch (error)
        {
            // Ignore errors
        }
    }
    return fallback;
}

async function setItem (name, value)
{
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(name, jsonValue);
}

async function saveCurrentGame ()
{
    const state = await serialiseGame();
    await setItem('current', state);
}

async function restoreCurrentGame ()
{
    const state = await getItem('current');
    if (state)
    {
        deserialiseGame(state);
    }
}

async function pushGame ()
{
    const state = await serialiseGame();
    const history = await getItem('history', []);
    history.push(state);
    setItem('history', history);
}

function forceRepaint (element)
{
    // eslint-disable-next-line no-unused-expressions
    element.offsetHeight;
}

function handleStepperClick (event)
{
    event.preventDefault();

    const stepper = event.target;
    const playerElement = stepper.closest('[data-player]');
    const player = players.get(playerElement.dataset.player);
    const step = parseInt(stepper.dataset.step, 10);

    player.life += step;
    player.lifeElement.textContent = player.life;

    playerElement.dataset.dead = player.life <= 0 ? 'true' : 'false';

    const change =
        parseInt(player.messageElement.dataset.change || 0, 10) + step;
    player.messageElement.dataset.change = change;
    player.messageElement.hidden = false;
    player.messageElement.textContent = change > 0 ? `+${change}` : change;
    player.messageElement.dataset.incoming = 'true';
    forceRepaint(player.messageElement);
    player.messageElement.dataset.incoming = 'false';
    clearTimeout(player.messageTimeoutId);
    player.messageTimeoutId = setTimeout(
        () => {
            player.messageElement.dataset.change = 0;
            player.messageElement.hidden = true;
        },
        MESSAGE_HANG_TIME_MS,
    );

    saveCurrentGame();
}

function handleStepperFocus (event)
{
    const stepper = event.target;
    const playerElement = stepper.closest('[data-player]');

    playerElement.dataset.buttonFocusWithin = 'true';
    stepper.addEventListener('blur', () => {
        delete playerElement.dataset.buttonFocusWithin;
    }, { once: true });
}

function resetPlayers ()
{
    players.forEach((player) => {
        /* eslint-disable no-param-reassign */
        player.life = STARTING_LIFE;
        player.lifeElement.textContent = player.life;
        player.playerElement.dataset.dead = 'false';
        player.name = player.nameElement.textContent;
        player.messageElement.hidden = true;
        player.messageElement.dataset.change = '0';
        clearTimeout(player.messageTimeoutId);
        /* eslint-enable no-param-reassign */
    });
}

function drawPlayer ()
{
    const deadPlayersIds = Array.from(players.entries())
        .filter(([, player]) => player.life <= 0)
        .map(([id]) => id);
    const playerIds =
        deadPlayersIds.length
            ? deadPlayersIds
            : Array.from(players.keys());
    const playerId =
        playerIds[Math.floor(Math.random() * playerIds.length)];
    const player = players.get(playerId);

    player.playerElement.dataset.chosen = 'true';
    setTimeout(() => { // FIXME Find a better way
        player.playerElement.dataset.chosen = 'false';
    }, 500);
}

function toggleSettings (playerId, visible)
{
    const {
        nameElement,
        lifeElement,
        settingsElement,
        settingsButton,
    } = players.get(playerId);

    nameElement.parentNode.hidden = visible;
    lifeElement.parentNode.hidden = visible;
    settingsElement.hidden = !visible;
    settingsButton.setAttribute('aria-selected', visible ? 'true' : 'false')
}

function handleSettingsToggle (event)
{
    event.preventDefault();

    const playerElement = event.target.closest('[data-player]');
    const playerId = playerElement.dataset.player;
    const { settingsElement } = players.get(playerId);

    if (settingsElement.hidden)
    {
        handleSettingsShow(event);
    }
    else
    {
        handleSettingsHide(event);
    }
}

function handleSettingsShow (event)
{
    event.preventDefault();

    const playerElement = event.target.closest('[data-player]');
    const playerId = playerElement.dataset.player;
    const { settingsElement } = players.get(playerId);

    const data = players.get(playerId);

    settingsElement.querySelector('[name=name]').value = data.name;

    const mainColourCheckobox =
        Array.from(settingsElement.querySelectorAll('[name=mainColour]'))
            .find((ch) => ch.value === data.mainColour);
    if (mainColourCheckobox)
    {
        mainColourCheckobox.checked = true;
    }

    const secondaryColourCheckbox =
        Array.from(settingsElement.querySelectorAll('[name=secondaryColour]'))
            .find((ch) => ch.value === data.secondaryColour);
    if (secondaryColourCheckbox)
    {
        secondaryColourCheckbox.checked = true;
    }

    toggleSettings(playerId, true);
}

function handleSettingsHide (event)
{
    event.preventDefault();

    const playerElement = event.target.closest('[data-player]');
    const playerId = playerElement.dataset.player;
    const data = players.get(playerId);
    const { settingsForm } = data;

    const settings = Object.fromEntries(new FormData(settingsForm));
    Object.assign(data, settings);
    saveCurrentGame();

    toggleSettings(playerId, false);
}

function handleNameChange (event)
{
    const playerElement = event.target.closest('[data-player]');
    const playerId = playerElement.dataset.player;
    const { nameElement } = players.get(playerId);

    const nameInput = event.target;

    if (!nameInput.value)
    {
        nameInput.value = nameInput.getAttribute('value');
    }

    nameElement.textContent = nameInput.value;
}

// TODO Remove once https://bugs.chromium.org/p/chromium/issues/detail?id=704070 is fixed
function handlePossibleVirtualKeyboardVisibilityChange (event)
{
    if (
        !window.matchMedia?.('(display-mode: fullscreen)').matches
        || !window?.navigator?.userAgentData.brands.some((b) => b.brand === 'Chromium')
        || window?.navigator?.userAgentData?.mobile !== true
    )
    {
        return;
    }

    let workaroundNeeded = false

    const { activeElement } = document
    if (activeElement?.tagName === 'INPUT' && activeElement?.type === 'text')
    {
        workaroundNeeded = true
    }

    if (workaroundNeeded)
    {
        document.documentElement.setAttribute('data-need-chromium-704070-workaround', 'true')
    }
    else
    {
        document.documentElement.removeAttribute('data-need-chromium-704070-workaround')
    }
}

function handleMainColourChange (event)
{
    const playerElement = event.target.closest('[data-player]');
    // eslint-disable-next-line no-param-reassign
    playerElement.dataset.mainColour = event.target.value;

    if (playerElement.dataset.player === '2')
    {
        document.querySelector('meta[name=theme-color]')
            .setAttribute('content', event.target.value);
    }
}

function handleSecondaryColourChange (event)
{
    const playerElement = event.target.closest('[data-player]');
    // eslint-disable-next-line no-param-reassign
    playerElement.dataset.secondaryColour = event.target.value;
}

async function requestNativeScreenLock () {
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible')
        {
            await navigator.wakeLock.request('screen');
        }
    });

    await navigator.wakeLock.request('screen');
}

function loadScript (src)
{
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.onload = resolve;
        script.onerror = reject;
        script.crossOrigin = 'anonymous';
        script.src = src;
        document.head.appendChild(script);
    });
}

async function requestPolyfilledScreenLock ()
{
    const looksMobile = window.matchMedia?.('(hover: none)').matches;

    if (looksMobile)
    {
        await loadScript('https://unpkg.com/nosleep.js');

        const noSleep = new window.NoSleep();
        // NoSleep plays an invisible video to keep the screen awake. In
        // most browsers playing video requires user interaction, so
        // first .enable() will most probably fail.
        try {
            await noSleep.enable();
        } catch (error) {
            globalMessageElement.textContent =  `Tap to keep the screen awake`;
            globalMessageElement.hidden = false;

            document.addEventListener('click', async function requestScreenLockOnce () {
                document.removeEventListener('click', requestScreenLockOnce);
                await noSleep.enable();
                globalMessageElement.dataset.outgoing = 'true';
                globalMessageElement.addEventListener('transitionend', () => {
                    globalMessageElement.hidden = true;
                })
            });
        }
    }
}

async function requestScreenLock ()
{
    if ('wakeLock' in navigator)
    {
        requestNativeScreenLock();
    }
    else
    {
        requestPolyfilledScreenLock();
    }
}

async function main ()
{
    await requestScreenLock();

    if (window.location.hostname !== 'localhost' && !window.location.hostname.endsWith('.loca.lt'))
    {
        navigator.serviceWorker.register('./serviceWorker.js');
    }

    document.querySelectorAll('[data-player]').forEach((playerElement) => {
        const nameElement = playerElement.querySelector('[data-component=name]');
        const lifeElement = playerElement.querySelector('[data-component=life]');
        const messageElement = playerElement.querySelector('[data-component=message]');
        const settingsElement = playerElement.querySelector('[data-component=settings]');
        const settingsForm = settingsElement.querySelector('form');
        const settingsButton = playerElement.querySelector('[data-component=settings-button]');
        const data = {
            playerElement,
            life: STARTING_LIFE,
            name: nameElement.textContent,
            lifeElement,
            nameElement,
            messageElement,
            messageTimeoutId: null,
            settingsElement,
            settingsForm,
            settingsButton,
            mainColour: playerElement.dataset.mainColour,
            secondaryColour: playerElement.dataset.secondaryColour,
        };
        players.set(playerElement.dataset.player, data);

        playerElement.querySelectorAll('[data-step]').forEach((stepper) => {
            stepper.addEventListener('focus', handleStepperFocus);
            stepper.addEventListener('click', handleStepperClick);
            // eslint-disable-next-line no-param-reassign
            stepper.hidden = false;
        });

        settingsButton
            .addEventListener('click', handleSettingsToggle);

        const nameInput = playerElement.querySelector('[name=name]');
        nameInput.addEventListener('change', handleNameChange);
        nameInput.addEventListener('focus', handlePossibleVirtualKeyboardVisibilityChange);
        nameInput.addEventListener('blur', handlePossibleVirtualKeyboardVisibilityChange);
        window.addEventListener('resize', handlePossibleVirtualKeyboardVisibilityChange);
        playerElement.querySelectorAll('[name=mainColour]').forEach((mainColourElement) => {
            mainColourElement
                .addEventListener('change', handleMainColourChange);
        });
        playerElement.querySelectorAll('[name=secondaryColour]').forEach((secondaryColourElement) => {
            secondaryColourElement
                .addEventListener('change', handleSecondaryColourChange);
        });
    });

    restoreCurrentGame();

    document.querySelector('button[type=reset]').addEventListener('click', async (event) => {
        event.preventDefault();

        const somePlayerDead = Array.from(players.values())
            .some((player) => player.life <= 0);
        if (somePlayerDead)
        {
            await pushGame();
        }

        drawPlayer();
        resetPlayers();

        saveCurrentGame();
    });

    // TODO Sync somewhere
}

main();
