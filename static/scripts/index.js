const players = new Map()

const MESSAGE_HANG_TIME_MS = 2000; // FIXME Hang longer for accessibility?

function handleStepperClick (event)
{
    const stepper = event.target;
    const playerElement = stepper.closest('[data-player]')
    const player = players.get(playerElement.dataset.player)
    const step = parseInt(stepper.dataset.step)

    player.lifeInput.valueAsNumber += step;

    const change = parseInt(player.messageElement.dataset.change || 0) + step;
    player.messageElement.dataset.change = change;
    player.messageElement.hidden = false;
    player.messageElement.textContent = change > 0 ? `+${change}` : change;
    player.messageElement.dataset.incoming = 'true';
    player.messageElement.offsetHeight;
    player.messageElement.dataset.incoming = 'false';
    clearTimeout(player.messageTimeoutId);
    player.messageTimeoutId = setTimeout(
        () => {
            player.messageElement.dataset.change = 0;
            player.messageElement.hidden = true;
        },
        MESSAGE_HANG_TIME_MS
    )
}

function drawPlayer ()
{
    const playerIds = Array.from(players.keys());
    const playerId = playerIds[Math.floor(Math.random() * playerIds.length)];
    const player = players.get(playerId)

    player.playerElement.dataset.chosen = 'true';
    setTimeout(() => { // FIXME Find a better way
        player.playerElement.dataset.chosen = 'false';
    }, 500);
}

async function main ()
{
    await navigator.wakeLock.request('screen');

    if (window.location.hostname !== 'localhost' && !window.location.hostname.endsWith('.loca.lt')) {
        navigator.serviceWorker.register('./serviceWorker.js');
    }

    document.querySelectorAll('button[data-step]').forEach(stepper => {
        const playerElement = stepper.closest('[data-player]')
        const data = {
            playerElement,
            lifeInput: playerElement.querySelector('[data-component=life]'),
            messageElement: playerElement.querySelector('[data-component=message]'),
            messageTimeoutId: null,
        };
        players.set(playerElement.dataset.player, data);

        stepper.addEventListener('click', handleStepperClick);
        stepper.hidden = false;
    })

    document.querySelector('button[type=reset]').addEventListener('click', () => {
        players.forEach(player => {
            player.lifeInput.valueAsNumber = 0;
            player.messageElement.hidden = true;
            clearTimeout(player.lifeInput.messageTimeoutId);
        });
        drawPlayer();
    })

    // TODO Click player name to edit it, but also change bg colour

    // TODO Sync somewhere
}

main();
