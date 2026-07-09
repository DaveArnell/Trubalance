import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfWorker

export interface PdfTextItem {
  text: string
  x: number
  y: number
  width: number
  /** 1-based page index — PDF Y coords reset on every page. */
  page: number
}

const Y_TOLERANCE = 5

export async function extractPdfTextItems(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<PdfTextItem[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: buffer }).promise
  const items: PdfTextItem[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    onProgress?.(pageNum, pdf.numPages)
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    for (const raw of content.items) {
      if (!('str' in raw)) continue
      const text = String(raw.str ?? '').trim()
      if (!text) continue
      const transform = raw.transform as number[]
      items.push({
        text,
        x: transform[4] ?? 0,
        y: Math.round(transform[5] ?? 0),
        width: typeof raw.width === 'number' ? raw.width : 0,
        page: pageNum,
      })
    }
  }

  return items
}

function clusterPageItemsIntoRows(items: PdfTextItem[]): PdfTextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const rows: PdfTextItem[][] = []

  for (const item of sorted) {
    const last = rows[rows.length - 1]
    if (!last || Math.abs(last[0]!.y - item.y) > Y_TOLERANCE) {
      rows.push([item])
    } else {
      last.push(item)
    }
  }

  return rows.map((row) => row.sort((a, b) => a.x - b.x))
}

/** Cluster text items into visual rows, never merging across PDF pages. */
export function clusterPdfItemsIntoRows(items: PdfTextItem[]): PdfTextItem[][] {
  const byPage = new Map<number, PdfTextItem[]>()
  for (const item of items) {
    const page = item.page || 1
    const list = byPage.get(page) ?? []
    list.push(item)
    byPage.set(page, list)
  }

  const rows: PdfTextItem[][] = []
  for (const page of [...byPage.keys()].sort((a, b) => a - b)) {
    rows.push(...clusterPageItemsIntoRows(byPage.get(page)!))
  }
  return rows
}

export function rowText(row: PdfTextItem[]): string {
  return row
    .map((item) => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
