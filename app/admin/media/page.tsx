'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, Copy, Check, Trash2, RefreshCw } from 'lucide-react'
import { useToastStore } from '@/lib/store'

export default function AdminMediaPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/media')
      const data = await res.json()
      setFiles(Array.isArray(data) ? data : [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? [])
    if (!selectedFiles.length) return
    setUploading(true)
    let successCount = 0
    for (const file of selectedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'product-images')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (res.ok) successCount++
      else { const e = await res.json().catch(() => ({})); addToast(e.error ?? `Failed to upload ${file.name}`, 'error') }
    }
    setUploading(false)
    if (successCount > 0) addToast(`${successCount} file(s) uploaded`, 'success')
    load()
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    addToast('URL copied!', 'success')
    setTimeout(() => setCopied(null), 2000)
  }

  const deleteFile = async (name: string) => {
    if (!confirm('Delete this file?')) return
    const res = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.name !== name))
      addToast('File deleted', 'success')
    }
  }

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Media Library</h1>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
      ) : !files.length ? (
        <div className="text-center py-20 text-gray-400">
          <Upload size={32} className="mx-auto mb-3 opacity-50" />
          <p>No files yet. Upload some images.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {files.map((file) => (
            <div key={file.name} className="group relative bg-gray-50 border border-gray-100 overflow-hidden">
              {isImage(file.name) ? (
                <div className="aspect-square relative">
                  <Image src={file.url} alt={file.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center text-gray-400 text-xs p-2 text-center">{file.name}</div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                <button onClick={() => copyUrl(file.url)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded text-white transition-colors">
                  {copied === file.url ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button onClick={() => deleteFile(file.name)} className="p-1.5 bg-white/20 hover:bg-red-500 rounded text-white transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-[9px] text-gray-400 px-1.5 py-1 truncate">{file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
