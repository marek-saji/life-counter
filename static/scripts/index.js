const players = new Map();

const STARTING_LIFE = 20;
// FIXME Hang longer for accessibility?
const MESSAGE_HANG_TIME_MS = 2000;

async function serialiseGame ()
{
    return {
        date: (new Date()).toISOString(),
        players: Array.from(players.entries())
            .map(([id, data]) => ({
                id,
                name: data.name,
                life: data.life,
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

        player.nameElement.textContent = player.name;
        player.lifeElement.textContent = player.life;
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
    const stepper = event.target;
    const playerElement = stepper.closest('[data-player]');
    const player = players.get(playerElement.dataset.player);
    const step = parseInt(stepper.dataset.step, 10);

    player.life += step;
    player.lifeElement.textContent = player.life;

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
        player.name = player.nameElement.textContent;
        player.messageElement.hidden = true;
        clearTimeout(player.messageTimeoutId);
        /* eslint-enable no-param-reassign */
    });
}

function drawPlayer ()
{
    const playerIds = Array.from(players.keys());
    const playerId =
        playerIds[Math.floor(Math.random() * playerIds.length)];
    const player = players.get(playerId);

    player.playerElement.dataset.chosen = 'true';
    setTimeout(() => { // FIXME Find a better way
        player.playerElement.dataset.chosen = 'false';
    }, 500);
}

async function requestScreenLock ()
{
    // TODO Polyfill for wekeLock
    if (document.visibilityState === 'visible')
    {
        await navigator.wakeLock.request('screen');
    }
}

async function main ()
{
    requestScreenLock();
    document.addEventListener('visibilitychange', requestScreenLock);

    if (window.location.hostname !== 'localhost' && !window.location.hostname.endsWith('.loca.lt'))
    {
        navigator.serviceWorker.register('./serviceWorker.js');
    }

    document.querySelectorAll('[data-player]').forEach((playerElement) => {
        const lifeElement = playerElement.querySelector('[data-component=life]');
        const nameElement = playerElement.querySelector('[data-component=name]');
        const messageElement = playerElement.querySelector('[data-component=message]');
        const data = {
            playerElement,
            life: STARTING_LIFE,
            name: nameElement.textContent,
            lifeElement,
            nameElement,
            messageElement,
            messageTimeoutId: null,
        };
        players.set(playerElement.dataset.player, data);

        playerElement.querySelectorAll('[data-step]').forEach((stepper) => {
            stepper.addEventListener('focus', handleStepperFocus);
            stepper.addEventListener('click', handleStepperClick);
            // eslint-disable-next-line no-param-reassign
            stepper.hidden = false;
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

        resetPlayers();
        drawPlayer();

        saveCurrentGame();
    });

    // TODO Click player name to edit it, but also change bg colour

    // TODO Sync somewhere
}

main();
