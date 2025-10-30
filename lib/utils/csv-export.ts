/**
 * Utility functions for CSV export functionality
 */

export interface CSVExportOptions {
  filename?: string
  headers?: string[]
  datePrefix?: boolean
}

/**
 * Converts an array of objects to CSV format
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: CSVExportOptions = {}
): string {
  if (data.length === 0) {
    return ''
  }

  const { headers } = options
  const keys = headers || Object.keys(data[0])
  
  // Create CSV headers
  const csvHeaders = keys.map(key => `"${key}"`).join(',')
  
  // Create CSV rows
  const csvRows = data.map(item => 
    keys.map(key => {
      const value = item[key]
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return '""'
      }
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}

/**
 * Downloads data as CSV file
 */
export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  options: CSVExportOptions = {}
): void {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  const { filename = 'export', datePrefix = true } = options
  const csvContent = arrayToCSV(data, options)
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    const finalFilename = datePrefix 
      ? `${filename}-${new Date().toISOString().split('T')[0]}.csv`
      : `${filename}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', finalFilename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL object
    URL.revokeObjectURL(url)
  }
}

/**
 * Formats order data for CSV export with proper headers
 */
export function formatOrdersForCSV(orders: { id: string; customer: string; category: string; date: string; source: string; geo: string }[]): Record<string, string>[] {
  return orders.map(order => ({
    'Order ID': order.id,
    'Customer': order.customer,
    'Category': order.category,
    'Date': order.date,
    'Source': order.source,
    'Location': order.geo
  }))
}