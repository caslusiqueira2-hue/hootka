import type { HiddenWordRankedGroup, ProjectedHiddenWordRound } from '@/lib/hiddenWordProjection'

export function HiddenWordRanking({ groups, final = false }: { groups: HiddenWordRankedGroup[]; final?: boolean }) {
  return (
    <section className={'neo-card hw-ranking' + (final ? ' hw-ranking-final' : '')} aria-labelledby="hw-ranking-title">
      <h2 id="hw-ranking-title">{final ? 'Placar final' : 'Placar'}</h2>
      <ol className="hw-ranking-list" aria-live="polite">
        {groups.map((group) => (
          <li key={group.id}>
            <span className="hw-place">{group.place}º</span>
            <strong>{group.name}</strong>
            <span className="hw-points">{group.score} {group.score === 1 ? 'ponto' : 'pontos'}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function HiddenWordBoard({ round, onReveal, animations = true }: {
  round: ProjectedHiddenWordRound
  onReveal?: (position: number) => void
  animations?: boolean
}) {
  return (
    <section className="neo-card hw-board" aria-labelledby="hw-question">
      <header>
        <h2 id="hw-question">Pergunta oculta</h2>
        {onReveal && round.answer === undefined && <p>Clique na posição pedida pelo grupo.</p>}
      </header>
      <div className="hw-question-slots" role="group" aria-label="Posições da pergunta">
        {round.parts.map(({ text, position, revealed }, index) => {
          if (position === null) return text
          const word = (
            <>
              <span className="hw-position" aria-hidden="true">{position}</span>
              <span className={revealed ? (animations ? 'hw-revealed hw-reveal' : 'hw-revealed') : undefined}>
                {text}
              </span>
            </>
          )
          return onReveal ? (
            <button key={index} type="button" className="hw-slot"
              disabled={revealed || round.answer !== undefined}
              aria-label={revealed ? `Posição ${position}: ${text}` : `Revelar posição ${position}`}
              onClick={() => onReveal(position)}>
              {word}
            </button>
          ) : (
            <span key={index} className="hw-slot" aria-label={`Posição ${position}`}>{word}</span>
          )
        })}
      </div>
      <p className="sr-only" role="status">{round.parts.map(({ text }) => text).join('')}</p>
      {round.answer !== undefined && (
        <div className="hw-solution" role="status">
          <span>Resposta correta</span>
          <strong>{round.answer}</strong>
        </div>
      )}
    </section>
  )
}
