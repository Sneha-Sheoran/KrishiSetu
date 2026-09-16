'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Send, User } from 'lucide-react'

export default function MessagingPage({ params }: { params: Promise<{ id: string }> }) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<any>(null)
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [convId, setConvId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => setConvId(id))
  }, [params])

  useEffect(() => {
    if (!convId) return

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      // Fetch initial messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      
      if (msgs) setMessages(msgs)

      // Fetch conversation details
      const { data: conv } = await supabase
        .from('conversations')
        .select('*, marketplace_listings(crop_name, quantity, expected_price, unit)')
        .eq('id', convId)
        .single()
      
      if (conv) setConversation(conv)
    }

    setup()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [convId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userId || !convId) return

    const msg = newMessage
    setNewMessage('') // optimistic clear

    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: userId,
      message: msg
    })
  }

  if (!conversation) return <div className="p-8 text-center">Loading conversation...</div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="bg-white rounded-t-2xl shadow-sm border border-emerald-100 p-4 flex justify-between items-center z-10 relative">
        <div>
          <h2 className="font-bold text-emerald-950 text-lg">
            Negotiation: {conversation.marketplace_listings?.crop_name}
          </h2>
          <p className="text-emerald-700 text-sm">
            {conversation.marketplace_listings?.quantity} {conversation.marketplace_listings?.unit} @ ₹{conversation.marketplace_listings?.expected_price}
          </p>
        </div>
      </div>

      <div className="flex-grow bg-emerald-50/30 overflow-y-auto p-4 space-y-4 border-x border-emerald-100 flex flex-col">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === userId
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              }`}>
                <p>{msg.message}</p>
                <span className={`text-[10px] block mt-1 ${isMe ? 'text-emerald-200 text-right' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm border border-emerald-100 p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..." 
            className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
