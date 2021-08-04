const API_KEY = '6fe92e578f939e3c7be9d37741ddb66af4c0cff263bf219439c6e947415355f6'

const tickersHandlers = new Map();

const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)

const aggregateIndex = '5'

socket.addEventListener("message", evt => {
    const {TYPE: type, FROMSYMBOL: currency, PRICE: newPrice} = JSON.parse(evt.data)
    if (type !== aggregateIndex || newPrice===undefined) {
        return
    }
    const handlers = tickersHandlers.get(currency) ?? []
    handlers.forEach(fn => fn(newPrice))

})

/*
const loadTickers = () => {
    if (tickersHandlers.size === 0) {
        return
    }
    fetch(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()]
            .join(",")}&tsyms=USD&api_key=${API_KEY}`
    ).then(r => r.json())
        .then(rawData => {
            console.log("-> tickersHandlers before", tickersHandlers);
            const updatedPrices = Object.fromEntries(
                Object.entries(rawData)
                    .map(([key, value]) => [key, value.USD])
            )
            Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
                const handlers = tickersHandlers.get(currency) ?? []
                handlers.forEach(fn => fn(newPrice))
            })
            console.log("-> tickersHandlers after", tickersHandlers);

        })

}
*/

function sendToWebSocket(massage) {
    const stringifiedMassage = JSON.stringify(massage)
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMassage)
        return
    }
    socket.addEventListener('open', () => {
        socket.send(stringifiedMassage)
    }, {once: true})
}

function subscribeToTickerOnWS(ticker) {
    sendToWebSocket({
        action: "SubAdd",
        subs: [`5~CCCAGG~${ticker}~USD`]
    })
}

function unSubscribeFromTickerOnWS(ticker) {
    sendToWebSocket({
        action: "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    })
}

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || []
    tickersHandlers.set(ticker, [...subscribers, cb])
    subscribeToTickerOnWS(ticker)
}

export const unSubscribeFromTicker = ticker => {
    tickersHandlers.delete(ticker)
    unSubscribeFromTickerOnWS(ticker)
}
