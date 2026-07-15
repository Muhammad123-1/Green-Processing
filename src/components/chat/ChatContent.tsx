'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Image as ImageIcon, Paperclip, X, Loader2, Users, User, Shield, Package, Utensils } from 'lucide-react'
import { toast } from 'sonner'

type Message = {
  id: number
  sender: string
  text: string | null
  imageUrl: string | null
  createdAt: string
  groupId: string
}

const GROUPS = [
  { id: 'general', name: 'Umumiy Zavod (Hamma)', icon: Users, color: 'bg-blue-500' },
  { id: 'qa_warehouse', name: 'Sifat Nazorati & Ombor', icon: Shield, color: 'bg-emerald-500' },
  { id: 'kitchen_supply', name: 'Oshxona & Ta\'minot', icon: Utensils, color: 'bg-amber-500' }
]

const ROLES = [
  'Sifat Nazorati',
  'Oshxona',
  'Rahbariyat',
  'Omborxona',
  'Ta\'minotchi (Snabjenets)'
]

export default function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [activeGroup, setActiveGroup] = useState('general')
  const [myRole, setMyRole] = useState('')
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(true)
  
  const [text, setText] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load role from local storage
  useEffect(() => {
    const savedRole = localStorage.getItem('chat_role')
    if (savedRole) {
      setMyRole(savedRole)
      setIsRoleModalOpen(false)
    }
  }, [])

  function handleSaveRole(role: string) {
    localStorage.setItem('chat_role', role)
    setMyRole(role)
    setIsRoleModalOpen(false)
  }

  // Polling for messages
  useEffect(() => {
    if (isRoleModalOpen) return

    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [activeGroup, isRoleModalOpen])

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/chat?groupId=${activeGroup}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      // ignore
    }
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && !selectedImage) return

    const tempText = text
    const tempFile = selectedImage
    
    setText('')
    setSelectedImage(null)

    let imageUrl = null

    if (tempFile) {
      setUploadingImage(true)
      try {
        const formData = new FormData()
        formData.append('file', tempFile)
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        if (res.ok) {
          const data = await res.json()
          imageUrl = data.url
        } else {
          toast.error("Rasm yuklashda xatolik")
          setUploadingImage(false)
          return
        }
      } catch {
        toast.error("Rasm yuklashda xatolik")
        setUploadingImage(false)
        return
      }
      setUploadingImage(false)
    }

    try {
      const payload = {
        sender: myRole,
        text: tempText.trim() ? tempText : null,
        imageUrl,
        groupId: activeGroup
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        fetchMessages()
      }
    } catch {
      toast.error("Xabar yuborilmadi")
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-enter relative">
      {/* Role Selection Modal */}
      {isRoleModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-dark-800 p-6 rounded-2xl max-w-md w-full border border-dark-600 shadow-2xl">
            <h2 className="text-xl font-bold text-white text-center mb-2">Bo'limni tanlang</h2>
            <p className="text-slate-400 text-sm text-center mb-6">Chatga kirish uchun qaysi bo'limdan ekanligingizni belgilang:</p>
            <div className="flex flex-col gap-3">
              {ROLES.map(r => (
                <button 
                  key={r}
                  onClick={() => handleSaveRole(r)}
                  className="w-full py-3 bg-dark-900 border border-dark-700 hover:border-indigo-500 hover:bg-indigo-500/10 text-white rounded-xl transition-all"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 max-w-[280px] bg-dark-800 rounded-2xl border border-dark-700 flex flex-col overflow-hidden hidden md:flex">
          <div className="p-4 border-b border-dark-700 bg-dark-900/50">
            <h2 className="text-lg font-bold text-white">Guruhlar</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {GROUPS.map(g => {
              const Icon = g.icon
              const isActive = activeGroup === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup(g.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${isActive ? 'bg-dark-700 border-l-4 border-indigo-500' : 'hover:bg-dark-900 border-l-4 border-transparent text-slate-400'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${g.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${isActive ? 'text-white' : ''}`}>{g.name}</h3>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="p-4 border-t border-dark-700 bg-dark-900/50 text-center">
            <p className="text-xs text-slate-500">Sizning rolingiz:</p>
            <p className="text-sm text-indigo-400 font-medium cursor-pointer hover:underline" onClick={() => setIsRoleModalOpen(true)}>{myRole}</p>
          </div>
        </div>

        {/* Mobile Groups Dropdown */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 shrink-0">
          {GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all ${activeGroup === g.id ? 'bg-indigo-600 text-white' : 'bg-dark-800 text-slate-400 border border-dark-700'}`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-dark-800 rounded-2xl border border-dark-700 flex flex-col overflow-hidden shadow-xl">
          {/* Header */}
          <div className="p-4 border-b border-dark-700 bg-dark-900/80 flex items-center gap-3 shrink-0">
            {(() => {
              const g = GROUPS.find(x => x.id === activeGroup)
              if (!g) return null
              const Icon = g.icon
              return (
                <>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${g.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-white font-bold">{g.name}</h2>
                    <p className="text-xs text-emerald-400 font-medium">Real-time chat</p>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Users size={48} className="mb-4 opacity-20" />
                <p>Hali xabarlar yo'q. Birinchi bo'lib yozing!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender === myRole
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    {!isMe && <span className="text-xs text-slate-400 ml-1 mb-1 font-medium">{msg.sender}</span>}
                    <div className={`p-3 rounded-2xl shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-dark-700 text-slate-200 rounded-bl-sm border border-dark-600'}`}>
                      {msg.imageUrl && (
                        <div className="mb-2 -mx-1 -mt-1 relative overflow-hidden rounded-xl border border-black/10">
                          <img src={msg.imageUrl} alt="attachment" className="max-w-full max-h-[300px] object-cover" />
                        </div>
                      )}
                      {msg.text && <p className="whitespace-pre-wrap text-[15px]">{msg.text}</p>}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 mx-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-dark-900/80 border-t border-dark-700 shrink-0">
            {selectedImage && (
              <div className="mb-3 flex items-center gap-3 bg-dark-800 p-2 rounded-xl border border-dark-600 w-max">
                <div className="w-12 h-12 rounded bg-dark-900 overflow-hidden relative">
                  <img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-cover" alt="preview" />
                </div>
                <div className="flex flex-col pr-4">
                  <span className="text-xs text-slate-300 font-medium truncate max-w-[150px]">{selectedImage.name}</span>
                  <span className="text-[10px] text-emerald-400">Yuborishga tayyor</span>
                </div>
                <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-dark-700 rounded-full text-slate-400 transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <label className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl cursor-pointer transition-colors shrink-0 flex items-center justify-center">
                <Paperclip size={22} />
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={e => e.target.files && setSelectedImage(e.target.files[0])}
                />
              </label>
              
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                placeholder="Xabar yozish..."
                className="flex-1 bg-dark-800 border border-dark-600 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none max-h-[120px] min-h-[44px]"
                rows={1}
              />
              
              <button 
                type="submit"
                disabled={(!text.trim() && !selectedImage) || uploadingImage}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shrink-0 flex items-center justify-center"
              >
                {uploadingImage ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
