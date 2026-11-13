import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { HiddenWordBoard, HiddenWordRanking } from '@/components/game/HiddenWordBoard'
import { projectionTargetOrigin, type HiddenWordProjection } from '@/lib/hiddenWordProjection'
import '@/styles/hiddenWord.css'

export default function HiddenWordProjector() {
  const { sessionId } = useParams()
  const [projection, setProjection] = useState<HiddenWordProjection>({ phase: 'waiting' })

  useEffect(() => {
    document.title = 'Palavra Oculta | Projeção'
    const teacher = window.opener
    const origin = projectionTargetOrigin()
    if (!teacher || !sessionId) return

    function receive(event: MessageEvent) {
      if (event.source !== teacher || (origin !== '*' && event.origin !== origin)) return
      if (event.data?.type !== 'hidden-word-projection' || event.data.id !== sessionId) return
      setProjection(event.data.projection)
    }

    window.addEventListener('message', receive)
    teacher.postMessage({ type: 'hidden-word-projection-ready', id: sessionId }, origin)
    const monitor = window.setInterval(() => {
      if (teacher.closed) setProjection({ phase: 'waiting' })
    }, 1000)
    return () => {
      window.removeEventListener('message', receive)
      window.clearInterval(monitor)
    }
  }, [sessionId])

  return (
    <div className="hw-screen hw-projector">
      <header className="hw-header">
        <h1>Palavra Oculta</h1>
        {projection.phase === 'round' && <p className="hw-round-number">Rodada {projection.number}</p>}
        {document.fullscreenEnabled && (
          <button type="button" className="neo-btn neo-btn-surface neo-btn-sm hw-fullscreen"
            onClick={() => {
              const fullscreen = document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen()
              void fullscreen.catch(() => {})
            }}>Alternar tela cheia</button>
        )}
      </header>
      <main className="hw-main">
        {projection.phase === 'waiting' && (
          <section className="neo-card hw-board hw-projector-waiting">
            <h2 role="status">Aguardando a próxima pergunta</h2>
          </section>
        )}
        {projection.phase === 'round' && (
          <HiddenWordBoard key={projection.number} round={projection.round} />
        )}
        {projection.phase === 'results' && (
          <div className="hw-results"><HiddenWordRanking groups={projection.ranking} final /></div>
        )}
      </main>
    </div>
  )
}
