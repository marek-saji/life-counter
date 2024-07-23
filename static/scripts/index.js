const players = new Map();
window.players = players;

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
            })),
    };
}

async function deserialiseGame (state)
{
    const playersState = Array.isArray(state) ? state : state.players;
    playersState.forEach((item) => {
        const player = players.get(item.id);
        const { playerElement } = player;

        playerElement.playerName = item.name;
        playerElement.playerLife = item.life;
        playerElement.playerColour = item.mainColour;

        player.name = item.name;
        player.life = item.life;
        player.mainColour =
            item.mainColour || player.mainColour;
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
        player.playerElement.playerLife = player.life;
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

async function handleChange (event)
{
    const playerElement = event.target.closest('lc-player');
    const playerId = playerElement.id;
    const data = players.get(playerId);

    const settings = Object.fromEntries(
        new FormData(event.target.form),
    );

    Object.assign(data, settings);
    await saveCurrentGame();
    await restoreCurrentGame();
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

    document.querySelectorAll('lc-player').forEach((playerElement) => {
        // TODO Remove
        const data = {
            playerElement,
            life: STARTING_LIFE,
            name: playerElement.playerName,
            mainColour: playerElement.playerColour,
        };
        players.set(playerElement.id, data);

        playerElement.addEventListener('change', handleChange);

        const nameInput = playerElement.querySelector('[name=name]');
        nameInput.addEventListener('focus', handlePossibleVirtualKeyboardVisibilityChange);
        nameInput.addEventListener('blur', handlePossibleVirtualKeyboardVisibilityChange);
        window.addEventListener('resize', handlePossibleVirtualKeyboardVisibilityChange);
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

        Array.from(players.values()).forEach(({ playerElement }) => {
            playerElement.querySelector('lc-settings').close();
        });
        drawPlayer();
        resetPlayers();

        saveCurrentGame();
    });

    // TODO Sync somewhere
}

main();
