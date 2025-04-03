import './style.css'
import { getMarketableItems, loadItems } from './items'
import {
    updateCategories,
    getCategories,
    initCategories,
    renderCategories,
} from './categories'
import { loadDCs, loadWorlds, renderWorlds } from './worlds'
import fetchItemData, { MarketItem } from './requests'
import { initTable, renderTables, setTableData } from './table_display'

const eId = (id: string) => document.getElementById(id)
const universalis = 'https://universalis.app/api/v2/aggregated/'
var marketable_items: any[]

var categories: string[] = []
var items: any[] = []
var fitems: any[] = []
var itemresults: MarketItem[] = []

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

        return (item: MarketItem) => {
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
        return (item: MarketItem) => {
            const _item = fitems.find((i) => {
                return i.key === item.itemId
            }) // dogshit ahh, also doesnt work LOL
            return _item.Name.toLowerCase().includes(_name.toLowerCase())
        }
    },
}

function updateItems() {
    const fitems = items.filter((item) => {
        var cond = item_filters.every((filter) => filter(item))
        // if (!cond) {
        //     console.log(item)
        //     console.log(item.ItemSearchCategory, filters[0](item))
        //     console.log(item.key, filters[1](item))
        // }
        return cond
    })

    eId('n_fitems')!.innerText = String(fitems.length)
    return fitems
}

document.addEventListener('data_update', (e) => {
    eId('n_mitems')!.innerText = String(e.detail.length)
})

document.addEventListener('data_done', (e) => {
    itemresults = e.detail as MarketItem[]
})

function init() {
    getMarketableItems().then((data) => {
        marketable_items = data
    })

    loadWorlds().then((worlds) => {
        loadDCs().then((dcs) => {
            console.log(worlds)
            console.log(dcs)
            eId('world_list')!.innerHTML = renderWorlds(worlds, dcs)
        })
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
                    setTableData(
                        fitems.map((r, i) => {
                            return [
                                '24m',
                                '<a href="https://universalis.app/market/' + r.key + '">' + r.Name + '</a>',
                                'ROI' + i,
                                'Lowest Price World' + i,
                                'Home Server Price' + i,
                                'Average Home Server Price' + i,
                                'Volume per day' + i,
                                'Profit' + i,
                            ]
                        })
                    )
                })
        })

    eId('search_items')!.addEventListener('input', (e) => {
        const filters = []
        const name_filter = []
        const value = eId('search_items')!.value
        value.split(' ').forEach((v) => {
            if (v.includes(':')) {
                var args = v.split(':')
                if (args[0] in market_filters) {
                    filters.push(market_filters[args[0]](args[1], true))
                }
            } else {
                name_filter.push(v)
            }
        })
        if (name_filter.length > 0)
            filters.push(market_filters['name'](name_filter.join(' ')))
        console.log(filters)

        var ir = itemresults.filter((item) => {
            return filters.every((filter) => filter(item))
        })
        console.log(ir)
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
