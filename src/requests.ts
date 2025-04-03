const universalis = 'https://universalis.app/api/v2/aggregated/'
var data: MarketItem[] = []
var chunks : any = []
var world: number = 0

type MinListing = {
    world?: {
        price: number,
        timestamp: number
    },
    dc?: {
        price: number,
        worldId: number
    },
    region?: {
        price: number,
        worldId: number
    }
}

type RecentPurchase = {
    world?: {
        price: number,
        timestamp: number
    },
    dc?: {
        price: number,
        timestamp: number,
        worldId: number
    },
    region?: {
        price: number,
        timestamp: number,
        worldId: number
    }
}

type AverageSalePrice = {
    world?: {
        price: number,
        timestamp: number
    },
    dc?: {
        price: number
    },
    region?: {
        price: number
    }
}

type DailySaleVelocity = {
    world?: {
        price: number,
        timestamp: number
    },
    dc?: {
        quantity: number
    },
    region?: {
        quantity: number
    }
}

export type MarketItem = {
    "itemId": number,
    "nq": {
        "minListing": MinListing,
        "recentPurchase": RecentPurchase,
        "averageSalePrice": AverageSalePrice,
        "dailySaleVelocity": DailySaleVelocity
    },
    "hq": {
        "minListing": MinListing,
        "recentPurchase": RecentPurchase,
        "averageSalePrice": AverageSalePrice,
        "dailySaleVelocity": DailySaleVelocity
    },
    "worldUploadTimes": {
        "worldId": number,
        "timestamp": number
    }[]
}



function constructUrl(world: number, keys: any[]) {
    var skeys = keys.join(',')
    return universalis + `${world}/${skeys}`
}

function requestChunks(chunk) {
    const url = constructUrl(
        world,
        chunk.map((item) => item.key)
    )

    return fetch(url, {method: 'GET', mode: 'cors'})
        .then((res) => res.json()).then((_data) => {
            data = data.concat(_data.results)
            document.dispatchEvent(new CustomEvent('data_update', { detail: data }))
        }).then(() => {
            if (chunks.length > 0) {
                return requestChunks(chunks.pop())
            }
        }).catch((err) => {
            console.log(err)
            chunks.push(chunk)
        })
}


export default function fetchItemData(items: any[], _world: number) {
    data = []
    world = _world
    const chunkSize = 100

    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize))
    }

    const n_threads = chunks.length > 8 ? 8 : chunks.length
    const threads = Array(n_threads).fill(0).map(() =>
        requestChunks(chunks.pop())
    )

    Promise.all(threads).then(() => {
        document.dispatchEvent(new CustomEvent('data_done', { detail: data }))
    })
}
