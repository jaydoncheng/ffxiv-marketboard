
const max_rows = 10
export function initTable() {
    const parser = new DOMParser()
    const table = parser.parseFromString(`
        <table id="item_table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>World</th>
                </tr>
            </thead>
            <tbody id="item_table_body">
            </tbody>
        </table>
`, 'text/html').body.firstChild as HTMLTableElement
    const tbody = table.querySelector('tbody') as HTMLTableSectionElement





}
