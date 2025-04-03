var tbody: HTMLTableSectionElement;
const max_rows = 20
const row_els = []
export function initTable() {
    const parser = new DOMParser()
    const table = parser.parseFromString(`
    <table id="item_table" data-slice-start="0">
        <thead>
            <tr>
                <th><img src="history.svg" alt="Last updated"></th>
                <th>Name</th>
                <th>ROI</th>
                <th>Lowest Price World</th>
                <th>Home Server Price</th>
                <th>Average Home Server Price</th>
                <th>Volume per day</th>
                <th>Profit</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    </table>
`, 'text/html').body.firstChild as HTMLTableElement
    tbody = table.querySelector('tbody') as HTMLTableSectionElement

    for (let i = 0; i < max_rows; i++) {
        const row = document.createElement('tr')
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('td')
            cell.innerHTML = ''
            row.appendChild(cell)
        }
        tbody.appendChild(row)
        row_els.push(row)
    }

    table.addEventListener('wheel', e => {
        var slice_start = Number(table.getAttribute('data-slice-start'))
        var scroll_speed = e.shiftKey ? max_rows - 1 : 1
        slice_start = e.deltaY > 0 ? slice_start + scroll_speed : slice_start - scroll_speed
        if (slice_start < 0 || slice_start > data.length - max_rows) {
            return
        } 

        table.setAttribute('data-slice-start', slice_start.toString())

        renderTables({ start: slice_start, end: slice_start + max_rows })
        e.preventDefault()
    })

    table.querySelectorAll('th').forEach((th, i) => {
        th.addEventListener('click', e => {
            // TODO: add sorting logic
            renderTables()
        })
    })

    return table
}

// array of string arrays
// TODO: type ts
var data : string[][]
export function setTableData(_data) {
    data = _data
    renderTables()
}

export function renderTables(slice: { start: number, end: number } = { start: 0, end: max_rows }) {
    data.slice(slice.start, slice.end).forEach((item, i) => {
        for (let j = 0; j < item.length; j++) {
            row_els[i].children[j].innerHTML = item[j]
        }
    })
}
