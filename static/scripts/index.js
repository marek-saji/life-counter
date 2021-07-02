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
                name: data.nameInput.value,
                life: data.lifeInput.valueAsNumber,
            })),
    };
}

async function deserialiseGame (state)
{
    const playersState = Array.isArray(state) ? state : state.players;
    playersState.forEach((item) => {
        const player = players.get(item.id);
        player.nameInput.value = item.name;
        player.lifeInput.value = item.life;
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

function handleStepperClick (event)
{
    const stepper = event.target;
    const playerElement = stepper.closest('[data-player]');
    const player = players.get(playerElement.dataset.player);
    const step = parseInt(stepper.dataset.step, 10);

    player.lifeInput.valueAsNumber += step;

    const change =
        parseInt(player.messageElement.dataset.change || 0, 10) + step;
    player.messageElement.dataset.change = change;
    player.messageElement.hidden = false;
    player.messageElement.textContent = change > 0 ? `+${change}` : change;
    player.messageElement.dataset.incoming = 'true';
    // eslint-disable-next-line no-unused-expressions
    player.messageElement.offsetHeight;
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

    document.querySelectorAll('button[data-step]').forEach((stepper) => {
        const playerElement = stepper.closest('[data-player]');
        const data = {
            playerElement,
            lifeInput: playerElement.querySelector('input[data-component=life]'),
            nameInput: playerElement.querySelector('[data-component=name] input'),
            messageElement: playerElement.querySelector('[data-component=message]'),
            messageTimeoutId: null,
        };
        players.set(playerElement.dataset.player, data);

        stepper.addEventListener('focus', handleStepperFocus);
        stepper.addEventListener('click', handleStepperClick);
        // eslint-disable-next-line no-param-reassign
        stepper.hidden = false;
    });

    restoreCurrentGame();

    document.querySelector('button[type=reset]').addEventListener('click', async (event) => {
        event.preventDefault();

        const somePlayerDead = Array.from(players.values())
            .some((player) => player.lifeInput.valueAsNumber <= 0);
        if (somePlayerDead)
        {
            await pushGame();
        }

        players.forEach((player) => {
            // eslint-disable-next-line no-param-reassign
            player.lifeInput.valueAsNumber = STARTING_LIFE;
            // eslint-disable-next-line no-param-reassign
            player.messageElement.hidden = true;
            clearTimeout(player.lifeInput.messageTimeoutId);
        });
        drawPlayer();

        saveCurrentGame();
    });

    // TODO Click player name to edit it, but also change bg colour

    // TODO Sync somewhere
}

main();
