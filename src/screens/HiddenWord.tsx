import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton'
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard'
import {
  hiddenWordRanking, splitHiddenAnswer, type HiddenWordMatch, type HiddenWordRound,
} from '@/engine/hiddenWord'
import { useHiddenWordStore } from '@/stores/hiddenWordStore'
import { useSettingsStore } from '@/stores/settingsStore'
import '@/styles/hiddenWord.css'

type DialogKind = 'award' | 'correct' | 'finish'
type RankedGroup = ReturnType<typeof hiddenWordRanking>[number]

function Ranking({ groups, final = false }: { groups: RankedGroup[]; final?: boolean }) {
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

function GroupSetup({ groups }: { groups: HiddenWordMatch['groups'] }) {
  const dispatch = useHiddenWordStore((state) => state.dispatch)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const nameInput = useRef<HTMLInputElement>(null)

  function saveGroup(event: FormEvent) {
    event.preventDefault()
    if (dispatch({ type: 'saveGroup', id: editing ?? crypto.randomUUID(), name })) {
      setName('')
      setEditing(null)
      nameInput.current?.focus()
    }
  }

  function startEditing(id: string, currentName: string) {
    setEditing(id)
    setName(currentName)
    nameInput.current?.focus()
  }

  function removeGroup(id: string) {
    dispatch({ type: 'removeGroup', id })
    if (editing === id) {
      setEditing(null)
      setName('')
    }
  }

  return (
    <NeoBrutalistCard className="hw-panel">
      <h2>Grupos da partida</h2>
      <form className="hw-form" onSubmit={saveGroup}>
        <label htmlFor="hw-group">{editing ? 'Editar nome do grupo' : 'Nome do grupo'}</label>
        <div className="hw-actions">
          <input className="neo-input" id="hw-group" ref={nameInput} value={name}
            autoComplete="off" placeholder="Ex.: Grupo 1" required onChange={(event) => setName(event.target.value)} />
          <NeoBrutalistButton type="submit" disabled={!name.trim()}>
            {editing ? 'Salvar nome' : 'Adicionar grupo'}
          </NeoBrutalistButton>
          {editing && (
            <NeoBrutalistButton variant="ghost" onClick={() => { setName(''); setEditing(null) }}>
              Cancelar edição
            </NeoBrutalistButton>
          )}
        </div>
      </form>
      {groups.length > 0 && (
        <ul className="hw-group-list">
          {groups.map((group) => (
            <li key={group.id}>
              <strong>{group.name}</strong>
              <span className="hw-points">0 pontos</span>
              <div className="hw-actions">
                <button className="neo-btn neo-btn-surface neo-btn-sm" type="button"
                  aria-label={'Editar ' + group.name} onClick={() => startEditing(group.id, group.name)}>Editar</button>
                <button className="neo-btn neo-btn-surface neo-btn-sm" type="button"
                  aria-label={'Excluir ' + group.name} onClick={() => removeGroup(group.id)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="hw-actions">
        <NeoBrutalistButton variant="secondary" size="lg" disabled={!groups.length || editing !== null}
          onClick={() => dispatch({ type: 'compose' })}>Cadastrar primeira pergunta</NeoBrutalistButton>
      </div>
    </NeoBrutalistCard>
  )
}

function RoundBoard({ round }: { round: HiddenWordRound }) {
  const animations = useSettingsStore((state) => state.animationsEnabled)
  const { parts } = useMemo(() => splitHiddenAnswer(round.answer), [round.answer])

  return (
    <section className="neo-card hw-board" aria-labelledby="hw-question">
      <h2 id="hw-question">{round.question}</h2>
      <div className="hw-answer" aria-label="Resposta" aria-live="polite" aria-atomic="true">
        {parts.map(({ text, masked, wordIndex }, index) => {
          if (wordIndex === null) return text
          const revealed = wordIndex < round.revealed
          return (
            <span key={index} className="hw-word">
              {revealed
                ? <span className={animations ? 'hw-revealed hw-reveal' : 'hw-revealed'}>{text}</span>
                : masked}
            </span>
          )
        })}
      </div>
    </section>
  )
}

function TeacherDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    const trigger = document.activeElement
    element.showModal()
    return () => {
      element.close()
      if (trigger instanceof HTMLElement) trigger.focus()
    }
  }, [])

  return (
    <dialog ref={dialog} className="neo-card hw-dialog" aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose() }}>
      <h2 id={titleId}>{title}</h2>
      <div className="hw-dialog-content">{children}</div>
    </dialog>
  )
}

function ScoreDialog({ kind, match, ranking, onClose }: {
  kind: 'award' | 'correct'
  match: HiddenWordMatch
  ranking: RankedGroup[]
  onClose: () => void
}) {
  const dispatch = useHiddenWordStore((state) => state.dispatch)
  const [groupId, setGroupId] = useState('')
  const [awardId, setAwardId] = useState('')
  const [amount, setAmount] = useState('')
  const [invalid, setInvalid] = useState(false)
  const awards = match.awards.slice().reverse()
  const correcting = kind === 'correct'

  function submit(points: number) {
    const action = correcting
      ? { type: 'correct' as const, id: awardId, points }
      : { type: 'award' as const, id: crypto.randomUUID(), groupId, points }
    if (dispatch(action)) onClose()
    else setInvalid(true)
  }

  return (
    <TeacherDialog title={correcting ? 'Corrigir pontuação' : 'Pontuar grupo'} onClose={onClose}>
      <form className="hw-form" onSubmit={(event) => { event.preventDefault(); submit(Number(amount)) }}>
        {correcting ? (
          <>
            <label htmlFor="hw-award">Lançamento</label>
            <select className="neo-input" id="hw-award" required value={awardId} onChange={(event) => {
              const selected = awards.find((award) => award.id === event.target.value)
              setAwardId(event.target.value)
              setAmount(selected ? String(selected.points) : '')
              setInvalid(false)
            }}>
              <option value="">Escolha um lançamento</option>
              {awards.map((award) => (
                <option key={award.id} value={award.id}>
                  {ranking.find((group) => group.id === award.groupId)?.name} · Rodada {award.roundIndex + 1} · +{award.points}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label htmlFor="hw-score-group">Grupo</label>
            <select className="neo-input" id="hw-score-group" value={groupId} required
              onChange={(event) => { setGroupId(event.target.value); setInvalid(false) }}>
              <option value="">Escolha um grupo</option>
              {ranking.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.score} {group.score === 1 ? 'ponto' : 'pontos'})
                </option>
              ))}
            </select>
            <div className="hw-actions">
              {[1, 2, 3].map((points) => (
                <NeoBrutalistButton key={points} disabled={!groupId} onClick={() => submit(points)}>
                  +{points} {points === 1 ? 'ponto' : 'pontos'}
                </NeoBrutalistButton>
              ))}
            </div>
          </>
        )}
        <label htmlFor="hw-points">{correcting ? 'Novo valor (0 remove o lançamento)' : 'Pontuação personalizada'}</label>
        <input className="neo-input" id="hw-points" type="number" step="1" min={correcting ? 0 : 1}
          value={amount} required onChange={(event) => { setAmount(event.target.value); setInvalid(false) }} />
        {invalid && <p role="alert">Informe uma quantidade inteira de pontos válida para este grupo.</p>}
        <div className="hw-actions">
          <NeoBrutalistButton type="submit" variant="secondary" disabled={!(correcting ? awardId : groupId) || !amount}>
            {correcting ? 'Salvar correção' : 'Atribuir pontos'}
          </NeoBrutalistButton>
          <NeoBrutalistButton variant="ghost" onClick={onClose}>Fechar</NeoBrutalistButton>
        </div>
      </form>
    </TeacherDialog>
  )
}

export default function HiddenWord() {
  const { match, load, loadError, saveError, retrySave, dispatch } = useHiddenWordStore()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [dialog, setDialog] = useState<DialogKind | null>(null)
  const ranking = useMemo(() => match ? hiddenWordRanking(match) : [], [match])

  useEffect(() => { void load() }, [load])

  function addRound(event: FormEvent) {
    event.preventDefault()
    if (dispatch({ type: 'addRound', question, answer })) {
      setQuestion('')
      setAnswer('')
    }
  }

  const round = match?.phase === 'round' ? match.rounds[match.roundIndex] : null
  const wordCount = round ? splitHiddenAnswer(round.answer).wordCount : 0
  const allRevealed = round?.revealed === wordCount
  const closeDialog = () => setDialog(null)

  return (
    <div className="hw-screen">
      <header className="hw-header">
        <Link className="neo-btn neo-btn-surface neo-btn-sm" to="/game/new">← Novo jogo</Link>
        <h1>Palavra Oculta</h1>
        {round && <p className="hw-round-number">Rodada {match!.roundIndex + 1}</p>}
      </header>

      <main className="hw-main">
        {loadError && (
          <div className="hw-status" role="alert">
            <p>Não foi possível carregar a partida.</p>
            <NeoBrutalistButton onClick={() => { void load() }}>Tentar novamente</NeoBrutalistButton>
          </div>
        )}
        {!match && !loadError && <p role="status">Carregando partida…</p>}
        {saveError && (
          <div className="hw-status" role="alert">
            <p>Não foi possível salvar o progresso neste dispositivo.</p>
            <NeoBrutalistButton onClick={retrySave}>Tentar salvar</NeoBrutalistButton>
          </div>
        )}

        {match?.phase === 'groups' && <GroupSetup groups={match.groups} />}

        {match?.phase === 'compose' && (
          <div className="hw-layout">
            <NeoBrutalistCard className="hw-panel">
              <h2>Cadastrar pergunta {match.rounds.length + 1}</h2>
              <form className="hw-form" onSubmit={addRound}>
                <label htmlFor="hw-prompt">Pergunta</label>
                <textarea className="neo-textarea" id="hw-prompt" rows={3} required value={question}
                  onChange={(event) => setQuestion(event.target.value)} />
                <label htmlFor="hw-response">Resposta</label>
                <input className="neo-input" id="hw-response" type="password" autoComplete="off" required
                  value={answer} onChange={(event) => setAnswer(event.target.value)} />
                <div className="hw-actions">
                  <NeoBrutalistButton type="submit" variant="secondary" size="lg"
                    disabled={!question.trim() || !splitHiddenAnswer(answer).wordCount}>Continuar</NeoBrutalistButton>
                  <NeoBrutalistButton variant="ghost" onClick={() => dispatch({ type: 'previous' })}>
                    {match.rounds.length ? 'Pergunta anterior' : 'Voltar aos grupos'}
                  </NeoBrutalistButton>
                </div>
              </form>
              {!!match.rounds.length && (
                <div className="hw-actions">
                  <NeoBrutalistButton variant="ghost" disabled={!match.awards.length}
                    onClick={() => setDialog('correct')}>Corrigir pontuação</NeoBrutalistButton>
                  <NeoBrutalistButton variant="ghost" onClick={() => setDialog('finish')}>Encerrar partida</NeoBrutalistButton>
                </div>
              )}
            </NeoBrutalistCard>
            <Ranking groups={ranking} />
          </div>
        )}

        {match && round && (
          <>
            <div className="hw-layout hw-play">
              <RoundBoard key={match.roundIndex} round={round} />
              <Ranking groups={ranking} />
            </div>
            <div className="hw-controls" role="group" aria-label="Controles do professor">
              <div className="hw-actions">
                <NeoBrutalistButton disabled={allRevealed}
                  onClick={() => dispatch({ type: 'reveal', count: round.revealed + 1 })}>Revelar próxima palavra</NeoBrutalistButton>
                <NeoBrutalistButton variant="ghost" disabled={allRevealed}
                  onClick={() => dispatch({ type: 'reveal', count: wordCount })}>Revelar tudo</NeoBrutalistButton>
                <NeoBrutalistButton variant="secondary" onClick={() => setDialog('award')}>Pontuar grupo</NeoBrutalistButton>
                <NeoBrutalistButton variant="ghost" onClick={() => dispatch({ type: 'next' })}>Próxima pergunta</NeoBrutalistButton>
              </div>
              <div className="hw-actions">
                <NeoBrutalistButton size="sm" variant="ghost" disabled={match.roundIndex === 0}
                  onClick={() => dispatch({ type: 'previous' })}>Pergunta anterior</NeoBrutalistButton>
                <NeoBrutalistButton size="sm" variant="ghost" disabled={!round.revealed}
                  onClick={() => dispatch({ type: 'reveal', count: 0 })}>Reiniciar rodada</NeoBrutalistButton>
                <NeoBrutalistButton size="sm" variant="ghost" disabled={!match.awards.length}
                  onClick={() => setDialog('correct')}>Corrigir pontuação</NeoBrutalistButton>
                <NeoBrutalistButton size="sm" variant="ghost" onClick={() => setDialog('finish')}>Encerrar partida</NeoBrutalistButton>
              </div>
            </div>
          </>
        )}

        {match?.phase === 'results' && (
          <div className="hw-results">
            <Ranking groups={ranking} final />
            <div className="hw-actions">
              <NeoBrutalistButton size="lg" onClick={() => {
                if (dispatch({ type: 'newMatch' })) { setQuestion(''); setAnswer('') }
              }}>Iniciar nova partida</NeoBrutalistButton>
            </div>
          </div>
        )}
      </main>

      {match && dialog && (dialog === 'finish' ? (
        <TeacherDialog title="Encerrar partida?" onClose={closeDialog}>
          <p>O placar acumulado será exibido como resultado final.</p>
          <div className="hw-actions">
            <NeoBrutalistButton variant="ghost" onClick={closeDialog}>Voltar à partida</NeoBrutalistButton>
            <NeoBrutalistButton variant="secondary" onClick={() => { dispatch({ type: 'finish' }); closeDialog() }}>
              Exibir resultado
            </NeoBrutalistButton>
          </div>
        </TeacherDialog>
      ) : <ScoreDialog key={dialog} kind={dialog} match={match} ranking={ranking} onClose={closeDialog} />)}
    </div>
  )
}
