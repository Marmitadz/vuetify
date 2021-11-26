import { computed, ref, watch } from 'vue'
import { defineComponent } from '@/util'
import { VDataTableHeaders } from './VDataTableHeaders'
import './VDataTable.sass'

import type { PropType } from 'vue'
import { VDataTableRows } from './VDataTableRows'

type DataTableHeader = {
  id: string
  name: string
  colspan?: number
  rowspan?: number
}

export type Column = {
  name: string
  id: string
  style: any
}

function isMultipleHeaders (arr: any): arr is DataTableHeader[][] {
  return arr.length > 0 && Array.isArray(arr[0])
}

const useHeaders = (props: { headers: DataTableHeader[] | DataTableHeader[][] }) => {
  const headerRows = ref<Column[][]>([])
  const rowColumns = ref<Column[]>([])

  watch(() => props.headers, () => {
    const rows = isMultipleHeaders(props.headers) ? props.headers : [props.headers]
    const width = Math.max(...rows.map(row => row.length))

    rowColumns.value = Array(width)

    const rowsWithStyle: Column[][] = []
    let rowStart = 1
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const columnsWithStyle: Column[] = []
      let colStart = 1

      for (let colIndex = 0; colIndex < rows[rowIndex].length; colIndex++) {
        const column = rows[rowIndex][colIndex]
        const colEnd = colStart + (column.colspan ?? 1)
        const rowEnd = rowStart + (column.rowspan ?? 1)

        const newColumn = {
          ...column,
          style: {
            'grid-area': `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`,
          },
        }

        columnsWithStyle.push(newColumn)

        if (newColumn.id) {
          rowColumns.value.splice(colStart - 1, 1, newColumn)
        }

        colStart = colEnd
      }

      if (columnsWithStyle.length < width) {
        columnsWithStyle.push(...Array(width - columnsWithStyle.length).fill({}))
      }

      rowsWithStyle.push(columnsWithStyle)

      rowStart += 1
    }

    headerRows.value = rowsWithStyle
  }, {
    immediate: true,
  })

  const tableGridStyles = computed(() => ({
    'grid-template-columns': rowColumns.value.map(col => 'minmax(150px, 1fr)').join(' '),
  }))

  return {
    tableGridStyles,
    rowColumns,
    headerRows,
  }
}

export const VDataTable = defineComponent({
  name: 'VDataTable',

  props: {
    headers: {
      type: Array as PropType<DataTableHeader[] | DataTableHeader[][]>,
      required: true,
    },
    items: {
      type: Array as PropType<any[]>,
      required: true,
    },
  },

  setup (props, { slots }) {
    const { rowColumns, headerRows, tableGridStyles } = useHeaders(props)

    return () => (
      <div class="v-data-table">
        <table class="v-data-table__table" style={tableGridStyles.value} role="table">
          <thead class="v-data-table__thead" role="rowgroup">
            <VDataTableHeaders rows={ headerRows.value } />
          </thead>
          <tbody class="v-data-table__tbody" role="rowgroup">
            <VDataTableRows columns={ rowColumns.value } items={ props.items } />
          </tbody>
        </table>
      </div>
    )
  },
})
