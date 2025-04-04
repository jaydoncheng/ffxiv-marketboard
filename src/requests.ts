const universalis = 'https://universalis.app/api/v2/aggregated/'
var data: UniversalisItem[] = []
var chunks: any = []
var world: number = 0

type MinListing = {
    world?: {
        price: number
        timestamp: number
    }
    dc?: {
        price: number
        worldId: number
    }
    region?: {
        price: number
        worldId: number
    }
}

type RecentPurchase = {
    world?: {
        price: number
        timestamp: number
    }
    dc?: {
        price: number
        timestamp: number
        worldId: number
    }
    region?: {
        price: number
        timestamp: number
        worldId: number
    }
}

type AverageSalePrice = {
    world?: {
        price: number
        timestamp: number
    }
    dc?: {
        price: number
    }
    region?: {
        price: number
    }
}

type DailySaleVelocity = {
    world?: {
        quantity: number
    }
    dc?: {
        quantity: number
    }
    region?: {
        quantity: number
    }
}

type Quality = {
    minListing: MinListing
    recentPurchase: RecentPurchase
    averageSalePrice: AverageSalePrice
    dailySaleVelocity: DailySaleVelocity
}

export type UniversalisItem = {
    itemId: number
    nq?: Quality,
    hq?: Quality,
    worldUploadTimes?: {
        worldId: number
        timestamp: number
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

    return fetch(url, { method: 'GET', mode: 'cors' })
        .then((res) => res.json())
        .then((_data) => {
            data = data.concat(_data.results)
            document.dispatchEvent(
                new CustomEvent('data_update', { detail: data })
            )
        })
        .then(() => {
            if (chunks.length > 0) {
                return requestChunks(chunks.pop())
            }
        })
        .catch((err) => {
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
    const threads = Array(n_threads)
        .fill(0)
        .map(() => requestChunks(chunks.pop()))

    Promise.all(threads).then(() => {
        document.dispatchEvent(new CustomEvent('data_done', { detail: data }))
    })
}

export type MarketQualityItem = {
    item_id: number
    last_updated: number
    roi: number
    profit: number
    home_lowest_price: number
    home_avg_sale_price: number
    lowest_price: { price: number; worldId: number }
    volume_24h: number
}

export type MarketItem = {
    hq: MarketQualityItem,
    nq: MarketQualityItem
}
// fields: roi,

export function calcItem(item: UniversalisItem, world : number) {
    const r = {
        hq: {
            item_id: item.itemId,
            last_updated: Date.now(),
            roi: Infinity,
            profit: Infinity,
            home_lowest_price: Infinity,
            home_avg_sale_price: NaN,
            lowest_price: { price: 0, worldId: 0 },
            volume_24h: 0,
        },
        nq: {
            item_id: item.itemId,
            last_updated: Date.now(),
            roi: Infinity,
            profit: Infinity,
            home_lowest_price: Infinity,
            home_avg_sale_price: NaN,
            lowest_price: { price: 0, worldId: 0 },
            volume_24h: NaN,
        },
    }

    const tm = (seconds) => {
        return new Date(seconds * 1000).toISOString().substring(11, 19)
    }

    const f = (q: Quality, t: "hq" | "nq") => {
        if (q.minListing.world && q.minListing.region) {
            r[t].profit = q.minListing.world.price - q.minListing.region.price
            r[t].roi = (r[t].profit / q.minListing.region.price) * 100
            r[t].home_lowest_price = q.minListing.world.price
            r[t].lowest_price = { 
                price: q.minListing.region.price,
                worldId: q.minListing.region.worldId,
            }
            if (item.worldUploadTimes) {
                var v = item.worldUploadTimes.find((w) => {
                    return w.worldId === world
                }) || { timestamp: NaN }
                r[t] = tm(Date.now() - v.timestamp)
            }
        }
        if (q.averageSalePrice.world) {
            r[t].home_avg_sale_price = Math.round(q.averageSalePrice.world.price * 100) / 100
        }
        if (q.dailySaleVelocity.world) {
            r[t].volume_24h = Math.round(q.dailySaleVelocity.world.quantity * 100) / 100
        }
    }

    if (item.nq) {
        f(item.nq, 'nq')
    }
    if (item.hq) {
        f(item.hq, 'hq')
    }
    return r
}

export function calcItems(items: UniversalisItem[], world) : MarketItem[] {
    return items.map((item) => {
        return calcItem(item, world)
    })
}
