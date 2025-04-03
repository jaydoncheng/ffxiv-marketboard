export const filteredHeaders = "Name,FilterGroup,ItemUICategory,ItemSearchCategory,ItemSortCategory,StackSize,IsUnique,IsUntradable,CanBeHq"
var filteredHeadersArray = filteredHeaders.split(',')
var headers = {}

export function getHeaders() {
    return headers
}

// Returns a promise that resolves to an array of item ids
export function getMarketableItems() {
    return import('./game_data/marketable.json').then(data => {
        return data.default
    })
}

export function loadItems() {
    return import('./game_data/Item.csv').then(data => {
        var items_raw = data.default
        headers = items_raw[0]
        items_raw = items_raw.slice(3)

        var items : any[] = []
        items_raw.forEach((item) => {
            var i = {}
            Object.keys(headers).forEach((key) => {
                if (headers[key] == '#') {
                    i["key"] = item[key]
                    return
                }
                if (filteredHeadersArray.includes(headers[key])) {
                    i[headers[key]] = item[key]
                }
            })

            if (i["Name"] == "") {
                return
            }

            items.push(i)
        })

        return items
    })
}
