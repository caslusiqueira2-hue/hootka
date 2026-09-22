import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { quizApi } from '@/lib/api'
import type { Quiz } from '@/types'

// ─── NewGame Screen ────────────────────────────────────────────────────────

const SUBJECTS = ['Todos', 'Matemática', 'História', 'Ciências', 'Português', 'Geografia', 'Artes', 'Inglês']

export default function NewGame() {
  const navigate = useNavigate()
  const setSelectedQuiz = useGameStore((s) => s.setSelectedQuiz)

  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('Todos')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    quizApi
      .getAll()
      .then((data) => setQuizzes(data))
      .catch(() => setError('Erro ao carregar quizzes'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = quizzes.filter((q) => {
    const matchesSearch =
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      (q.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesSubject = subjectFilter === 'Todos' || q.subject === subjectFilter
    return matchesSearch && matchesSubject
  })

  const handleSelect = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    navigate('/game/setup', { state: { quizId: quiz.id } })
  }

  const estimatedTime = (count: number, seconds = 30) => {
    const total = count * (seconds + 15)
    const mins = Math.ceil(total / 60)
    return `~${mins} min`
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {/* Header */}
      <header className="border-b-4 border-[#0A0A0A] bg-[#FFD600] px-8 py-5 flex items-center gap-6 shadow-[0_4px_0_#0A0A0A]">
        <button
          onClick={() => navigate(-1)}
          className="border-3 border-[#0A0A0A] bg-white px-4 py-2 font-black text-sm
            shadow-[4px_4px_0_#0A0A0A] hover:shadow-[2px_2px_0_#0A0A0A] hover:translate-x-[2px]
            hover:translate-y-[2px] active:shadow-none active:translate-x-1 active:translate-y-1
            transition-all duration-100 uppercase"
          style={{ border: '3px solid #0A0A0A' }}
        >
          ← VOLTAR
        </button>
        <h1 className="text-4xl font-black tracking-tight uppercase">NOVO JOGO</h1>
        <span className="ml-auto text-sm font-bold opacity-60">{quizzes.length} quizzes disponíveis</span>
      </header>

      {/* Search & Filter */}
      <div className="px-8 py-6 flex flex-wrap gap-4 items-center border-b-2 border-[#0A0A0A]">
        <input
          type="text"
          placeholder="🔍 Buscar quiz..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] border-3 border-[#0A0A0A] px-4 py-3 text-base font-bold
            bg-white shadow-[4px_4px_0_#0A0A0A] outline-none focus:shadow-[6px_6px_0_#0A0A0A]
            transition-shadow placeholder:font-normal placeholder:text-gray-400"
          style={{ border: '3px solid #0A0A0A' }}
        />
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s)}
              className={`px-4 py-2 border-2 border-[#0A0A0A] font-bold text-sm uppercase transition-all
                ${subjectFilter === s
                  ? 'bg-[#0A0A0A] text-white shadow-none translate-x-0.5 translate-y-0.5'
                  : 'bg-white shadow-[3px_3px_0_#0A0A0A] hover:shadow-[1px_1px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 border-4 border-[#0A0A0A] border-t-transparent rounded-full"
            />
          </div>
        )}

        {error && (
          <div
            className="border-3 border-[#FF3B00] bg-red-50 px-6 py-4 font-bold text-[#FF3B00]"
            style={{ border: '3px solid #FF3B00' }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <span className="text-6xl">📭</span>
            <p className="font-black text-xl uppercase text-gray-500">Nenhum quiz encontrado</p>
          </div>
        )}

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {filtered.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="border-3 border-[#0A0A0A] bg-white shadow-[6px_6px_0_#0A0A0A] flex flex-col"
                style={{ border: '3px solid #0A0A0A' }}
              >
                {/* Card header */}
                <div className="bg-[#1A1AFF] px-4 py-3 border-b-3 border-[#0A0A0A]" style={{ borderBottom: '3px solid #0A0A0A' }}>
                  <h2 className="font-black text-white text-sm uppercase truncate">{quiz.name}</h2>
                </div>

                {/* Card body */}
                <div className="flex-1 p-4 space-y-3">
                  {quiz.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{quiz.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {quiz.subject && (
                      <span
                        className="px-2 py-1 text-xs font-black uppercase border-2 border-[#0A0A0A] bg-[#FFD600]"
                        style={{ border: '2px solid #0A0A0A' }}
                      >
                        {quiz.subject}
                      </span>
                    )}
                    {quiz.theme && (
                      <span
                        className="px-2 py-1 text-xs font-bold uppercase border-2 border-[#0A0A0A] bg-[#F5F0E8]"
                        style={{ border: '2px solid #0A0A0A' }}
                      >
                        {quiz.theme}
                      </span>
                    )}
                    {quiz.grade && (
                      <span
                        className="px-2 py-1 text-xs font-bold uppercase border-2 border-[#0A0A0A] bg-[#00C851] text-white"
                        style={{ border: '2px solid #0A0A0A' }}
                      >
                        {quiz.grade}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs font-bold text-gray-600">
                    <span>📝 {quiz.question_count ?? '?'} questões</span>
                    <span>⏱ {estimatedTime(quiz.question_count ?? 10)}</span>
                  </div>
                </div>

                {/* Card action */}
                <div className="p-4 border-t-2 border-[#0A0A0A]" style={{ borderTop: '2px solid #0A0A0A' }}>
                  <button
                    onClick={() => handleSelect(quiz)}
                    className="w-full py-3 border-3 border-[#0A0A0A] bg-[#FFD600] font-black uppercase
                      text-sm shadow-[4px_4px_0_#0A0A0A] hover:shadow-[2px_2px_0_#0A0A0A]
                      hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none
                      active:translate-x-1 active:translate-y-1 transition-all duration-100"
                    style={{ border: '3px solid #0A0A0A' }}
                  >
                    SELECIONAR
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
