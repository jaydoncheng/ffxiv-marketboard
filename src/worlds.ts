export type World = {
    key: string
    InternalName: string
    Name: string
    Region: string
    UserType: string
    DataCenter: string
    IsPublic: 'True' | 'False'
}

export type DC = {
    key: string
    Name: string
    Region: string
    '': string
}

export function loadDCs() {
    // DC region field should be moved one to the right
    return import('./game_data/WorldDCGroupType.csv').then((data) => {
        var raw = data.default
        const headers = raw[0]
        raw = raw.slice(3)

        var dcs: any[] = []
        raw.forEach((dc) => {
            var i = {}
            Object.keys(headers).forEach((key) => {
                if (headers[key] == '#') {
                    i['key'] = dc[key]
                    return
                }

                i[headers[key]] = dc[key]
            })
            dcs.push(i)
        })

        return dcs
    })
}
export function loadWorlds() {
    return import('./game_data/World.csv').then((data) => {
        var raw = data.default
        const headers = raw[0]
        raw = raw.slice(3)

        var worlds: any[] = []
        raw.forEach((world: any) => {
            var i = {}
            Object.keys(headers).forEach((key) => {
                if (headers[key] == '#') {
                    i['key'] = world[key]
                    return
                }

                i[headers[key]] = world[key]
            })
            worlds.push(i)
        })

        worlds = worlds.filter((world) => {
            return world.IsPublic === 'True'
        })

        return worlds
    })
}

export function toWorldNames(worlds: World[]) {
    var r = {}
    worlds.forEach((world) => {
        r[world.key] = world.Name
    })
    return r
}

export function getWorldName(id: string, worlds: World[]) {
    return worlds.find(w => w.key === id)?.Name || 'Unknown World'
}

const regionMap = {
    "1": "Japan",
    "2": "North-America",
    "3": "Europe",
    "4": "Oceania",
}

export function renderWorlds(worlds: World[], dcs: DC[]) {
    const parser = new DOMParser()
    var html = document.createElement('div')
    var regions = {}
    dcs.forEach((dc) => {
        var reg
        if (dc.Region in regions) {
            reg = regions[dc.Region]

        } else {
            var div = parser.parseFromString(
                `<optgroup data-region-id="${dc.Region}" class="region" label="${regionMap[dc.Region]}"></optgroup>`,
                'text/html'
            ).body.firstChild
            html.appendChild(div)
            regions[dc.Region] = reg = div
        }

        var div = parser.parseFromString(
            `<optgroup data-dc-id="${dc.key}" data-region-id="${dc.Region}" data-active="0" class="datacenter" label="${dc.Name}"></optgroup>`,
            'text/html'
        ).body.firstChild
        reg.appendChild(div)
    })
    worlds.forEach((w) => {
        var div = parser.parseFromString(
            `<option data-world-id="${w.key}" data-active="0" class="world" value="${w.key}">${w.Name}</option>`,
            'text/html'
        ).body.firstChild
        html.querySelector(`[data-dc-id="${w.DataCenter}"]`)?.appendChild(div)
    })

    html.querySelectorAll('optgroup[data-dc-id]').forEach((dc) => {
        if (dc.children.length <= 1) {
            dc.remove()
        }
    })
    html.querySelector('optgroup[data-dc-id="13"]').remove() // Remove "NA Cloud DC"

    html.querySelectorAll('optgroup[data-region-id]').forEach((dc) => {
        if (dc.children.length <= 1) {
            dc.remove()
        }
    })


    return html.innerHTML
}
