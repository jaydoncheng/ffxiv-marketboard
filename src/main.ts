import './style.css'
import { getMarketableItems, loadItems } from './items'
import {
    updateCategories,
    getCategories,
    initCategories,
    renderCategories,
} from './categories'
import { loadDCs, loadWorlds, renderWorlds, toWorldNames, World } from './worlds'
import fetchItemData, { calcItems, MarketItem, UniversalisItem } from './requests'
import { initTable, renderTables, setTableData } from './table_display'

const eId = (id: string) => document.getElementById(id)
var marketable_items: any[]

var categories: string[] = []
var items: any[] = []
var fitems: any[] = []
var uitems: UniversalisItem[] = []
var mitems: MarketItem[] = []
var worlds: {}

const item_filters = [
    (item) => {
        return categories.includes(item.ItemSearchCategory)
    },
    (item) => {
        return marketable_items.includes(Number(item.key))
    },
]

const cmp = (s) => {
    var comp = (lh, rh) => {
        return lh >= rh
    }
    switch (s) {
        case '>':
            comp = (lh, rh) => {
                return lh > rh
            }
            break
        case '<':
            comp = (lh, rh) => {
                return lh < rh
            }
            break
        case '=':
            comp = (lh, rh) => {
                return lh == rh
            }
            break
        default:
            break
    }
    return comp
}

const market_filters = {
    roi: (_roi: string, _hq: boolean) => {
        var comp = cmp(_roi.charAt(0))
        const _nroi = Number(_roi.substring(1))

        return (item: UniversalisItem) => {
            var i = _hq ? item.hq : item.nq
            if (
                i.minListing.world === undefined ||
                i.minListing.region === undefined
            )
                return false
            const roi =
                (i.minListing.world.price - i.minListing.region.price) /
                i.minListing.region.price
            return comp(roi * 100, _nroi)
        }
    },
    name: (_name: string) => {
        return (item: UniversalisItem) => {
            const _item = fitems.find((i) => {
                return i.key === item.itemId
            }) // dogshit ahh, also doesnt work LOL
            return _item.Name.toLowerCase().includes(_name.toLowerCase())
        }
    },
}

function updateItems() {
    const fitems = items.filter((item) => {
        return item_filters.every((filter) => filter(item))
    })

    eId('n_fitems')!.innerText = String(fitems.length)
    return fitems
}

document.addEventListener('data_update', (e) => {
    eId('n_mitems')!.innerText = String(e.detail.length)
})

document.addEventListener('data_done', (e) => {
    uitems = e.detail as UniversalisItem[]
    const world = eId('world_list')!.value
    mitems = calcItems(uitems, world)
    var table_data = mitems.map(item => {
        var name = fitems.find(i => i.key === `${item.hq.item_id}`)?.Name || 'Unknown Name'
        var world = world
        return [
            item.hq.last_updated,
            `<a href="https://universalis.app/market/${item.hq.item_id}">${name}</a>`,
            `${Math.round(item.hq.roi)}%`,
            `${item.hq.lowest_price.price} (${worlds[item.hq.lowest_price.worldId]})`,
            `${item.hq.home_lowest_price}`,
            `${item.hq.home_avg_sale_price}`,
            `${item.hq.volume_24h}`,
            `${item.hq.profit}`,
        ]
    })
    setTableData(table_data)
})

function init() {
    getMarketableItems().then((data) => {
        marketable_items = data
    })

    loadWorlds().then((_worlds) => {
        loadDCs().then((dcs) => {
            console.log(_worlds)
            console.log(dcs)
            eId('world_list')!.innerHTML = renderWorlds(_worlds, dcs)
        })
        worlds = toWorldNames(_worlds)
    })

    loadItems()
        .then((_items) => {
            eId('n_items')!.innerText = String(Object.keys(_items).length)
            items = _items
        })
        .then(() => {
            getCategories()
                .then((_categories) => {
                    eId('category_list')!.innerHTML =
                        renderCategories(_categories)
                    initCategories()
                    categories = updateCategories()
                })
                .then(() => {
                    fitems = updateItems()
                })
        })

    eId('search_items')!.addEventListener('input', (e) => {
        // const filters = []
        // const name_filter = []
        // const value = eId('search_items')!.value
        // value.split(' ').forEach((v) => {
        //     if (v.includes(':')) {
        //         var args = v.split(':')
        //         if (args[0] in market_filters) {
        //             filters.push(market_filters[args[0]](args[1], true))
        //         }
        //     } else {
        //         name_filter.push(v)
        //     }
        // })
        // if (name_filter.length > 0)
        //     filters.push(market_filters['name'](name_filter.join(' ')))
        // console.log(filters)
        //
        // var ir = uitems.filter((item) => {
        //     return filters.every((filter) => filter(item))
        // })
        // console.log(ir)
    })

    eId('view_categories')!.addEventListener('click', (e) => {
        eId('category_dialog')!.showModal()
    })

    eId('close_categories')!.addEventListener('click', (e) => {
        eId('category_dialog')!.close()
        var _categories = updateCategories()
        if (categories.length != _categories.length) {
            categories = _categories
            fitems = updateItems()
        }
    })

    eId('search')!.addEventListener('click', (e) => {
        const world = eId('world_list')!.value
        fetchItemData(fitems, Number(world) || 0)
    })

    eId('item_table_container')?.appendChild(initTable())
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div style="position: sticky; align-self: flex-start; top: 0; left: 0; font-size: 0.8em; color: gray;">
        <p style="padding: 0.4em; margin: 0">
              # of registered items: <span id="n_items">0</span> from XIVAPI<br>
              # of filtered items: <span id="n_fitems">0</span><br>
              # of loaded items: <span id="n_mitems">0</span> from Universalis<br>
        </p>
    </div>
    <h1>Marketboard</h1>
    <textarea type="text" id="search_items"></textarea><br>
    <div>
        <a id="view_categories">
            <button>categories</button>
        </a>
        <select id="world_list"></select>
        <a id="search">
            <button>search</button>
        </a>
    </div>
    <dialog id="category_dialog">
        <a id="close_categories" style="left: 0">
            <button>close</button>
        </a>
        <div id="category_list"></div>
    </dialog>
    <div id="item_table_container"></div>
`

init()
