export type Category = {
    "key": string,
    "Name": string,
    "Category": string,
    "Order": string,
    "ClassJob": string,
    "Icon": string
}

const customMappings = {
    "3": { "Name": "Items" }
}

var hiddenCategories = []

export function getCategories() {
    return import('./game_data/ItemSearchCategory.csv').then((data) => {
        var categories_raw = data.default
        const headers: any[] = categories_raw[0]
        categories_raw = categories_raw.slice(3)

        var categories: Category[] = []
        categories_raw.forEach((category) => {
            var cat = {} as Category
            Object.keys(headers).forEach((key: any, i) => {
                const value = headers[key]
                if (value == '#') {
                    cat["key"] = category["key"]
                    return
                }

                cat[value] = category[i]
            })

            if (cat["key"] in customMappings) {
                cat = { ...cat, ...customMappings[cat["key"]] }
            }
            categories.push(cat)
        })

        return categories
    })
}

export function getCategoryName(id: string, categories: Category[]) {

    const c = categories.find((cat) => cat.key == id)
    if (c == undefined) {
        console.warn(`Category ${id} not found in categories`)
        return "Unknown Category"
    }
    if (id in hiddenCategories) {
        console.warn(`Category ${id} is hidden`)
        return "Hidden Category"
    }
    return c.Name
}

export function renderCategories(categories: Category[]) {
    const parser = new DOMParser()
    var html = document.createElement('div')
    var parent_categories = []
    categories.forEach((cat) => {
        if (cat.Category == '0') {
            var parent = parser.parseFromString(`
                <div data-id="${cat.key}" data-parent-category="${cat.Category}" data-active="1" class="category super">
                    <span class="category-text">${cat.Name}</span></div>`, "text/html").body.firstChild
            html.appendChild(parent)
            parent_categories.push({ key: cat.key, parent: parent })
        } else {
            const parent = parent_categories.find((p) => p.key == cat.Category)
            var child = parser.parseFromString(`
                <div data-id="${cat.key}" data-parent-category="${cat.Category}" data-active="1" class="category">
                    <span class="category-text">${cat.Name}</span></div>`, "text/html").body.firstChild
            parent.parent.appendChild(child)
        }
    })

    // Remove categories which have no children
    html.querySelectorAll('div[data-parent-category="0"]').forEach((element) => {
        if (element.children.length <= 1) {
            element.remove()
        }
    })

    return html.innerHTML
}

var mouseDown = false
export function initCategories() {
    const toggle = (element: any) => {
        element.setAttribute('data-active', element.getAttribute('data-active') == '0' ? '1' : '0')
        if (element.classList.contains('super')) {
            element.querySelectorAll('.category').forEach((child) => {
                child.setAttribute('data-active', element.getAttribute('data-active'))
            })
        }
    }

    document.querySelectorAll('.category-text').forEach((element) => {
        const parent = element.parentElement
        element.addEventListener('mouseover', (event) => {
            if (mouseDown) {
                toggle(parent)
            }
        })


        element.addEventListener('click', (event) => {
            toggle(parent)

            event.stopPropagation()
        })
    })

    document.addEventListener('mousedown', (event) => {
        mouseDown = true
    })
    document.addEventListener('mouseup', (event) => {
        mouseDown = false
    })
}

export function updateCategories() {
    var activeCategories : any[] = []
    document.querySelectorAll('.category[data-active="1"]').forEach((element) => {
        activeCategories.push(element.getAttribute('data-id'))
    })

    return activeCategories
}
