const players = new Map();

const STARTING_LIFE = 20;

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
        player.lifeElement.value = player.life;
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

function resetPlayers ()
{
    players.forEach((player) => {
        /* eslint-disable no-param-reassign */
        player.life = STARTING_LIFE;
        player.lifeElement.value = player.life;
        player.playerElement.dataset.dead = 'false';
        player.name = player.nameElement.textContent;
        clearTimeout(player.messageTimeoutId);
        /* eslint-enable no-param-reassign */
    });
}

function drawPlayer ()
{
    const deadPlayers = Array.from(players.values())
        .filter((player) => player.life <= 0);
    const candidates =
        deadPlayers.length
            ? deadPlayers
            : Array.from(players.values());
    const chosenPlayer =
        candidates[Math.floor(Math.random() * candidates.length)];

    players.values().forEach(({ playerElement }) => {
        playerElement.removeAttribute('lc-chosen');
    });

    // force layout redraw
    chosenPlayer.playerElement.getBoundingClientRect();

    chosenPlayer.playerElement.setAttribute('lc-chosen', 'true');
}

function toggleSettings (playerId, visible)
{
    const {
        nameElement,
        lifeElement,
        settingsElement,
        settingsButton,
    } = players.get(playerId);

    // TODO document.startViewTransition
    nameElement.parentNode.hidden = visible;
    lifeElement.hidden = visible;
    if (visible)
    {
        settingsElement.show();
        settingsElement.focus();
    }
    else
    {
        settingsElement.close();
    }
    settingsButton.setAttribute('aria-selected', visible ? 'true' : 'false');
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

function handleSettingsToggle (event)
{
    event.preventDefault();

    const playerElement = event.target.closest('[data-player]');
    const playerId = playerElement.dataset.player;
    const { settingsElement } = players.get(playerId);

    if (settingsElement.open)
    {
        handleSettingsHide(event);
    }
    else
    {
        handleSettingsShow(event);
    }
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
function handlePossibleVirtualKeyboardVisibilityChange (_event)
{
    if (
        !window.matchMedia?.('(display-mode: fullscreen)').matches
        || !window?.navigator?.userAgentData.brands.some((b) => b.brand === 'Chromium')
        || window?.navigator?.userAgentData?.mobile !== true
    )
    {
        return;
    }

    let workaroundNeeded = false;

    const { activeElement } = document;
    if (activeElement?.tagName === 'INPUT' && activeElement?.type === 'text')
    {
        workaroundNeeded = true;
    }

    if (workaroundNeeded)
    {
        document.documentElement.setAttribute('data-need-chromium-704070-workaround', 'true');
    }
    else
    {
        document.documentElement.removeAttribute('data-need-chromium-704070-workaround');
    }
}

function handleMainColourChange (event)
{
    const playerElement = event.target.closest('[data-player]');
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
    playerElement.dataset.secondaryColour = event.target.value;
}

async function requestNativeScreenLock ()
{
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
        try
        {
            await noSleep.enable();
        }
        catch (error)
        {
            globalMessageElement.textContent = 'Tap to keep the screen awake';
            globalMessageElement.hidden = false;

            document.addEventListener('click', async function requestScreenLockOnce () {
                document.removeEventListener('click', requestScreenLockOnce);
                await noSleep.enable();
                globalMessageElement.dataset.outgoing = 'true';
                globalMessageElement.addEventListener('transitionend', () => {
                    globalMessageElement.hidden = true;
                });
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
        const lifeElement = playerElement.querySelector('lc-life');
        const settingsElement = playerElement.querySelector('[data-component=settings]');
        const settingsForm = settingsElement.querySelector('form');
        const settingsButton = playerElement.querySelector('[data-component=settings-button]');
        const data = {
            playerElement,
            life: STARTING_LIFE,
            name: nameElement.textContent,
            lifeElement,
            nameElement,
            messageTimeoutId: null,
            settingsElement,
            settingsForm,
            settingsButton,
            mainColour: playerElement.dataset.mainColour,
            secondaryColour: playerElement.dataset.secondaryColour,
        };
        players.set(playerElement.dataset.player, data);

        settingsButton
            .addEventListener('click', handleSettingsToggle);

        lifeElement.addEventListener('change', ({ target: { value } }) => {
            data.life = value;
            // eslint-disable-next-line no-param-reassign
            playerElement.dataset.dead = value <= 0 ? 'true' : 'false';
            saveCurrentGame();
        });

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

        Array.from(players.keys()).forEach((playerId) => {
            toggleSettings(playerId, false);
        });
        drawPlayer();
        resetPlayers();

        saveCurrentGame();
    });

    // TODO Sync somewhere
}

main();
